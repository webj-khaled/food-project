import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import { signIn } from "@/lib/appwrite";
import useAuthStore from "@/store/auth.store";
import * as Sentry from '@sentry/react-native';
import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, Text, View } from 'react-native';

const SignIn = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const { fetchAuthenticatedUser } = useAuthStore(); // Use the fetch function from store

  const submit = async () => {
    const { email, password } = form;

    if(!email || !password) return Alert.alert('Error', 'Please enter valid email address & password.');

    setIsSubmitting(true);

    try {
      // Sign in to Appwrite
      await signIn({ email, password });
    const authState = useAuthStore.getState();
    console.log('After sign-in - isAuthenticated:', authState.isAuthenticated);
    console.log('After sign-in - user:', authState.user);
      
      // Fetch the authenticated user to update the store state
      await fetchAuthenticatedUser();
      
      Alert.alert('Success', "Signed in successfully!");
      router.navigate('/');
    } catch(error: any) {
      Alert.alert('Error', error.message);
      Sentry.captureEvent(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View className="gap-10 bg-white rounded-lg p-5 mt-5">
      <CustomInput
        placeholder="Enter your email"
        value={form.email}
        onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
        label="Email"
        keyboardType="email-address"
      />
      <CustomInput
        placeholder="Enter your password"
        value={form.password}
        onChangeText={(text) => setForm((prev) => ({ ...prev, password: text }))}
        label="Password"
        secureTextEntry={true}
      />

      <CustomButton
        title="Sign In"
        isLoading={isSubmitting}
        onPress={submit}
      />

      <View className="flex justify-center mt-5 flex-row gap-2">
        <Text className="base-regular text-gray-100">
          do not have an account?
        </Text>
        <Link href="/sign-up" className="base-bold text-primary">
          Sign Up
        </Link>
      </View>
    </View>
  );
}

export default SignIn;