import { EmptyState } from '@/components/EmptyState';
import { FoodForm } from '@/components/FoodForm';
import { ListingCard } from '@/components/ListingCard';
import {
  checkExistingOffer,
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
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
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

  const [submittedOffers, setSubmittedOffers] = useState<{ [key: string]: { status: 'waiting' | 'approved' | 'rejected'; offerPrice: number; } }>({});

  // Fetch user's listings
  const fetchListings = async () => {
    if (!user?.$id) return;
    setIsLoading(true);
    try {
      const userListings = await getSellerListings(user.$id);
      setListings(userListings);
    } catch (error) {
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
      const updatedListing = await toggleListingStatus(listingId, user.$id);
      setListings(prev => prev.map(listing => listing.$id === listingId ? updatedListing : listing));
    } catch (error: any) {
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
    if (!user?.$id) return;
    try {
      if (currentListing) {
        await updateFoodListing(currentListing.$id, values);
      } else {
        await createFoodListing({ ...values, sellerId: user.$id });
      }
      await fetchListings();
      setShowForm(false);
      setCurrentListing(null);
    } catch (error: any) {
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
      await deleteFoodListing(listingId, user.$id);
      await fetchListings();
      Alert.alert('Success', 'Listing deleted');
    } catch (error: any) {
      Alert.alert('Error', error.message.includes('permission_denied')
        ? "You can't delete others' listings"
        : 'Deletion failed');
    }
  };



  const handleQuestionFlow = (request: any) => {
    setSelectedRequest(request);
    setCurrentStep(1);
    setShowPriceInput(false);
    setCustomPrice('');
  };

  const handleStepComplete = (answer: boolean) => {
    if (currentStep === 1) {
      if (answer) {
        if (selectedRequest?.delivery) {
          setCurrentStep(2);
        } else {
          setCurrentStep(3);
        }
      } else {
        setCurrentStep(0);
        setSelectedRequest(null);
        Alert.alert('Cannot Proceed', 'You need to be available at the requested time to make an offer.');
      }
    } else if (currentStep === 2) {
      if (answer) {
        setCurrentStep(3);
      } else {
        setCurrentStep(0);
        setSelectedRequest(null);
        Alert.alert('Cannot Proceed', 'Delivery is required for this request.');
      }
    } else if (currentStep === 3) {
      if (answer) {
        handleSubmitOffer(selectedRequest.$id, selectedRequest.price);
      } else {
        setShowPriceInput(true);
      }
    }
  };

  const handleCustomPriceSubmit = () => {
    if (!customPrice || isNaN(parseFloat(customPrice))) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }
    handleSubmitOffer(selectedRequest.$id, parseFloat(customPrice));
  };

  // Handle final offer submission
  const handleSubmitOffer = async (requestId: string, price: number) => {
    try {
      await submitChefOffer({
        specialRequestsId: requestId,
        sellerId: user.$id,
        customerId: selectedRequest.userId.$id,
        dish_name: selectedRequest.dish_name,
        description: selectedRequest.description || '',
        pick_up: selectedRequest.pick_up || '',
        delivery: selectedRequest.delivery || '',
        price,
        time: selectedRequest.time,
        date: selectedRequest.date,
        number: selectedRequest.number
      });

      setSubmittedOffers(prev => ({
        ...prev,
        [requestId]: { status: 'waiting', offerPrice: price }
      }));

      Alert.alert(
        'Offer Submitted',
        `Your offer of $${price} has been submitted! The offer will be rejected automatically if the customer does not respond in 30 mins.`
      );

      setCurrentStep(0);
      setSelectedRequest(null);
      setShowPriceInput(false);
      setCustomPrice('');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit offer. Please try again.');
    }
  };

  useEffect(() => {
    if (activeTab === 'specialRequests') {
      const fetchData = async () => {
        const requests = await getAllActiveDishRequests();
        setActiveRequests(requests);
        if (requests.length > 0 && user?.$id) {
          for (const request of requests) {
            try {
              const existingOffer = await checkExistingOffer(user.$id, request.$id);
              if (existingOffer) {
                let status: 'waiting' | 'approved' | 'rejected' = 'waiting';
                if (existingOffer.offerStatus === 'approved') status = 'approved';
                else if (existingOffer.offerStatus === 'rejected') status = 'rejected';
                setSubmittedOffers(prev => ({
                  ...prev,
                  [request.$id]: { status, offerPrice: existingOffer.price }
                }));
              }
            } catch (error) {
              console.error('Error checking existing offer:', error);
            }
          }
        }
      };
      fetchData();
    }
  }, [activeTab, user?.$id]);

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

                {/* Delete Button Row */}
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
                  <Text className="font-bold text-lg text-primary">{request.dish_name}</Text>
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
                  <Text className="text-sm text-gray-500 mb-2"> ⏰ {request.time} on {request.date} </Text>
                  {request.delivery ? (
                    <Text className="text-sm text-blue-600">🚚 Delivery to: {request.delivery}</Text>
                  ) : request.pick_up ? (
                    <Text className="text-sm text-orange-600">📍 Pickup requested</Text>
                  ) : null}

                  {/* Action Buttons for Chefs */}
                  {submittedOffers[request.$id] ? (
                    <View
                      className={`p-3 rounded-lg mt-3 border ${
                        submittedOffers[request.$id].status === 'waiting'
                          ? 'bg-blue-50 border-blue-200'
                          : submittedOffers[request.$id].status === 'approved'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text
                            className={`font-medium ${
                              submittedOffers[request.$id].status === 'waiting'
                                ? 'text-blue-800'
                                : submittedOffers[request.$id].status === 'approved'
                                ? 'text-green-800'
                                : 'text-red-800'
                            }`}
                          >
                            {submittedOffers[request.$id].status === 'waiting'
                              ? '⏳ Waiting for customer\'s approval'
                              : submittedOffers[request.$id].status === 'approved'
                              ? '✅ Offer accepted! Start preparing the food'
                              : '❌ Offer rejected'}
                          </Text>
                          <Text
                            className={`text-sm mt-1 ${
                              submittedOffers[request.$id].status === 'waiting'
                                ? 'text-blue-600'
                                : submittedOffers[request.$id].status === 'approved'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            Offer: ${submittedOffers[request.$id].offerPrice}
                          </Text>
                          {submittedOffers[request.$id].status === 'waiting' && (
                            <Text className="text-blue-500 text-xs mt-1">
                              The offer will be rejected automatically if the customer does not respond in 30 mins.
                            </Text>
                          )}
                        </View>
                        <View
                          className={`p-2 rounded ${
                            submittedOffers[request.$id].status === 'waiting'
                              ? 'bg-blue-100'
                              : submittedOffers[request.$id].status === 'approved'
                              ? 'bg-green-100'
                              : 'bg-red-100'
                          }`}
                        >
                          <Text
                            className={`text-xs ${
                              submittedOffers[request.$id].status === 'waiting'
                                ? 'text-blue-700'
                                : submittedOffers[request.$id].status === 'approved'
                                ? 'text-green-700'
                                : 'text-red-700'
                            }`}
                          >
                            {submittedOffers[request.$id].status === 'waiting'
                              ? 'Pending'
                              : submittedOffers[request.$id].status === 'approved'
                              ? 'Accepted'
                              : 'Rejected'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ) : selectedRequest?.$id === request.$id && currentStep > 0 ? (
                    <View className="mt-3">
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
