import { Stack, Redirect, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  useFonts,
  Kanit_400Regular,
  Kanit_500Medium,
  Kanit_600SemiBold,
} from "@expo-google-fonts/kanit";
import { View, ActivityIndicator } from "react-native";
import "./global.css";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { PlanProvider } from "@/context/PlanContext";

function InitialRedirect() {
  const { token, loading, isNewUser } = useAuth();
  const segments = useSegments();

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const inAuthGroup = segments[0] === "(auth)";

  if (!token && !inAuthGroup) {
    return <Redirect href="/(auth)/login" />;
  }

  if (token && inAuthGroup) {
    if (isNewUser) {
      return <Redirect href="/(auth)/create-profile" />;
    }
    return <Redirect href="/(home)" />;
  }

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Kanit_400Regular,
    Kanit_500Medium,
    Kanit_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <PlanProvider>
            <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
              {/* 🔁 Routes with dynamic redirect */}
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(home)" />
                <Stack.Screen name="detail_province/[province]" />
              </Stack>

              {/* 🔁 Initial Redirect Logic */}
              <InitialRedirect />
            </SafeAreaView>
          </PlanProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
