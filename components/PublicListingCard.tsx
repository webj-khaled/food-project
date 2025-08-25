import { Image, Text, TouchableOpacity, View } from 'react-native';

type PublicListingCardProps = {
  title: string;
  price: number;
  description?: string;
  imageUrl?: string;
  sellerName?: string;
  className?: string;
};

export const PublicListingCard = ({
  title,
  price,
  description,
  imageUrl,
  sellerName,
}: PublicListingCardProps) => {
  return (
    <TouchableOpacity className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
      {/* Image */}
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          className="w-full h-48"
          resizeMode="cover"
        />
      )}

      {/* Content */}
      <View className="p-4">
        <Text className="text-lg font-bold" numberOfLines={1}>
          {title}
        </Text>
        
        {sellerName && (
          <Text className="text-gray-500 text-sm mt-1">
            Sold by: {sellerName}
          </Text>
        )}

        {description && (
          <Text className="text-gray-600 mt-2" numberOfLines={2}>
            {description}
          </Text>
        )}

        <Text className="text-primary font-bold mt-3">
          ${price.toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};