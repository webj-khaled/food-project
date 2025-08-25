import { PublicListingCard } from '@/components/PublicListingCard';
import Searchbar from '@/components/SearchBar';
import { getActiveListings } from '@/lib/appwrite';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // ADD THIS

export default function Home() {
  const insets = useSafeAreaInsets();
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { documents } = await getActiveListings();
      setListings(documents);
    } catch (error) {
      console.error('Home/fetchData error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredListings = listings.filter(listing => 
    listing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <View className="px-4 pt-4 pb-2 bg-white">
        <Searchbar 
          query={searchQuery}
          onQueryChange={setSearchQuery}
        />
      </View>

      <ScrollView 
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        <Text className="text-xl font-bold my-4">Available Listings</Text>
        {filteredListings.length === 0 ? (
          <Text className="text-center py-8 text-gray-500">
            {searchQuery ? 'No matching listings found' : 'No active listings'}
          </Text>
        ) : (
          filteredListings.map((listing) => {
            const sellerName = typeof listing.sellerId === 'object' 
              ? listing.sellerId.name 
              : 'Seller';
              
            return (
              <PublicListingCard
                key={listing.$id}
                title={listing.name}
                price={listing.price}
                description={listing.description}
                imageUrl={listing.foodImage}
                sellerName={sellerName}
                className="mb-4"
              />
            );
          })
        )}
      </ScrollView>
    </View>
  );
}