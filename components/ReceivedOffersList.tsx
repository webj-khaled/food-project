import { updateOfferStatus } from '@/lib/appwrite';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

interface Offer {
  $id: string;
  dish_name: string;
  description: string;
  price: number;
  offerStatus: string;
  sellerId: {
    name: string;
  };
  pick_up?: string;
  delivery?: string;
  time: string;
  date: string;
  number: number;
}

interface ReceivedOffersListProps {
  offers: Offer[];
  isLoading: boolean;
  onRefresh: () => void;
  userId: string;
}

export const ReceivedOffersList = ({ offers, isLoading, onRefresh, userId }: ReceivedOffersListProps) => {
  const handleUpdateStatus = async (offerId: string, status: 'approved' | 'rejected') => {
    try {
      await updateOfferStatus(offerId, status, userId);
      Alert.alert('Success', `Offer ${status === 'approved' ? 'accepted' : 'rejected'}`);
      onRefresh();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update offer status');
    }
  };

  if (isLoading) {
    return (
      <View className="items-center justify-center py-8">
        <Text className="text-gray-500">Loading offers...</Text>
      </View>
    );
  }

  if (offers.length === 0) {
    return (
      <View className="items-center justify-center py-20">
        <Text className="text-gray-500">No offers received yet</Text>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 border-green-200';
      case 'rejected': return 'bg-red-100 border-red-200';
      case 'pending': return 'bg-blue-100 border-blue-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'pending': return 'Pending Review';
      default: return status;
    }
  };

  return (
    <View className="p-2">
      <Text className="text-lg font-bold mb-4">Offers Received</Text>
      
      {offers.map((offer) => (
        <View key={offer.$id} className="bg-white p-4 rounded-lg mb-4 shadow-sm">
          <Text className="font-bold text-lg text-primary">{offer.dish_name}</Text>
          
          {/* Seller Info */}
          <Text className="text-sm text-gray-600 mb-2">
            Offered by: {offer.sellerId?.name || 'Seller'}
          </Text>
          
          <Text className="text-gray-700 mb-2">{offer.description}</Text>
          
          {/* Final Price Only */}
          <View className="flex-row justify-between items-center mb-2">
            <Text className="font-bold text-green-600">${offer.price}</Text>
            
            {/* Status Badge */}
            <View className={`px-3 py-1 rounded-full ${getStatusColor(offer.offerStatus)}`}>
              <Text className={`text-xs font-medium ${
                offer.offerStatus === 'approved' ? 'text-green-800' :
                offer.offerStatus === 'rejected' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {getStatusText(offer.offerStatus)}
              </Text>
            </View>
          </View>

          {/* Delivery/Pickup Information */}
          {offer.pick_up ? (
            <View className="mb-2">
              <Text className="text-sm font-medium text-gray-700">📍 Pickup Location:</Text>
              <Text className="text-sm text-gray-600">{offer.pick_up}</Text>
            </View>
          ) : offer.delivery ? (
            <View className="mb-2">
              <Text className="text-sm font-medium text-gray-700">🚚 Delivery Address:</Text>
              <Text className="text-sm text-gray-600">{offer.delivery}</Text>
            </View>
          ) : null}

          {/* Time and Date */}
          <View className="mb-2">
            <Text className="text-sm font-medium text-gray-700">⏰ Time & Date:</Text>
            <Text className="text-sm text-gray-600">{offer.time} on {offer.date}</Text>
          </View>

          {/* Number of people */}
          <Text className="text-sm text-gray-600 mb-3">For {offer.number} person(s)</Text>

          {/* Action Buttons based on status */}
          {offer.offerStatus === 'pending' && (
            <View>
              <Text className="text-sm text-gray-600 mb-3">
                Please review the chef`&apos;`s offer above. The chef {offer.pick_up ? 
                `will prepare your food for pickup at ${offer.pick_up}` : 
                `will deliver to ${offer.delivery}`} for ${offer.price}.
              </Text>
              
              <View className="flex-row mt-3 space-x-2">
                <TouchableOpacity 
                  className="flex-1 bg-green-500 py-3 rounded items-center"
                  onPress={() => handleUpdateStatus(offer.$id, 'approved')}
                >
                  <Text className="text-white font-medium">Accept Offer</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  className="flex-1 bg-red-500 py-3 rounded items-center"
                  onPress={() => handleUpdateStatus(offer.$id, 'rejected')}
                >
                  <Text className="text-white font-medium">Reject Offer</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {offer.offerStatus === 'approved' && (
            <Text className="text-green-600 text-sm mt-2">
              ✅ You accepted this offer. The chef will {offer.pick_up ? 
              `expect you at ${offer.pick_up}` : 
              `deliver to ${offer.delivery}`} at {offer.time} on {offer.date}.
            </Text>
          )}
          
          {offer.offerStatus === 'rejected' && (
            <Text className="text-red-600 text-sm mt-2">
              ❌ You rejected this offer.
            </Text>
          )}
        </View>
      ))}
    </View>
  );
};