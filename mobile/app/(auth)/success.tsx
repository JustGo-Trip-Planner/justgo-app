import { useState } from "react";
import { View, Text, TouchableOpacity, Image, ImageBackground, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function SuccessScreen() {
  const router = useRouter();
  const { login, refreshMe } = useAuth();
  const params = useLocalSearchParams<{ token: string; user: string; }>();
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (loading) return;

    try {
      setLoading(true);

      if (!params.user || !params.token) throw new Error("Missing auth data");

      const parsedUser = JSON.parse(params.user);

      await login(params.token, parsedUser, false);
      await refreshMe();

      router.replace("/(home)");
    } catch (err) {
      router.replace("/(auth)/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("@/assets/backgrounds/bg.png")}
      className="flex-1 px-6 pt-16 pb-10"
    >
      <View className="flex-1 justify-center items-center px-6 py-10 bg-cover bg-center">
        <Image
          source={require('@/assets/icons/logo.png')}
          resizeMode="contain"
          className="w-100 h-20 mb-6"
        />

        <View className="bg-white/70 p-6 rounded-2xl w-full max-w-sm items-center">
          <Text className="text-3xl font-semibold text-center mb-8 text-gray-900">สร้างบัญชีสำเร็จ!</Text>
          <Text className="text-xl font-semibold text-center mb-2 text-gray-900">คุณได้สร้างบัญชีเรียบร้อยแล้ว</Text>
          <Text className="text-gray-700 font-sans text-center mb-6">หลังจากนี้ คุณสามารถสร้างวางแผนได้{"\n"}โดยทันทีตามต้องการ</Text>

          <TouchableOpacity
            disabled={loading}
            onPress={handleStart}
            className={`px-6 py-3 rounded-xl items-center ${
              loading ? "bg-gray-300" : "bg-orange-500"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">
                เริ่มวางแผนการเดินทาง!
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}