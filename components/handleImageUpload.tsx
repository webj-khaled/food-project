import { uploadImage } from '@/lib/appwrite';
import { Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';


export const handleImageUpload = async (type: 'food' | 'certificate') => {
  try {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    });

    if (!result.assets?.[0]?.uri) return;

    const imageUrl = await uploadImage(result.assets[0].uri, type);
    
    setForm(prev => ({
      ...prev,
      [type === 'food' ? 'foodImage' : 'certificateImage']: imageUrl
    }));

  } catch (error) {
    Alert.alert('Error', 'Failed to upload image');
  }
};