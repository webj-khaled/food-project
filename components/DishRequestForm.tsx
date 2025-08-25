// components/DishRequestForm.tsx
import DateTimePicker from '@react-native-community/datetimepicker'; // ADD THIS
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type DishRequestFormProps = {
  onSubmit: (request: {
    dish_name: string;
    description: string;
    delivery_type: 'pickup' | 'delivery'; // CHANGED
    delivery_address?: string; // NEW
    price: number;
    time: string;
    date: string;
    number: number;
  }) => void;
  onCancel: () => void;
};

export const DishRequestForm = ({ onSubmit, onCancel }: DishRequestFormProps) => {
   const insets = useSafeAreaInsets();
  const [form, setForm] = useState({
    dish_name: '',
    description: '',
    delivery_type: 'pickup' as 'pickup' | 'delivery', // NEW
    delivery_address: '', // NEW
    price: '',
    time: '',
    date: '',
    number: ''
  });
  const [showDatePicker, setShowDatePicker] = useState(false); // NEW

  // NEW: Handle date selection
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setForm({...form, date: selectedDate.toISOString().split('T')[0]});
    }
  };

  const handleSubmit = () => {
    // Basic validation
    if (!form.dish_name.trim()) {
      Alert.alert('Error', 'Dish name is required');
      return;
    }
    if (!form.price.trim() || isNaN(parseFloat(form.price))) {
      Alert.alert('Error', 'Valid price is required');
      return;
    }
    if (!form.time.trim()) {
      Alert.alert('Error', 'Time is required');
      return;
    }
    if (!form.date.trim()) {
      Alert.alert('Error', 'Date is required');
      return;
    }
    if (!form.number.trim() || isNaN(parseInt(form.number))) {
      Alert.alert('Error', 'Valid phone number is required');
      return;
    }
    if (form.delivery_type === 'delivery' && !form.delivery_address.trim()) {
      Alert.alert('Error', 'Delivery address is required for delivery');
      return;
    }

    onSubmit({
      dish_name: form.dish_name,
      description: form.description,
      delivery_type: form.delivery_type, // CHANGED
      delivery_address: form.delivery_type === 'delivery' ? form.delivery_address : undefined, // NEW
      price: parseFloat(form.price),
      time: form.time,
      date: form.date,
      number: parseInt(form.number)
    });
  };

  return (
    <ScrollView className=" bg-white flex-1" contentContainerStyle={{ 
        padding: 16,
        paddingTop: insets.top + 20 
      }}>
      <Text className="text-xl font-bold mb-4">Create Dish Request</Text>

      {/* Dish Name */}
      <TextInput
        value={form.dish_name}
        onChangeText={(text) => setForm({...form, dish_name: text})}
        placeholder="Dish Name *"
        className="border p-3 mb-3 rounded"
      />

      {/* Description */}
      <TextInput
        value={form.description}
        onChangeText={(text) => setForm({...form, description: text})}
        placeholder="Describe yourr food thoroughly,, the amunt, ingerdients, how would you like it to be cooked, spices, and allergies if you have etc."
        multiline
        className="border p-3 mb-2 rounded h-32" // Changed h-20 to h-32 (taller)
        textAlignVertical="top"
      />

      {/* Price */}
      <TextInput
        value={form.price}
        onChangeText={(text) => setForm({...form, price: text})}
        placeholder="Price *"
        keyboardType="numeric"
        className="border p-3 mb-3 rounded"
      />

      {/* Time - 24h format */}
      <TextInput
        value={form.time}
        onChangeText={(text) => setForm({...form, time: text})}
        placeholder="Time (24h format, e.g., 19:00) *"
        keyboardType="numbers-and-punctuation"
        className="border p-3 mb-3 rounded"
      />

      {/* Date - Calendar Picker */}
      <TouchableOpacity 
        onPress={() => setShowDatePicker(true)}
        className="border p-3 mb-3 rounded justify-center"
      >
        <Text className={form.date ? 'text-black' : 'text-gray-400'}>
          {form.date || 'Select Date *'}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      )}

      {/* Number of People - Changed to Phone Number */}
      <TextInput
        value={form.number}
        onChangeText={(text) => setForm({...form, number: text})}
        placeholder="Phone Number *"
        keyboardType="phone-pad"
        className="border p-3 mb-3 rounded"
      />

      {/* Delivery Type Toggle */}
      <View className="mb-3">
        <Text className="font-medium mb-2">Delivery Type *</Text>
        <View className="flex-row">
          <TouchableOpacity
            onPress={() => setForm({...form, delivery_type: 'pickup'})}
            className={`flex-1 p-3 mr-2 rounded items-center ${
              form.delivery_type === 'pickup' ? 'bg-primary' : 'bg-gray-200'
            }`}
          >
            <Text className={form.delivery_type === 'pickup' ? 'text-white' : 'text-gray-600'}>
              Pickup
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setForm({...form, delivery_type: 'delivery'})}
            className={`flex-1 p-3 rounded items-center ${
              form.delivery_type === 'delivery' ? 'bg-primary' : 'bg-gray-200'
            }`}
          >
            <Text className={form.delivery_type === 'delivery' ? 'text-white' : 'text-gray-600'}>
              Delivery
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Delivery Address (Conditional) */}
      {form.delivery_type === 'delivery' && (
        <TextInput
          value={form.delivery_address}
          onChangeText={(text) => setForm({...form, delivery_address: text})}
          placeholder="Delivery Address *"
          className="border p-3 mb-3 rounded"
        />
      )}

      {/* Pickup Message (Conditional) */}
      {form.delivery_type === 'pickup' && (
        <View className="bg-blue-50 p-3 rounded mb-3">
          <Text className="text-blue-800 text-sm">
            Pickup location will be shown after a chef accepts your request
          </Text>
        </View>
      )}

      {/* Form Actions */}
      <View className="flex-row mt-4">
        <TouchableOpacity
          onPress={onCancel}
          className="bg-gray-200 flex-1 p-3 mr-2 rounded items-center"
        >
          <Text>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          className="bg-primary flex-1 p-3 rounded items-center"
        >
          <Text className="text-white font-medium">Submit Request</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};