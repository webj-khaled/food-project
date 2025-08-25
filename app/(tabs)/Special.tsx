// File: app/(tabs)/specials.tsx
import { DishRequestForm } from '@/components/DishRequestForm';
import { createDishRequest, deleteDishRequest, getDishRequests, toggleDishRequestStatus } from '@/lib/appwrite'; // Import the functions
import useAuthStore from "@/store/auth.store";
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Specials() {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'requests' | 'offers'>('requests');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dishRequests, setDishRequests] = useState<any[]>([]);

  // Fetch dish requests
  const fetchDishRequests = async () => {
    if (!user?.$id) return;
    
    setIsLoading(true);
    try {
      const requests = await getDishRequests(user.$id);
      setDishRequests(requests);
    } catch (error) {
      console.error('Error fetching dish requests:', error);
      Alert.alert('Error', 'Failed to load your dish requests');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when tab is active or user changes
  useEffect(() => {
    if (activeTab === 'requests' && user?.$id) {
      fetchDishRequests();
    }
  }, [activeTab, user]);

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#FE8C00" />
        <Text className="mt-4 text-gray-600">Loading user...</Text>
      </View>
    );
  }

  // Handle creating a new dish request
  const handleCreateRequest = async (requestData: any) => {
    if (!user?.$id) {
      Alert.alert('Error', 'Please log in to create requests');
      return;
    }
    
    setIsLoading(true);
    try {
      await createDishRequest({
        dish_name: requestData.dish_name,
        description: requestData.description,
        pick_up: requestData.delivery_type === 'pickup' ? 'pickup' : '',
        delivery: requestData.delivery_type === 'delivery' ? requestData.delivery_address : '',
        price: requestData.price,
        time: requestData.time,
        date: requestData.date,
        number: requestData.number,
        userId: user.$id
      });
      
      Alert.alert('Success', 'Dish request created successfully!');
      setShowRequestForm(false);
      fetchDishRequests(); // Refresh the list
    } catch (error: any) {
      console.error('Error creating request:', error);
      Alert.alert('Error', error.message || 'Failed to create dish request');
    } finally {
      setIsLoading(false);
    }
  };

  // Show form if active
  if (showRequestForm) {
    return (
      <DishRequestForm
        onSubmit={handleCreateRequest}
        onCancel={() => setShowRequestForm(false)}
      />
    );
  }

  // In your component:
// In your component:
const handleToggleStatus = async (requestId: string, currentStatus: string) => {
  try {
    console.log('Toggle attempt:', {
      requestId,
      currentStatus,
      userId: user?.$id
    });
    await toggleDishRequestStatus(requestId, currentStatus, user.$id);
    fetchDishRequests();
    Alert.alert('Success', `Request ${currentStatus === 'active' ? 'deactivated' : 'activated'} successfully`);
  } catch (error: any) {
    console.log('Toggle error details:', {
      error,
      requestId,
      currentStatus,
      userId: user?.$id
    });
    Alert.alert('Error', error.message || 'Failed to update status');
  }
};

const handleDeleteRequest = async (requestId: string) => {
  Alert.alert(
    'Confirm Delete',
    'Are you sure you want to delete this dish request?',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('Delete attempt:', {
              requestId,
              userId: user?.$id
            });
            await deleteDishRequest(requestId, user.$id);
            fetchDishRequests();
            Alert.alert('Success', 'Request deleted successfully');
          } catch (error: any) {
            console.log('Delete error details:', {
              error,
              requestId,
              userId: user?.$id
            });
            Alert.alert('Error', error.message || 'Failed to delete request');
          }
        }
      }
    ]
  );
};

  return (
  <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
    {/* Navigation Tabs */}
    <View className="flex-row border-b border-gray-200 pt-2">
      <TouchableOpacity 
        className={`flex-1 py-3 items-center ${activeTab === 'requests' ? 'border-b-2 border-primary' : ''}`}
        onPress={() => setActiveTab('requests')}
      >
        <Text className={`font-semibold ${activeTab === 'requests' ? 'text-primary' : 'text-gray-500'}`}>
          Dish Requests
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        className={`flex-1 py-3 items-center ${activeTab === 'offers' ? 'border-b-2 border-primary' : ''}`}
        onPress={() => setActiveTab('offers')}
      >
        <Text className={`font-semibold ${activeTab === 'offers' ? 'text-primary' : 'text-gray-500'}`}>
          Received Offers
        </Text>
      </TouchableOpacity>
    </View>

    {/* Content Area */}
    <View >
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FE8C00" />
        </View>
      ) : activeTab === 'requests' ? (
        <ScrollView className="p-4"  // ← MOVE padding HERE
          contentContainerStyle={{ paddingBottom: insets.bottom + 140 }} >
          {/* Create Button */}
          <TouchableOpacity
            onPress={() => setShowRequestForm(true)}
            className="bg-primary p-4 rounded-lg mb-4 items-center"
          >
            <Text className="text-white font-bold">Create New Dish Request</Text>
          </TouchableOpacity>

          {dishRequests.length === 0 ? (
            <View className="flex-1 items-center justify-center py-10">
              <Text className="text-gray-500 mb-4">No dish requests yet</Text>
            </View>
          ) : (
            <View>
              <Text className="text-lg font-bold mb-4">Your Dish Requests</Text>
              {dishRequests.map(request => (
                <View key={request.$id} className="bg-gray-50 p-4 rounded-lg mb-3">
                  <Text className="font-bold text-lg">Dish name:{request.dish_name}</Text>
                  <Text className="text-gray-600">Description: {request.description}</Text>
                  <Text className="text-primary font-bold mt-2">Price: ${request.price}</Text>
                  <Text className="text-sm text-gray-500">
                    Phone number: {request.number} • Time:{request.time} • {request.date}
                  </Text>
                  {request.pick_up ? (
                  <Text className="text-sm text-blue-500 mt-1">Pick-up location will be determined by the chef</Text>
                    ) : request.delivery ? (
                  <Text className="text-sm text-green-500 mt-1">Delivery to: {request.delivery}</Text>
                    ) : null}

                  {/* Status Badge */}
                  <View className={`flex-row items-center mt-2 ${
                    request.status === 'active' ? 'bg-green-100' : 'bg-gray-200'
                    } px-2 py-1 rounded self-start`}>
                    <Text className={`text-xs font-medium ${
                      request.status === 'active' ? 'text-green-800' : 'text-gray-600'
                    }`}>
                      {request.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row mt-3 space-x-2">
                    {/* Toggle Status Button */}
                    <TouchableOpacity
                      onPress={() => handleToggleStatus(request.$id, request.status)}
                      className={`flex-1 py-2 rounded items-center ${
                        request.status === 'active' ? 'bg-gray-300' : 'bg-green-500'
                      }`}
                    >
                      <Text className={`text-xs font-medium ${
                        request.status === 'active' ? 'text-gray-700' : 'text-white'
                      }`}>
                        {request.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Text>
                    </TouchableOpacity>

                    {/* Delete Button */}
                    <TouchableOpacity
                      onPress={() => handleDeleteRequest(request.$id)}
                      className="bg-red-500 flex-1 py-2 rounded items-center"
                    >
                      <Text className="text-white text-xs font-medium">Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Received Offers coming soon...</Text>
        </View>
      )}
    </View>
  </View>
);
}