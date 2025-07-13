// Importing necessary components and libraries
import CustomButton from "@/components/CustomButton"; // Custom button component
import CustomInput from "@/components/CustomInput"; // Custom input component
import { createUser } from "@/lib/appwrite"; // Function to create user in Appwrite
import { Link, router } from "expo-router"; // Routing utilities
import { useState } from "react"; // React hook for state management
import { Alert, Text, View } from 'react-native'; // React Native components

const SignIn = () => {
  // State for tracking form submission status
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for form data (name, email, password)
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '' 
  });

  // Form submission handler
  const submit = async () => {
    // Destructure form values
    const { name, email, password } = form;

    // Validate form inputs
    if(!name || !email || !password) {
      return Alert.alert('Error', 'Please enter valid email address & password.');
    }

    // Set loading state
    setIsSubmitting(true);

    try {
      // Call createUser function from Appwrite
      await createUser({ email, password, name });
      
      // Navigate to home screen after successful signup
      router.replace('/');
    } catch(error: any) {
      // Show error alert if signup fails
      Alert.alert('Error', error.message);
    } finally {
      // Reset loading state regardless of success/failure
      setIsSubmitting(false);
    }
  }

  // Component rendering
  return (
    <View className="gap-10 bg-white rounded-lg p-5 mt-5">
      {/* Name Input Field */}
      <CustomInput
        placeholder="Enter your name"
        value={form.name}
        onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
        label="Name"
      />
      
      {/* Email Input Field */}
      <CustomInput
        placeholder="Enter your email"
        value={form.email}
        onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
        label="Email"
        keyboardType="email-address" // Shows email keyboard on mobile
      />
      
      {/* Password Input Field */}
      <CustomInput
        placeholder="Enter your password"
        value={form.password}
        onChangeText={(text) => setForm((prev) => ({ ...prev, password: text }))}
        label="Password"
        secureTextEntry={true} // Hides password text
      />

      {/* Sign Up Button */}
      <CustomButton
        title="Sign Up"
        isLoading={isSubmitting} // Shows loading indicator when submitting
        onPress={submit} // Calls submit function when pressed
      />

      {/* Sign In Link */}
      <View className="flex justify-center mt-5 flex-row gap-2">
        <Text className="base-regular text-gray-100">
          Already have an account?
        </Text>
        <Link href="/sign-in" className="base-bold text-primary">
          Sign In
        </Link>
      </View>
    </View>
  )
}

export default SignIn;