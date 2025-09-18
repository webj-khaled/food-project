// Import necessary types and Appwrite SDK components
import { CreateUserParams, GetMenuParams, SignInParams } from "@/type";
import { Account, Avatars, Client, Databases, ID, Query, Storage } from "react-native-appwrite";



// Appwrite configuration object containing all necessary IDs and settings
export const appwriteConfig = {
    // Appwrite server endpoint (from environment variables)
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
    // Appwrite project ID (from environment variables)
    projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
    // Platform identifier for the app (reverse domain notation)
    platform: "com.webjkhaled.food-project",
    // Database ID where user data will be stored
    databaseId: '686f0aff0005819e5cb3',
    // Storage bucket ID for file uploads
    bucketId: '687b9e2a002191f0d3f1',
    // Collection ID for user documents
    userCollectionId: '686f0b680039886fe20f',
    // Collection ID for food categories
    categoriesCollectionId: '687b96bd0027e18c4268',
    // Collection ID for menu items
    menuCollectionId: '687b975b001c28b5b3f3',
    // Collection ID for food customizations
    customizationsCollectionId: '687b98760005bc838ef5',
    // Collection ID for menu-customization relationships
    menuCustomizationsCollectionId: '687b993200213f35ae9a',
    // Collection ID for food listings
    food_listingId: "688955c100006a5c5b1f",
    // Collection ID for special requests
    special_requestsId: "68a7b41e0011a858540b",
    // NEW: Offers collection ID
    offersCollectionId: "68abda77002a826b775a" 
}
console.log("Using Appwrite endpoint:", appwriteConfig.endpoint);

// Initialize the Appwrite client
export const client = new Client();

// Configure the client with settings from appwriteConfig
client
    .setEndpoint(appwriteConfig.endpoint!) // Set server URL
    .setProject(appwriteConfig.projectId!) // Set project ID
    .setPlatform(appwriteConfig.platform!) // Set platform identifier

// Initialize Appwrite services using the configured client
export const account = new Account(client); // For user authentication
export const databases = new Databases(client); // For database operations
export const storage = new Storage(client); // For file storage
const avatars = new Avatars(client); // For avatar generation (internal use)

/**
 * Creates a new user in Appwrite and stores user data in the database
 * @param {CreateUserParams} params - User details including email, password, and name
 * @returns {Promise} Promise that resolves with the created user document
 * @throws {Error} If account creation or document creation fails
 */


export const createUser = async ({ email, password, name }: CreateUserParams) => {
    try {
        // Step 1: Create a new user account in Appwrite authentication
        const newAccount = await account.create(
            ID.unique(),
            email, 
            password, 
            name
        );
        
        if (!newAccount) throw new Error("Account creation failed.");

        // REMOVE THIS LINE - Don't sign in automatically
        // await signIn({ email, password });

        // Step 3: Generate avatar URL
        const avatarUrl = `${appwriteConfig.endpoint}/avatars/initials?name=${encodeURIComponent(name)}&project=${appwriteConfig.projectId}`;

        // Step 4: Create a user document in the database
        const userDoc = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            {
                email, 
                name, 
                account: newAccount.$id,
                avatar: avatarUrl
            }
        );

        console.log('User document created successfully:', userDoc);
        return userDoc;

    } catch (e) {
        console.log('Error in createUser:', e);
        throw new Error(e as string);
    }
}

export const signIn = async ({ email, password }: SignInParams) => {
    try {
        // Create email/password session in Appwrite
        const session = await account.createEmailPasswordSession(email, password);
        return session;
    } catch (e) {
        throw new Error(e as string);
    }
}

export const getCurrentUser = async () => {
    try {
        const currentAccount = await account.get();
        console.log('Appwrite account:', currentAccount);
        if(!currentAccount) throw Error;

        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal('account', currentAccount.$id)]
        )
        console.log('Database query result:', currentUser);

        if(!currentUser) throw Error;

        return currentUser.documents[0];
    } catch (e) {
        console.log('Error in getCurrentUser:', e);
        throw new Error(e as string);
    }
}

export const getMenu = async ({ category, query }: GetMenuParams) => {
    try {
        const queries: string[] = [];

        if(category) queries.push(Query.equal('categories', category));
        if(query) queries.push(Query.search('name', query));

        const menus = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.menuCollectionId,
            queries,
        )

        return menus.documents;
    } catch (e) {
        throw new Error(e as string);
    }
};

export const getCategories = async () => {
    try {
        const categories = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.categoriesCollectionId,
        )

        return categories.documents;
    } catch (e) {
        throw new Error(e as string);
    }
};



