import { EmptyState } from '@/components/EmptyState';
import { FoodForm } from '@/components/FoodForm';
import { ListingCard } from '@/components/ListingCard';
import {
  createFoodListing,
  deleteFoodListing,
  getSellerListings,
  toggleListingStatus,
  updateFoodListing
} from '@/lib/appwrite';
import useAuthStore from "@/store/auth.store";
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function SellFood() {
  const { user } = useAuthStore();
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentListing, setCurrentListing] = useState<any>(null);

  // Fetch user's listings
  const fetchListings = async () => {
    if (!user?.account) return;
    
    setIsLoading(true);
    try {
      console.log('[SellFood.tsx] Fetching listings for user:', user?.account);
      const userListings = await getSellerListings(user.$id);
      console.log('[SellFood.tsx] Received listings:', userListings);
      setListings(userListings);
    } catch (error) {
      console.error('[SellFood.tsx] Fetch error:', error);
      Alert.alert('Error', String(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle status toggle
  const handleStatusToggle = async (listingId: string) => {
  if (!user?.$id) {
    Alert.alert('Error', 'User not authenticated');
    return;
  }

  try {
    console.log('Attempting toggle with:', {
      listingId,
      userId: user.$id,
      userObject: user
    });
    const updatedListing = await toggleListingStatus(listingId, user.$id);
    setListings(prev => prev.map(listing => 
      listing.$id === listingId ? updatedListing : listing
    ));
  } catch (error: any) {
    console.error('[SellFood.tsx] Full toggle error:', {
      error,
      stack: error.stack
    });
    Alert.alert('Error', error.message || 'Failed to update status');
  }
};

  // Handle form submission
  const handleSubmit = async (values: {
    name: string;
    description: string;
    foodImage?: string | null;
    certificateImage: string;
    number: string;
    price: number;
    category?: string;
  }) => {
    if (!user?.$id) {
      console.error('[SellFood.tsx] No user ID found');
      return;
    }

    try {
      if (currentListing) {
        await updateFoodListing(currentListing.$id, values);
      } else {
        await createFoodListing({
          ...values,
          sellerId: user.$id
        });
      }
      
      await fetchListings();
      setShowForm(false);
      setCurrentListing(null);
    } catch (error: any) {
      console.error('[SellFood.tsx] Submit failed:', error);
      Alert.alert('Error', error.message || 'Operation failed');
    }
  };

  // Handle delete listing
  const handleDelete = async (listingId: string) => {
  if (!user?.$id) {
    Alert.alert('Error', 'Not authenticated');
    return;
  }

  try {
    await deleteFoodListing(listingId, user.$id); // Pass current user ID
    await fetchListings();
    Alert.alert('Success', 'Listing deleted');
  } catch (error) {
    Alert.alert('Error', 
      error.message.includes('permission_denied') 
        ? "You can't delete others' listings" 
        : 'Deletion failed'
    );
  }
};

  // Load listings on mount and when user changes
  useEffect(() => {
    fetchListings();
  }, [user]);

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading your listings...</Text>
      </View>
    );
  }

  // Empty state
  if (listings.length === 0 && !showForm) {
    return (
      <EmptyState
        title="No Listings Yet"
        subtitle="Start selling your homemade food by creating your first listing"
        buttonText="Create Listing"
        onPress={() => setShowForm(true)}
      />
    );
  }

  // Show form
  if (showForm) {
    return (
      <FoodForm
        initialValues={currentListing || undefined}
        onSubmit={handleSubmit}
        onCancel={() => {
          setShowForm(false);
          setCurrentListing(null);
        }}
      />
    );
  }

  // Show listings
  return (
  <ScrollView className="p-4">
    {listings.map((listing) => (
      <View key={listing.$id} className="mb-4 bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Main Listing Card */}
        <ListingCard
          id={listing.$id}
          title={listing.name}
          price={listing.price}
          status={listing.status}
          imageUrl={listing.foodImage}
          sellerId={listing.sellerId}
          currentUserId={user?.$id}
          onPress={() => {
            setCurrentListing(listing);
            setShowForm(true);
          }}
          onEdit={() => {
            setCurrentListing(listing);
            setShowForm(true);
          }}
          onStatusChange={() => handleStatusToggle(listing.$id)}
        />
        
        {/* Delete Button Row with Name and Price */}
        <View className="flex-row border-t border-gray-100 items-center">
          <View className="flex-1 pl-4 py-3">
            <Text className="font-medium text-gray-900">{listing.name}</Text>
            <Text className="text-primary font-bold">${listing.price.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            onPress={() => handleDelete(listing.$id)}
            className="bg-red-50 px-6 py-3 items-center justify-center border-l border-gray-100"
          >
            <Text className="text-red-600 font-medium">Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    ))}
    
    {/* Add New Listing Button */}
    <TouchableOpacity
      onPress={() => setShowForm(true)}
      className="bg-primary p-4 rounded-lg mt-4 items-center"
    >
      <Text className="text-white font-bold">Add New Listing</Text>
    </TouchableOpacity>
  </ScrollView>
);
}