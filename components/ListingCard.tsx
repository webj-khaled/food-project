import { useState } from 'react';
import { Switch, Text, TouchableOpacity, View } from 'react-native';


// Define the props for the ListingCard component

type ListingCardProps = {
  id: string;
  title: string;
  price: number;
  description?: string; // Optional description
  status: 'active' | 'inactive';
  imageUrl?: string;
  sellerId: string | { $id: string };
  currentUserId?: string;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onStatusChange?: (listingId: string) => Promise<void>;
};


export const ListingCard = ({
  id,
  title,
  price,
  status = 'active',
  description,
  imageUrl,
  sellerId,
  currentUserId,
  onPress,
  onEdit,
  onDelete,
  onStatusChange
}: ListingCardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Debug: Log all incoming props
  console.log('[ListingCard] Received props:', {
    id,
    sellerId,
    currentUserId,
    status,
    isOwner: sellerId === currentUserId
  });

  // Inside your ListingCard component
const ownerId = typeof sellerId === 'string' ? sellerId : sellerId?.$id;
const isOwner = ownerId === currentUserId;

console.log('[ListingCard] Corrected ownership check:', {
  ownerId,
  currentUserId, 
  isOwner
});

const handleStatusToggle = async () => {
    if (!onStatusChange || !isOwner) return;
    
    try {
      setIsLoading(true);
      await onStatusChange(id); // Parent handles everything
    } catch (error) {
      // Parent already handles errors
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity onPress={onPress} className="bg-white rounded-lg shadow-sm p-4 mb-3">
      {/* ... (existing image and content) ... */}
      
      <View className="flex-row items-center">
        <Text className={`text-sm mr-2 ${isOwner ? 'text-gray-800' : 'text-gray-400'}`}>
          {status === 'active' ? 'Active' : 'Inactive'}
          {!isOwner && ' (Read Only)'}
        </Text>
        
        <Switch
          value={status === 'active'}
          onValueChange={handleStatusToggle}
          disabled={!isOwner || isLoading}
          trackColor={{
            false: isOwner ? '#d1d5db' : '#f3f4f6',
            true: isOwner ? '#FE8C00' : '#f3f4f6'
          }}
        />
      </View>
      {/* ... (existing buttons) ... */}
    </TouchableOpacity>
  );
};