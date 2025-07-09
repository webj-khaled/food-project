import { images } from "@/constants";
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

const CartButton = () => {
    const totalItems = 10; // This should be replaced with actual logic to get the total items in the cart
  return (
        <TouchableOpacity className="cart-btn" onPress={()=> ('')}>
            <Image source={images.bag} className="size-5" resizeMode="contain" />

            {totalItems > 0 && (
                <View className="cart-badge">
                    <Text className="small-bold text-white">{totalItems}</Text>
                </View>
            )}
        </TouchableOpacity>
    )
}

export default CartButton;
// This component should be used in the main app file or wherever the cart button is needed.