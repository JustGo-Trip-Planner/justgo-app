import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";

export default function LoadingPage() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
    }, 120000); // 120 sec

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View className="flex-1 justify-center items-center bg-white px-8">
      <ActivityIndicator size="large" color="#f97316" />

      <Text className="mt-6 text-xl font-medium text-gray-800 text-center">
        กำลังสร้างแผนการเดินทางของคุณ...
      </Text>
      <Text className="text-sm font-sans text-gray-500 text-center mt-2">
        ระบบกำลังวางแผนจากข้อมูลที่คุณเลือก อาจใช้เวลาสักครู่
      </Text>
    </View>
  );
}
