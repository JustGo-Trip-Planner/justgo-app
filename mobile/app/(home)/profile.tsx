import {
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";

type IconName = keyof typeof Ionicons.glyphMap;

export default function ProfileScreen() {
  const { logout, user } = useAuth();
  const router = useRouter();

  const menuItems: {
    title: string;
    icon: IconName;
    onPress: () => void;
  }[] = [
    {
      title: "โปรไฟล์ส่วนตัว",
      icon: "person-outline",
      onPress: () => {
        router.push("/profile/edit");
      },
    },
    {
      title: "รูปแบบการเดินทาง",
      icon: "heart-outline",
      onPress: () => {},
    },
    {
      title: "ภาษา",
      icon: "globe-outline",
      onPress: () => {},
    },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* HEADER */}
      <View className="flex-row items-center justify-center px-4 pt-6 pb-4">
        <Text className="text-base text-center font-semibold text-gray-900">
          โปรไฟล์
        </Text>
      </View>

      {/* PROFILE CARD */}
      <View className="px-4">
        <View className="bg-white rounded-2xl px-4 py-4 flex-row items-center shadow-sm">
          <Image
            source={
              user?.avatar
                ? { uri: user.avatar }
                : require("@/assets/images/avatar.png")
            }
            className="w-20 h-20 rounded-full"
          />

          <View className="ml-4 flex-1">
            <Text className="text-xl font-semibold text-gray-900">
              {user?.first_name} {user?.last_name}
            </Text>
            <Text className="text-sm text-gray-400 mt-1">
              {user?.phone || "ไม่มีเบอร์โทร"}
            </Text>
          </View>
        </View>
      </View>

      {/* SETTINGS */}
      <View className="px-4 mt-6">
        <Text className="mb-3 text-sm font-semibold text-gray-400">
          การตั้งค่า
        </Text>

        <View className="bg-white rounded-2xl shadow-sm">
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={item.onPress}
              className="flex-row items-center px-4 py-4"
            >
              <View className="w-10 h-10 rounded-xl bg-gray-100 items-center justify-center">
                <Ionicons name={item.icon} size={20} color="#111" />
              </View>

              <Text className="ml-4 text-base font-medium text-gray-800">
                {item.title}
              </Text>

              <Ionicons
                name="chevron-forward"
                size={18}
                color="#bbb"
                className="ml-auto"
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* LOGOUT */}
      <View className="px-4 mt-8 mb-10">
        <TouchableOpacity
          onPress={async () => {
            await logout();
            router.replace("/login");
          }}
          className="flex-row items-center justify-center bg-red-50 py-4 rounded-2xl"
        >
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text className="ml-2 text-red-600 font-semibold text-base">
            ออกจากระบบ
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}