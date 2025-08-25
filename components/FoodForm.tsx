import { appwriteConfig, storage } from '@/lib/appwrite';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system';
import { launchImageLibraryAsync } from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ID } from 'react-native-appwrite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';



type FoodFormProps = {
  initialValues?: {
    name: string;
    description: string;
    number: string;
    price: string;
    category?: string;
    location?: string; // NEW
    certificateImage?: string | null;
    foodImage?: string | null;
  };
  onSubmit: (values: {
    name: string;
    description: string;
    number: string;
    price: number;
    category?: string;
    location: string; // NEW
    certificateImage?: string | null;
    foodImage?: string | null;
  }) => Promise<void>;
  onCancel: () => void;
};

export const FoodForm = ({ initialValues, onSubmit, onCancel }: FoodFormProps) => {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({
    name: initialValues?.name || '',
    description: initialValues?.description || '',
    number: initialValues?.number || '',
    price: initialValues?.price || '',
    category: initialValues?.category || '',
    certificateImage: initialValues?.certificateImage || null,
    location: initialValues?.location || '', // NEW
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
  const CATEGORIES = [
      'Italian',
      'Mexican', 
      'Indian',
      'Chinese',
      'Japanese',
      'Mediterranean',
      'American',
      'Vegetarian',
      'Vegan',
      'Gluten-Free'
    ];
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
    if (!form.location.trim()) {
      Alert.alert('Error', 'Please enter your location');
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
  <ScrollView 
    className="flex-1 bg-white"
    contentContainerStyle={{
      paddingTop: insets.top + 20,
      paddingBottom: insets.bottom + 100,
      paddingHorizontal: 16
    }}
    keyboardShouldPersistTaps="handled"
  >
    {/* Food Details Header */}
    <View className="pt-2 pb-4">
      <Text className="text-xl font-bold">Food Details</Text>
    </View>
    
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
            <Text className="text-gray-500 mt-2">Tap to add food photo (optional)</Text>
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
    </View>

    {/* Category Picker */}
    <View className="border border-gray-300 flex-1 rounded mb-5 " style={{ height: 55, justifyContent: 'center' }}
    >
      <Picker
        selectedValue={form.category}
        onValueChange={(value) => setForm({...form, category: value})}
        dropdownIconColor="#FE8C00"
        mode="dropdown"
        style={{
          height: '100%',
          width: '100%',
          color: form.category ? '#000' : '#9CA3AF',
          transform: [{ scale: 0.95 }] // Fix for Android text cutoff
        }}
      >
        <Picker.Item 
          label="Select Category" 
          value="" 
          enabled={false} // Makes the placeholder non-selectable
          style={{ color: '#9CA3AF', fontSize: 14 }} 
        />
        {CATEGORIES.map(category => (
          <Picker.Item
            key={category}
            label={category}
            value={category}
            style={{ fontSize: 14 }} // Consistent text size
          />
        ))}
      </Picker>
    </View>


    {/* Location */}
    <TextInput
      value={form.location}
      onChangeText={(text) => setForm({...form, location: text})}
      placeholder="Enter your food pick-up Location in details *"
      className="border p-3 mb-3 rounded"
    />

    {/* Form Actions */}
    <View className="flex-row mt-2 mb-4">
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
  </ScrollView>
);
}