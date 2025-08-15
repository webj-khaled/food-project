import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import { images } from '@/constants';
import { useState } from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const SellFood = () => {
    // Mock data - replace with your actual listings from state/API
    const [userListings, setUserListings] = useState([]); // Empty array = no listings
    const [showForm, setShowForm] = useState(false);
    
    const [form, setForm] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        number: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submit = async () => {
        if (!form.name || !form.description || !form.price || !form.number) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            // Submit to backend
            const newListing = {
                id: Date.now().toString(),
                ...form
            };
            
            setUserListings([...userListings, newListing]);
            setShowForm(false);
            Alert.alert('Success', 'Food item submitted!');
        } catch (error) {
            Alert.alert('Error', 'Submission failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    // No listings state
    if (userListings.length === 0 && !showForm) {
        return (
            <View className="flex-1 items-center justify-center p-5 bg-white">
                <Image 
                    source={images.upload} // Add this to your constants/images.ts
                    className="w-32 h-32 mb-6"
                    resizeMode="contain"
                />
                <Text className="text-xl font-bold mb-2">No Listings Yet</Text>
                <Text className="text-gray-500 mb-6 text-center">
                    Start earning by listing your homemade food for sale
                </Text>
                <CustomButton
                    title="List Your Food"
                    onPress={() => setShowForm(true)}
                    style="w-full"
                />
            </View>
        );
    }

    // Existing listings view
    if (userListings.length > 0 && !showForm) {
        return (
            <ScrollView className="bg-white p-5">
                <Text className="text-2xl font-bold mb-5">Your Listings</Text>
                
                {userListings.map((item) => (
                    <View key={item.id} className="mb-6 border-b border-gray-100 pb-4">
                        <Text className="text-lg font-bold">{item.name}</Text>
                        <Text className="text-gray-500 mt-1">{item.description}</Text>
                        <Text className="text-primary font-bold mt-1">${item.price}</Text>
                        
                        <View className="flex-row mt-3">
                            <CustomButton
                                title="Edit"
                                onPress={() => {
                                    setForm(item);
                                    setShowForm(true);
                                }}
                                style="mr-2 flex-1"
                                variant="outline"
                            />
                            <CustomButton
                                title="Delete"
                                onPress={() => {
                                    setUserListings(userListings.filter(listing => listing.id !== item.id));
                                }}
                                style="flex-1"
                                variant="danger"
                            />
                        </View>
                    </View>
                ))}
                
                <TouchableOpacity 
                    onPress={() => setShowForm(true)}
                    className="flex-row items-center justify-center mt-6 p-4 border border-dashed border-gray-300 rounded-lg"
                >
                    <Image 
                        source={images.plus} 
                        className="w-5 h-5 mr-2"
                        resizeMode="contain"
                    />
                    <Text className="text-primary font-bold">Add Another Listing</Text>
                </TouchableOpacity>
            </ScrollView>
        );
    }

    // Form view (shown when showForm = true)
    return (
        <ScrollView className="bg-white p-5">
            <Text className="text-2xl font-bold mb-5">
                {form.id ? 'Edit Listing' : 'List Your Food'}
            </Text>
            
            <CustomInput
                label="Food Name"
                value={form.name}
                onChangeText={(text) => setForm({...form, name: text})}
            />
            
            <CustomInput
                label="Description"
                value={form.description}
                onChangeText={(text) => setForm({...form, description: text})}
                multiline
            />
            
            <CustomInput
                label="Price ($)"
                value={form.price}
                onChangeText={(text) => setForm({...form, price: text})}
                keyboardType="numeric"
            />

            <CustomInput
                label="Phone Number"
                value={form.number}
                onChangeText={(text) => setForm({...form, number: text})}
                keyboardType="phone-pad"
                placeholder="Enter your phone number"
            />
            
            <CustomInput
                label="Category"
                value={form.category}
                onChangeText={(text) => setForm({...form, category: text})}
                placeholder="e.g. Burgers, Pizza"
            />

            <View className="flex-row mt-6">
                <CustomButton
                    title="Cancel"
                    onPress={() => {
                        setShowForm(false);
                        setForm({
                            name: '',
                            description: '',
                            price: '',
                            category: '',
                        });
                    }}
                    style="mr-2 flex-1"
                    variant="outline"
                />
                <CustomButton
                    title={form.id ? 'Update' : 'Submit'}
                    onPress={submit}
                    isLoading={isSubmitting}
                    style="flex-1"
                />
            </View>
        </ScrollView>
    );
};

export default SellFood;