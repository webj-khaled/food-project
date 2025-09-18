import { toggleListingStatus } from '@/lib/appwrite';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Switch, Text, View } from 'react-native';

type StatusToggleProps = {
  listingId: string;        // The document ID from Appwrite
  sellerId: string;         // Must be the creator's user ID (string only)
  currentUserId?: string;   // Currently logged-in user ID
  initialStatus: 'active' | 'inactive';
  onToggle?: (newStatus: 'active' | 'inactive') => void;
};

export const StatusToggle = ({
  listingId,
  sellerId,
  currentUserId,
  initialStatus,
  onToggle,
}: StatusToggleProps) => {
  // State management
  const [status, setStatus] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync with parent component
  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  // Ownership check
  const isOwner = sellerId === currentUserId;

  const handleToggle = async () => {
    setError(null);
    
    // Validate inputs
    if (!listingId || !listingId.trim()) {
      setError('Invalid listing reference');
      return;
    }

    if (!currentUserId) {
      setError('User not authenticated');
      return;
    }

    if (!isOwner) {
      Alert.alert(
        'Permission Denied', 
        'Only the listing creator can change status'
      );
      return;
    }

    try {
      setIsLoading(true);
      const newStatus = status === 'active' ? 'inactive' : 'active';
      
      await toggleListingStatus(listingId, currentUserId);
      
      setStatus(newStatus);
      onToggle?.(newStatus);
    } catch (error: any) {
      setError(error.message);
      Alert.alert('Update Failed', error.message);
      setStatus(initialStatus); // Revert on error
    } finally {
      setIsLoading(false);
    }
  };

  // Component validation
  if (!listingId) {
    return (
      <View className="p-2 bg-yellow-50 rounded">
        <Text className="text-yellow-700 text-sm">
          Configuration error: Missing listing ID
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center">
      <Text 
        className={`mr-2 text-sm ${isOwner ? 'text-gray-800' : 'text-gray-400'}`}
        accessibilityLabel={`Listing status: ${status}`}
      >
        {status === 'active' ? 'Active' : 'Inactive'}
        {!isOwner && ' (Read Only)'}
      </Text>

      {isLoading ? (
        <ActivityIndicator size="small" />
      ) : (
        <Switch
          value={status === 'active'}
          onValueChange={handleToggle}
          disabled={!isOwner || isLoading}
          trackColor={{
            false: !isOwner ? '#e5e7eb' : '#767577',
            true: !isOwner ? '#fee2e2' : '#FE8C00',
          }}
          thumbColor="#fff"
        />
      )}

      {error && (
        <Text className="ml-2 text-xs text-red-500">
          {error}
        </Text>
      )}
    </View>
  );
};