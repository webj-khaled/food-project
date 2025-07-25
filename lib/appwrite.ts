// Import necessary types and Appwrite SDK components
import { CreateUserPrams, GetMenuParams, SignInParams } from "@/type";
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
    menuCustomizationsCollectionId: '687b993200213f35ae9a' 
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
 * @param {CreateUserPrams} params - User details including email, password, and name
 * @returns {Promise} Promise that resolves with the created user document
 * @throws {Error} If account creation or document creation fails
 */
export const createUser = async ({ email, password, name }: CreateUserPrams) => {
    try {
        // Step 1: Create a new user account in Appwrite authentication
        const newAccount = await account.create(
            ID.unique(), // Generate unique ID for the account
            email, 
            password, 
            name
        );
        
        // Throw error if account creation failed
        if (!newAccount) throw new Error("Account creation failed.");

        // Step 2: Automatically sign in the newly created user
        await signIn({ email, password });

        // Step 3: Generate avatar URL using user's initials
        const avatarUrl = `${appwriteConfig.endpoint}/avatars/initials?name=${encodeURIComponent(name)}&project=${appwriteConfig.projectId}`;

        // Log avatar URL for debugging
        console.log("Avatar URL:", avatarUrl);
        console.log("Avatar URL length:", avatarUrl.length);

        // Step 4: Create a user document in the database
        return await databases.createDocument(
            appwriteConfig.databaseId, // Target database ID
            appwriteConfig.userCollectionId, // Target collection ID
            ID.unique(), // Unique document ID
            { // Document data
                email, 
                name, 
                account: newAccount.$id, // Reference to the auth account
                avatar: avatarUrl // Generated avatar URL
            }
        );
    } catch (e) {
        // Re-throw any errors with proper typing
        throw new Error(e as string);
    }
}

export const signIn = async ({ email, password }: SignInParams) => {
    try {
        // Create email/password session in Appwrite
        const session = await account.createEmailPasswordSession(email, password);
    } catch (e) {
        // Re-throw any errors with proper typing
        throw new Error(e as string);
    }
}

export const getCurrentUser = async () => {
    try {
        const currentAccount = await account.get();
        if(!currentAccount) throw Error;

        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal('account', currentAccount.$id)]
        )

        if(!currentUser) throw Error;

        return currentUser.documents[0];
    } catch (e) {
        console.log(e);
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
}

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
}