/**
 * Creates a new food listing
 * @param {Object} params - Food listing details
 * @returns {Promise} Created listing document
 */
export const createFoodListing = async (listing: {
  name: string;
  description: string;
  foodImage?: string | null;  // Optional
  certificateImage: string;   // Required
  number: string;
  price: number;
  category?: string;
  sellerId: string;
  location: string; // NEW FIELD
}) => {
  try {
    // Validate required fields
    if (!listing.certificateImage?.trim()) {
      throw new Error('Cook certificate is required');
    }

    const now = new Date().toISOString();
    
    const result = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.food_listingId,
      ID.unique(),
      {
        ...listing,
        foodImage: listing.foodImage || null, // Ensure null instead of undefined
        status: 'active', // Directly active without approval
        createdAt: now,
        updatedAt: now,
        location: listing.location // NEW FIELD
      }
    );

    return {
      ...result,
      foodImage: result.foodImage || null // Consistent return type
    };

  } catch (error: any) {
    console.error('[Appwrite] Create listing error:', error);
    throw new Error(
      error.message.includes('required') 
        ? error.message 
        : 'Failed to create listing. Please try again.'
    );
  }
};

/**
 * Gets all food listings for a specific seller
 * @param {string} sellerId - The ID of the seller/user
 * @returns {Promise} Array of listing documents
 */
export const getSellerListings = async (sellerId: string) => {
  try {
    console.log('[Appwrite] Fetching listings for seller:', sellerId);
    
    if (!sellerId?.trim()) {
      throw new Error('Invalid seller ID');
    }

    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.food_listingId,
      [
        Query.equal('sellerId', sellerId),
        Query.orderDesc('$createdAt')
      ]
    );

    console.log('[Appwrite] Listings fetched:', response.documents.length);
    return response.documents.map(doc => ({
      ...doc,
      id: doc.$id, // Ensure 'id' field exists
      sellerId: typeof doc.sellerId === 'string' ? doc.sellerId : doc.sellerId?.$id,
      status: doc.status || 'active'
    }));
  } catch (error: any) {
    console.error('[Appwrite] Fetch error:', error);
    throw new Error(`Failed to fetch listings: ${error.message}`);
  }
};

/**
 * Updates a food listing
 * @param {string} listingId - ID of the listing to update
 * @param {Object} updates - Fields to update
 * @returns {Promise} Updated listing document
 */
/**
 * Updates food listing with automatic timestamp and optional status
 * @param listingId ID of the listing to update
 * @param updates Fields to update (all optional)
 * @returns Updated listing document
 */
export const updateFoodListing = async (
  listingId: string,
  updates: {
    name?: string;
    description?: string;
    number?: string;
    price?: number;
    category?: string;
    images?: string[];
    status?: 'active' | 'inactive';
  }
) => {
  try {
    
    return await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.food_listingId,
      listingId,
      {
        ...updates,
        updatedAt: new Date().toISOString() // Always update timestamp
      }
    );
  } catch (error: any) {
    console.error('[Appwrite] Update error:', error);
    throw new Error(error.message || 'Failed to update listing');
  }
};

/**
 * Optimized status-only update with timestamp
 * @param listingId ID of the listing to update
 * @param newStatus New visibility status
 * @returns Updated listing document
 */
export const updateListingStatus = async (
  listingId: string,
  newStatus: 'active' | 'inactive'
) => {
  try {
    const now = new Date().toISOString();
    
    return await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.food_listingId,
      listingId,
      {
        status: newStatus,
        updatedAt: now
      }
    );
  } catch (error: any) {
    console.error('[Appwrite] Status update error:', error);
    throw new Error(error.message || 'Failed to update status');
  }
};

/**
 * Deletes a food listing
 * @param {string} listingId - ID of the listing to delete
 * @returns {Promise} Empty response on success
 */
export const deleteFoodListing = async (listingId: string, currentUserId: string) => {
  try {
    // 1. First verify ownership
    const listing = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.food_listingId,
      listingId
    );

    const ownerId = typeof listing.sellerId === 'string' 
      ? listing.sellerId 
      : listing.sellerId?.$id;

    if (ownerId !== currentUserId) {
      throw new Error('From appwrite: permission_denied: You can only delete your own listings');
    }

    // 2. Proceed with deletion if ownership confirmed
    const deletePromises = [];
    
    if (listing.foodImage) {
      const foodFileId = extractFileIdFromUrl(listing.foodImage);
      deletePromises.push(storage.deleteFile(appwriteConfig.bucketId, foodFileId));
    }

    if (listing.certificateImage) {
      const certFileId = extractFileIdFromUrl(listing.certificateImage);
      deletePromises.push(storage.deleteFile(appwriteConfig.bucketId, certFileId));
    }

    await Promise.all(deletePromises);
    
    return await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.food_listingId,
      listingId
    );

  } catch (error) {
    console.error('From appwrite: [DELETE] Failed:', error);
    throw error; // Re-throw for parent to handle
  }
};

