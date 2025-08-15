import { images } from '@/constants';
import { Image, Text, TouchableOpacity, View } from 'react-native';

type EmptyStateProps = {
  title: string;
  subtitle: string;
  buttonText?: string;
  onPress?: () => void;
};

export const EmptyState = ({
  title,
  subtitle,
  buttonText = "Create Listing",
  onPress,
}: EmptyStateProps) => (
  <View className="items-center justify-center p-6">
    <Image 
      source={images.upload} 
      className="w-32 h-32 mb-4"
      resizeMode="contain"
    />
    <Text className="text-xl font-bold mb-1">{title}</Text>
    <Text className="text-gray-500 mb-6 text-center">{subtitle}</Text>
    
    {onPress && (
      <TouchableOpacity 
        onPress={onPress}
        className="bg-primary px-6 py-3 rounded-lg"
      >
        <Text className="text-white font-bold">{buttonText}</Text>
      </TouchableOpacity>
    )}
  </View>
);