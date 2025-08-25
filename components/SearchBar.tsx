import { images } from "@/constants";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Image, TextInput, TouchableOpacity, View } from "react-native";

interface SearchbarProps {
  query?: string;
  onQueryChange?: (text: string) => void;
}

const Searchbar = ({ 
  query: initialQuery = "",
  onQueryChange = () => {}
}: SearchbarProps) => {
    const params = useLocalSearchParams<{ query: string }>();
    const [query, setQuery] = useState(initialQuery || params.query);

    const handleSearch = (text: string) => {
        setQuery(text);
        onQueryChange(text);

        if(!text) router.setParams({ query: undefined });
    };

    const handleSubmit = () => {
        if(query.trim()) router.setParams({ query });
    }

    return (
        <View className="searchbar flex-row items-center border border-gray-200 rounded-full px-4 bg-white">
            <TextInput
                className="flex-1 p-4"
                placeholder="Search for pizzas, burgers..."
                value={query}
                onChangeText={handleSearch}
                onSubmitEditing={handleSubmit}
                placeholderTextColor="#A0A0A0"
                returnKeyType="search"
            />
            <TouchableOpacity
                className="p-2"
                onPress={handleSubmit}
            >
                <Image
                    source={images.search}
                    className="w-5 h-5"
                    resizeMode="contain"
                    tintColor="#5D5F6D"
                />
            </TouchableOpacity>
        </View>
    );
};

export default Searchbar;