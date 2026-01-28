import { ScrollView, View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const { logout, user } = useAuth();
  const router = useRouter();

  const menuItems = [
    { title: "โปรไฟล์ส่วนตัว", icon: "person-outline", onPress: () => {} },
    { title: "รูปแบบการเดินทางที่คุณชอบ", icon: "heart-outline", onPress: () => {} },
    { title: "ภาษา", icon: "globe-outline", onPress: () => {} },
    {
      title: "ออกจากระบบ",
      icon: "exit-outline",
      isDanger: true,
      onPress: async () => {
        await logout();
        router.replace("/login");
      },
    },
  ];

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={24} color="#333" />
        </TouchableOpacity>
        <Text className="ml-4 text-lg font-semibold">ตั้งค่า</Text>
      </View>

      <View className="items-center mt-6 mb-8 px-4">
        <Image
          source={
            user?.avatar
              ? { uri: user.avatar }
              : require("@/assets/images/avatar.png")
          }
          className="w-32 h-32 rounded-full"
          resizeMode="cover"
        />
        <Text className="mt-3 text-3xl font-semibold">
          {user?.first_name || "บัญชีผู้ใช้"}
        </Text>
      </View>

      <View className="px-4">
        {menuItems.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={item.onPress}
            className={`flex-row items-center py-4 border-b border-gray-200 ${
              item.isDanger ? "bg-red-50" : ""
            }`}
          >
            <Ionicons
              name={item.icon}
              size={24}
              color={item.isDanger ? "#DC2626" : "#333"}
            />
            <Text
              className={`ml-4 text-base ${
                item.isDanger ? "text-red-600" : "text-gray-800"
              }`}
            >
              {item.title}
            </Text>
            <Ionicons
              name="chevron-forward-outline"
              size={20}
              color={item.isDanger ? "#DC2626" : "#aaa"}
              className="ml-auto"
            />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