// Helper function to extract file ID from storage URL
const extractFileIdFromUrl = (url: string) => {
  const matches = url.match(/files\/([^/]+)\/view/);
  return matches ? matches[1] : '';
};

/**
 * Gets all food listings (for marketplace/browsing)
 * @param {Object} filters - Optional filters
 * @returns {Promise} Array of listing documents
 */
export const getAllListings = async (filters?: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  includeInactive?: boolean; // New optional filter
}) => {
  try {
    const queries = [
      Query.equal('status', 'active') // Default filter
    ];
    
    if (filters?.includeInactive) {
      queries.pop(); // Remove the status filter
    }
    
    if (filters?.category) {
      queries.push(Query.equal('category', filters.category));
    }
    if (filters?.minPrice) {
      queries.push(Query.greaterThanEqual('price', filters.minPrice));
    }
    if (filters?.maxPrice) {
      queries.push(Query.lessThanEqual('price', filters.maxPrice));
    }

    const listings = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.food_listingId,
      queries
    );
    
    return listings.documents;
  } catch (error) {
    throw new Error('Failed to fetch listings');
  }
};

export const getActiveListings = async () => {
  try {
    return await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.food_listingId,
      [
        Query.equal('status', 'active'), // Only active listings
      ]
    );
  } catch (error) {
    console.error('[Appwrite] getActiveListings error:', error);
    throw error;
  }
};


export const uploadImage = async (uri: string, type: 'food' | 'certificate') => {
  try {
    // Validate file size
    const fileInfo = await FileSystem.getInfoAsync(uri);
    const maxSize = type === 'certificate' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    
    if (fileInfo.size > maxSize) {
      throw new Error(
        type === 'certificate' 
          ? 'Certificate must be under 5MB' 
          : 'Food image must be under 10MB'
      );
    }

    // Validate file type (NEW - placed BEFORE upload)
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const fileExtension = uri.split('.').pop()?.toLowerCase();
    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      throw new Error(`Only ${validExtensions.join(', ')} images are allowed`);
    }

    // Continue with upload...
    const file = {
      uri,
      name: `${type}_${ID.unique()}.${fileExtension}`, // Use validated extension
      type: `image/${fileExtension}`,
      size: fileInfo.size,
    };

    const result = await storage.createFile(
      appwriteConfig.bucketId,
      ID.unique(),
      file
    );

    return `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucketId}/files/${result.$id}/view?project=${appwriteConfig.projectId}`;
  } catch (error) {
    console.error(`${type} upload failed:`, error);
    throw error;
  }
};

/**
 * Toggles listing status (active/inactive) with ownership validation
 * @param listingId - The document ID to update
 * @param currentUserId - Logged-in user's ID (for permission check)
 * @returns Updated document
 */
export const toggleListingStatus = async (listingId: string, sellerId: string) => {
  try {
    const currentDoc = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.food_listingId,
      listingId
    );

    // Normalize both IDs to strings
    const docSellerId = typeof currentDoc.sellerId === 'string' 
      ? currentDoc.sellerId 
      : currentDoc.sellerId?.$id;

    if (docSellerId !== sellerId) {
      console.error('ID Mismatch:', {
        docSellerId,
        sellerId,
        typeDoc: typeof currentDoc.sellerId,
        typeInput: typeof sellerId
      });
      throw new Error('permission_denied: You can only modify your own listings');
    }

    return await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.food_listingId,
      listingId,
      {
        status: currentDoc.status === 'active' ? 'inactive' : 'active',
        updatedAt: new Date().toISOString()
      }
    );
  } catch (error) {
    console.error('[toggleListingStatus] Full error:', {
      error,
      config: appwriteConfig,
      listingId,
      sellerId
    });
    throw error;
  }
};



