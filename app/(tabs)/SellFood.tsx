import { EmptyState } from '@/components/EmptyState';
import { FoodForm } from '@/components/FoodForm';
import { ListingCard } from '@/components/ListingCard';
import {
  createFoodListing,
  deleteFoodListing,
  getAllActiveDishRequests,
  getSellerListings,
  submitChefOffer,
  toggleListingStatus,
  updateFoodListing
} from '@/lib/appwrite';

import useAuthStore from "@/store/auth.store";
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SellFood() {
  const { user } = useAuthStore();
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentListing, setCurrentListing] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'listings' | 'specialRequests' | 'ongoingRequests'>('listings');
  const insets = useSafeAreaInsets();
  const [activeRequests, setActiveRequests] = useState<any[]>([]); 
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [customPrice, setCustomPrice] = useState<string>('');
  const [showPriceInput, setShowPriceInput] = useState<boolean>(false);
  // Add these states with your existing ones
  const [submittedOffers, setSubmittedOffers] = useState<{[key: string]: {
    status: 'waiting' | 'approved' | 'rejected';
    timer: number;
    offerPrice: number;
  }}>({});

  const [timers, setTimers] = useState<{[key: string]: NodeJS.Timeout | number}>({});
  
  // Fetch user's listings
  const fetchListings = async () => {
    if (!user?.$id) return;
    
    setIsLoading(true);
    try {
      console.log('[SellFood.tsx] Fetching listings for user:', user?.$id);
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
  // ADD: Fetch active dish requests for special requests tab
  const fetchActiveRequests = async () => {
    setIsLoading(true);
    try {
      const requests = await getAllActiveDishRequests();
      setActiveRequests(requests);
    } catch (error) {
      console.error('Error fetching active requests:', error);
      Alert.alert('Error', 'Failed to load active dish requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionFlow = (request: any) => {
  setSelectedRequest(request);
  setCurrentStep(1);
  setShowPriceInput(false);
  setCustomPrice('');
};

// Add this function to handle step completion
  const handleStepComplete = (answer: boolean) => {
  if (currentStep === 1) { // Time availability question
    if (answer) {
      // Check if delivery is needed
      if (selectedRequest?.delivery) {
        setCurrentStep(2); // Show delivery question
      } else {
        setCurrentStep(3); // Skip to price question
      }
    } else {
      // If cannot prepare at that time, reset
      setCurrentStep(0);
      setSelectedRequest(null);
      Alert.alert('Cannot Proceed', 'You need to be available at the requested time to make an offer.');
    }
  } else if (currentStep === 2) { // Delivery question
    if (answer) {
      setCurrentStep(3); // Move to price question
    } else {
      // If cannot deliver, reset
      setCurrentStep(0);
      setSelectedRequest(null);
      Alert.alert('Cannot Proceed', 'Delivery is required for this request.');
    }
  } else if (currentStep === 3) { // Price approval
    
    if (answer) {
    // Submit offer with original price
        handleSubmitOffer(selectedRequest.$id, selectedRequest.price);
      } else {
        setShowPriceInput(true);
      }
    }
};

  // Add this function to handle custom price submission
  const handleCustomPriceSubmit = () => {
  if (!customPrice || isNaN(parseFloat(customPrice))) {
    Alert.alert('Error', 'Please enter a valid price');
    return;
  }
  handleSubmitOffer(selectedRequest.$id, parseFloat(customPrice));
};

  // Add this function right before your handleSubmitOffer function
const startCountdown = (requestId: string) => {
  
const countdown = setInterval(() => {
    setSubmittedOffers(prev => {
      if (!prev[requestId] || prev[requestId].timer <= 0) {
        clearInterval(countdown);
        return prev;
      }
      return {
        ...prev,
        [requestId]: {
          ...prev[requestId],
          timer: prev[requestId].timer - 1
        }
      };
    });
  }, 1000);
};

  // Add this function for final offer submission
const handleSubmitOffer = async (requestId: string, price: number) => {
  try {
    // Debug: Log all offer data
    console.log('Submitting offer with data:', {
      specialRequestsId: requestId,
      sellerId: user.$id,
      customerId: selectedRequest.userId.$id,
      dish_name: selectedRequest.dish_name,
      description: selectedRequest.description || '',
      pick_up: selectedRequest.pick_up || '',
      delivery: selectedRequest.delivery || '',
      price: price,
      time: selectedRequest.time,
      date: selectedRequest.date,
      number: selectedRequest.number
    });

    // First create the offer in Appwrite
    await submitChefOffer({
      specialRequestsId: requestId,
      sellerId: user.$id,
      customerId: selectedRequest.userId.$id,
      dish_name: selectedRequest.dish_name,
      description: selectedRequest.description || '',
      pick_up: selectedRequest.pick_up || '',
      delivery: selectedRequest.delivery || '',
      price: price,
      time: selectedRequest.time,
      date: selectedRequest.date,
      number: selectedRequest.number
    });

    // Start 30-minute timer
    const timer = setTimeout(() => {
      setSubmittedOffers(prev => ({
        ...prev,
        [requestId]: { ...prev[requestId], status: 'rejected' }
      }));
    }, 30 * 60 * 1000);

    // Store the offer and timer
    setSubmittedOffers(prev => ({
      ...prev,
      [requestId]: {
        status: 'waiting',
        timer: 30 * 60,
        offerPrice: price
      }
    }));

    setTimers(prev => ({ ...prev, [requestId]: timer }));
    Alert.alert('Offer Submitted', `Your offer of $${price} has been submitted! Waiting for customer approval.`);
    startCountdown(requestId);
    setCurrentStep(0);
    setSelectedRequest(null);
    setShowPriceInput(false);
    setCustomPrice('');

  } catch (error) {
    console.error('Error submitting offer:', error);
    Alert.alert('Error', 'Failed to submit offer. Please try again.');
  }
};

  // ADD: Fetch data when special requests tab is active
  useEffect(() => {
    if (activeTab === 'specialRequests') {
      fetchActiveRequests();
    }
  }, [activeTab]);
 

  // Load listings on mount and when user changes
  useEffect(() => {
    fetchListings();
  }, [user]);

  // Change the cleanup useEffect to this:
useEffect(() => {
  return () => {
    // Clear all timers when component unmounts
    Object.values(timers).forEach(timer => {
      if (typeof timer !== 'number') {
        clearTimeout(timer as NodeJS.Timeout);
      }
    });
  };
}, [timers]);

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
  <View className="flex-1" style={{ paddingTop: insets.top }}>
    {/* Tab Navigation */}
    <View className="flex-row border-b border-gray-200 pt-4 mt-2">
      <TouchableOpacity 
        className={`flex-1 py-2 items-center ${activeTab === 'listings' ? 'border-b-2 border-primary' : ''}`}
        onPress={() => setActiveTab('listings')}
      >
        <Text className={`font-semibold text-sm ${activeTab === 'listings' ? 'text-primary' : 'text-gray-500'}`}>
          Listings
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        className={`flex-1 py-3 items-center ${activeTab === 'specialRequests' ? 'border-b-2 border-primary' : ''}`}
        onPress={() => setActiveTab('specialRequests')}
      >
        <Text className={`font-semibold ${activeTab === 'specialRequests' ? 'text-primary' : 'text-gray-500'}`}>
          Special Requests
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        className={`flex-1 py-3 items-center ${activeTab === 'ongoingRequests' ? 'border-b-2 border-primary' : ''}`}
        onPress={() => setActiveTab('ongoingRequests')}
      >
        <Text className={`font-semibold ${activeTab === 'ongoingRequests' ? 'text-primary' : 'text-gray-500'}`}>
          Ongoing Requests
        </Text>
      </TouchableOpacity>
    </View>

    {/* Tab Content */}
    <ScrollView className="p-4">
      {activeTab === 'listings' && (
        <>
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
        </>
      )}
      
      {activeTab === 'specialRequests' && (
    <ScrollView className="p-2" contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
              <Text className="text-lg font-bold mb-4">Active Dish Requests</Text>
              {activeRequests.length === 0 ? (
                <View className="items-center justify-center py-20">
                  <Text className="text-gray-500">No active dish requests found</Text>
                </View>
              ) : (
                activeRequests.map(request => (
                  <View key={request.$id} className="bg-white p-4 rounded-lg mb-4 shadow-sm">
                    {/* Customer Name - Try to get from user data */}
                    <Text className="font-bold text-lg text-primary">
                      {request.dish_name}
                    </Text>
                    
                    {request.user_id && (
                      <Text className="text-sm text-gray-600 mb-2">
                        Requested by: Customer #{request.user_id.slice(0, 8)}
                      </Text>
                    )}
                    
                    <Text className="text-gray-700 mb-2">{request.description}</Text>
                    
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="font-bold text-green-600">${request.price}</Text>
                      <Text className="text-sm text-gray-500">For {request.number} people</Text>
                    </View>
                    
                    <Text className="text-sm text-gray-500 mb-2">
                      ⏰ {request.time} on {request.date}
                    </Text>
                    
                    {/* Delivery/Pickup Info */}
                    {request.delivery ? (
                      <Text className="text-sm text-blue-600">🚚 Delivery to: {request.delivery}</Text>
                    ) : request.pick_up ? (
                      <Text className="text-sm text-orange-600">📍 Pickup requested</Text>
                    ) : null}
                    
                    {/* Action Buttons for Chefs */}
                    
                    {submittedOffers[request.$id] ? (
                      <View className="bg-blue-50 p-3 rounded-lg mt-3 border border-blue-200">
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1">
                            <Text className="text-blue-800 font-medium">
                              ⏳ Waiting for customer`&apos;`s approval
                            </Text>
                            <Text className="text-blue-600 text-sm mt-1">
                              Offer: ${submittedOffers[request.$id].offerPrice}
                            </Text>
                            <Text className="text-blue-500 text-xs mt-1">
                              {Math.floor(submittedOffers[request.$id].timer / 60)}:
                              {(submittedOffers[request.$id].timer % 60).toString().padStart(2, '0')}
                              remaining
                            </Text>
                          </View>
                          <View className="bg-blue-100 p-2 rounded">
                            <Text className="text-blue-700 text-xs">Pending</Text>
                          </View>
                        </View>
                      </View>
                    ) : selectedRequest?.$id === request.$id && currentStep > 0 ? (
                      <View className="mt-3">
                        {/* Question 1: Time availability */}
                        {currentStep === 1 && (
                          <View>
                            <Text className="font-medium text-gray-700 mb-2">
                              Can you prepare this food at {request.time}?
                            </Text>
                            <TouchableOpacity
                              onPress={() => handleStepComplete(true)}
                              className="bg-green-500 py-3 rounded-lg items-center"
                            >
                              <Text className="text-white font-bold">Yes!</Text>
                            </TouchableOpacity>
                          </View>
                        )}

                        {/* Question 2: Delivery - ONLY show if delivery is required */}
                        {currentStep === 2 && request.delivery && (
                          <View>
                            <Text className="font-medium text-gray-700 mb-2">
                              Can you deliver to {request.delivery}?
                            </Text>
                            <TouchableOpacity
                              onPress={() => handleStepComplete(true)}
                              className="bg-green-500 py-3 rounded-lg items-center"
                            >
                              <Text className="text-white font-bold">Yes!</Text>
                            </TouchableOpacity>
                          </View>
                        )}

                        {/* Question 3: Price approval - Show after delivery question OR if no delivery needed */}
                        {currentStep === 3 && (
                          <View>
                            <Text className="font-medium text-gray-700 mb-2">
                              The customer wants to pay ${request.price}. Do you approve?
                            </Text>
                            <View className="flex-row space-x-2">
                              <TouchableOpacity
                                onPress={() => handleStepComplete(true)}
                                className="flex-1 bg-green-500 py-2 rounded-lg items-center"
                              >
                                <Text className="text-white font-medium">Yes</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleStepComplete(false)}
                                className="flex-1 bg-red-500 py-2 rounded-lg items-center"
                              >
                                <Text className="text-white font-medium">No</Text>
                              </TouchableOpacity>
                            </View>

                            {showPriceInput && (
                              <View className="mt-3">
                                <TextInput
                                  value={customPrice}
                                  onChangeText={setCustomPrice}
                                  placeholder="Enter your price"
                                  keyboardType="numeric"
                                  className="border p-3 rounded-lg mb-2"
                                />
                                <Text className="text-sm text-gray-500 mb-2">
                                  Increasing the price may reduce the chances of your offer getting accepted
                                </Text>
                                <TouchableOpacity
                                  onPress={handleCustomPriceSubmit}
                                  className="bg-primary py-3 rounded-lg items-center"
                                >
                                  <Text className="text-white font-bold">Submit Offer</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    ) : (
                      <TouchableOpacity 
                        onPress={() => handleQuestionFlow(request)}
                        className="bg-primary flex-1 py-2 rounded items-center"
                      >
                        <Text className="text-white font-medium">Make Offer</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
    </ScrollView>
    )}
      
      {activeTab === 'ongoingRequests' && (
        <View className="items-center justify-center py-20">
          <Text className="text-gray-500">Current Requests will appear here</Text>
        </View>
      )}
    </ScrollView>
  </View>
);
}