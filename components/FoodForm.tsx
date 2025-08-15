import { appwriteConfig, storage } from '@/lib/appwrite';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { launchImageLibraryAsync } from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ID } from 'react-native-appwrite';


type FoodFormProps = {
  initialValues?: {
    name: string;
    description: string;
    number: string;
    price: string;
    category?: string;
    certificateImage?: string | null;
    foodImage?: string | null;
  };
  onSubmit: (values: {
    name: string;
    description: string;
    number: string;
    price: number;
    category?: string;
    certificateImage?: string | null;
    foodImage?: string | null;
  }) => Promise<void>;
  onCancel: () => void;
};

export const FoodForm = ({ initialValues, onSubmit, onCancel }: FoodFormProps) => {
  const [form, setForm] = useState({
    name: initialValues?.name || '',
    description: initialValues?.description || '',
    number: initialValues?.number || '',
    price: initialValues?.price || '',
    category: initialValues?.category || '',
    certificateImage: initialValues?.certificateImage || null,
    foodImage: initialValues?.foodImage || null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImageType, setUploadingImageType] = useState<'food' | 'certificate' | null>(null);

  // Function to handle image upload // Debug form state changes
  useEffect(() => {
    console.log('Form updated:', form);
  }, [form]);    

 const handleImageUpload = async (type: 'food' | 'certificate') => {
  try {
    setUploadingImageType(type);

    // 1. Launch image picker
    const result = await launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: type === 'food' ? [4, 3] : [3, 4],
      quality: 0.8,
    });

    if (result.canceled) return;
    
    const uri = result.assets[0]?.uri;
    if (!uri) return;

    // 2. Get file info including size
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('Selected file does not exist');
    }

    // 3. Get file size (in bytes)
    const fileStats = await FileSystem.getInfoAsync(uri, { size: true });
    const fileSize = fileStats.size || 0;

    // 4. Validate file size
    const maxSize = type === 'certificate' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (fileSize > maxSize) {
      throw new Error(`File too large (max ${Math.round(maxSize/1024/1024)}MB`);
    }

    // 5. Get file extension
    const fileExtension = uri.split('.').pop()?.toLowerCase() || 'jpg';

    // 6. Upload to Appwrite Storage
    const uploadedFile = await storage.createFile(
      appwriteConfig.bucketId,
      ID.unique(),
      {
        uri,
        name: `${type}_${Date.now()}.${fileExtension}`,
        type: `image/${fileExtension}`,
        size: fileSize // Include the required size parameter
      }
    );

    // 7. Get permanent URL with proper permissions
    const imageUrl = `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucketId}/files/${uploadedFile.$id}/view?project=${appwriteConfig.projectId}&mode=admin`;
    
    // 8. Update form state
    setForm(prev => ({
      ...prev,
      [type === 'food' ? 'foodImage' : 'certificateImage']: imageUrl
    }));

  } catch (error: any) {
    console.error('Image upload error:', error);
    Alert.alert('Error', error.message || 'Failed to upload image');
  } finally {
    setUploadingImageType(null);
  }
};

  const handleSubmit = async () => {
    // Validate required fields
    if (!form.name.trim()) {
      Alert.alert('Error', 'Please enter the food name');
      return;
    }
    if (!form.description.trim()) {
      Alert.alert('Error', 'Please enter the description');
      return;
    }
    if (!form.price.trim()) {
      Alert.alert('Error', 'Please enter the price');
      return;
    }
    if (isNaN(parseFloat(form.price))) {
      Alert.alert('Error', 'Price must be less than 1000');
      return;
    }
    if (!form.certificateImage) {
      Alert.alert('Error', 'Chef certificate image is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...form,
        price: parseFloat(form.price),
        certificateImage: form.certificateImage,
        foodImage: form.foodImage || null
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="p-4">
      <Text className="text-xl font-bold mb-4">Food Details</Text>
      
      {/* Food Image (Optional) */}
      <View className="mb-4">
        <Text className="font-medium mb-1">Food Photo (Optional)</Text>
        <TouchableOpacity 
          onPress={() => handleImageUpload('food')}
          disabled={uploadingImageType === 'food'}
          className={`border-2 border-dashed border-gray-300 rounded-lg p-4 items-center justify-center h-40 ${
            uploadingImageType === 'food' ? 'opacity-50' : ''
          }`}
        >
          {uploadingImageType === 'food' ? (
            <ActivityIndicator size="small" color="#FE8C00" />
          ) : form.foodImage ? (
            <Image 
              source={{ uri: form.foodImage }}
              className="w-full h-full rounded-md"
              resizeMode="contain"
              
            />
          ) : (
            <View className="items-center">
              <Ionicons name="fast-food-outline" size={24} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2">Tap to add food photo(optional)</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Certificate Image (Required) */}
      <View className="mb-4">
        <Text className="font-medium mb-1">Chef Certificate*</Text>
        <Text className="text-sm text-gray-500 mb-2">Upload a clear photo of your professional certification</Text>
        <TouchableOpacity 
          onPress={() => handleImageUpload('certificate')}
          disabled={uploadingImageType === 'certificate'}
          className={`border-2 rounded-lg p-4 items-center justify-center h-40 ${
            !form.certificateImage ? 'border-dashed border-red-300 bg-red-50' : 'border-gray-200'
          } ${uploadingImageType === 'certificate' ? 'opacity-50' : ''}`}
        >
          {uploadingImageType === 'certificate' ? (
            <ActivityIndicator size="small" color="#FE8C00" />
          ) : form.certificateImage ? (
            <Image 
              source={{ uri: form.certificateImage }} 
              className="w-full h-full rounded-md"
              resizeMode="contain"
            />
          ) : (
            <View className="items-center">
              <Ionicons name="document-attach-outline" size={24} color="#EF4444" />
              <Text className="text-red-500 mt-2">Certificate required</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Food Name */}
      <TextInput
        value={form.name}
        onChangeText={(text) => setForm({...form, name: text})}
        placeholder="Food Name*"
        className="border p-3 mb-3 rounded"
      />
      
      {/* Description */}
      <TextInput
        value={form.description}
        onChangeText={(text) => setForm({...form, description: text})}
        placeholder="Description*"
        multiline
        className="border p-3 mb-3 rounded h-24"
      />

      {/* Contact Number */}
      <TextInput
        value={form.number}
        onChangeText={(text) => setForm({...form, number: text})}
        placeholder="Phone Number*"
        keyboardType="phone-pad"
        className="border p-3 mb-3 rounded"
      />

      {/* Price & Category Row */}
      <View className="flex-row mb-3">
        <TextInput
          value={form.price}
          onChangeText={(text) => setForm({...form, price: text})}
          placeholder="Price*"
          keyboardType="numeric"
          className="border p-3 flex-1 rounded"
        />
        <TextInput
          value={form.category}
          onChangeText={(text) => setForm({...form, category: text})}
          placeholder="Category"
          className="border p-3 ml-2 flex-1 rounded"
        />
      </View>

      {/* Form Actions */}
      <View className="flex-row mt-2">
        <TouchableOpacity
          onPress={onCancel}
          className="bg-gray-200 flex-1 p-3 mr-2 rounded items-center"
        >
          <Text>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting || !form.certificateImage}
          className={`bg-primary flex-1 p-3 rounded items-center ${
            isSubmitting || !form.certificateImage ? 'opacity-50' : ''
          }`}
        >
          <Text className="text-white font-medium">
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};