// Add to your existing appwrite.ts file
// In your lib/appwrite.ts - UPDATE these functions:
export const createDishRequest = async (request: {
  dish_name: string;
  description?: string;
  pick_up?: string;
  delivery?: string;
  price: number;
  time: string;
  date: string;
  number: number;
  userId: string;
}) => {
  try {
    return await databases.createDocument(
      appwriteConfig.databaseId,
      '68a7b41e0011a858540b',
      ID.unique(),
      {
        dish_name: request.dish_name,
        description: request.description || '',
        pick_up: request.pick_up || '',
        delivery: request.delivery || '',
        price: request.price,
        time: request.time,
        date: request.date,
        number: request.number,
        userId: request.userId,
        status: 'active', // ADDED: Default status
      }
    );
  } catch (error) {
    console.error('[Appwrite] Create dish request error:', error);
    throw error;
  }
};



export const getDishRequests = async (userId: string) => {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      '68a7b41e0011a858540b', // Your collection ID
      [Query.equal('userId', userId)] // Filter by userId
    );
    return response.documents;
  } catch (error) {
    console.error('[Appwrite] Get dish requests error:', error);
    throw error;
  }
};


export const toggleDishRequestStatus = async (requestId: string, currentStatus: string, userId: string) => {
  try {
    // First verify ownership
    const request = await databases.getDocument(
      appwriteConfig.databaseId,
      '68a7b41e0011a858540b',
      requestId
    );

    if (request.userId.$id !== userId ) {
      throw new Error('permission_denied: You can only modify your own dish requests');
    }

    // Then proceed with toggle
    return await databases.updateDocument(
      appwriteConfig.databaseId,
      '68a7b41e0011a858540b',
      requestId,
      {
        status: currentStatus === 'active' ? 'inactive' : 'active',
      }
    );
  } catch (error) {
    console.error('[Appwrite] Toggle dish request status error:', error);
    throw error;
  }
};


export const deleteDishRequest = async (requestId: string, userId: string) => {
  try {
    // First verify ownership
    const request = await databases.getDocument(
      appwriteConfig.databaseId,
      '68a7b41e0011a858540b',
      requestId
    );

    if (request.userId.$id !== userId) {
      throw new Error('permission_denied: You can only delete your own dish requests');
    }

    // Then proceed with deletion
    return await databases.deleteDocument(
      appwriteConfig.databaseId,
      '68a7b41e0011a858540b',
      requestId
    );
  } catch (error) {
    console.error('[Appwrite] Delete dish request error:', error);
    throw error;
  }
};


export const getAllActiveDishRequests = async () => {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      '68a7b41e0011a858540b',
      [Query.equal('status', 'active')]
    );
    return response.documents;
  } catch (error) {
    console.error('[Appwrite] Get active dish requests error:', error);
    throw error;
  }
};


// Update the submitChefOffer function to include description:
export const submitChefOffer = async (offer: {
  specialRequestsId: string;
  sellerId: string;
  customerId: string;
  dish_name: string;
  description: string;
  pick_up?: string;
  delivery?: string;
  price: number;
  time: string;
  date: string;
  number: number;
  offerStatus?: string; // ADD offerStatus to the parameter type
}) => {
  try {
    return await databases.createDocument(
      appwriteConfig.databaseId,
      '68abda77002a826b775a',
      ID.unique(),
      {
        ...offer,
        offerStatus: offer.offerStatus || 'pending', // Use provided status or default to 'pending'
      }
    );  
  } catch (error) {
    console.error('[Appwrite] Submit offer error:', error);
    throw error;
  }
};


export const checkExistingOffer = async (sellerId: string, specialRequestsId: string) => {
  try {
    console.log('Querying offers for seller:', sellerId, 'request:', specialRequestsId);
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      '68abda77002a826b775a',
      [
        Query.equal('sellerId', sellerId),
        Query.equal('specialRequestsId', specialRequestsId)
      ]
    );
    
    console.log('Query response from appwrite check existingoffer:', response.documents);
    return response.documents[0];
  } catch (error) {
    console.error('[Appwrite] Check existing offer error:', error);
    throw error;
  }
};

export const getUserOffers = async (userId: string) => {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      '68abda77002a826b775a', // Your offers collection ID
      [Query.equal('customerId', userId)]
    );
    
    console.log('User offers fetched:', response.documents);
    return response.documents;
  } catch (error) {
    console.error('[Appwrite] Get user offers error:', error);
    throw error;
  }
};

export const updateOfferStatus = async (offerId: string, status: 'approved' | 'rejected', userId: string) => {
  try {
    return await databases.updateDocument(
      appwriteConfig.databaseId,
      '68abda77002a826b775a', // Your offers collection ID
      offerId,
      { 
        offerStatus: status,
        // You might want to add other fields like updatedAt
      }
    );
  } catch (error) {
    console.error('[Appwrite] Update offer status error:', error);
    throw error;
  }
};