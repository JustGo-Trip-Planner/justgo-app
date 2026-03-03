import { useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ImageBackground,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import axios from "axios";

import GroupCard, { Group } from "@/components/share/GroupCard";
import HomeScroll from "@/components/layout/HomeScroll";
import { useGroups } from "@/context/GroupContext";
import { useAuth } from "@/context/AuthContext";

export default function ShareScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { groups, loading, refreshGroups } = useGroups();

  useFocusEffect(
    useCallback(() => {
      refreshGroups();
    }, [refreshGroups])
  );

  const handleDeleteGroup = async (group: Group) => {
    Alert.alert("ลบกลุ่ม", "คุณต้องการลบกลุ่มนี้หรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ลบ",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`/api/groups/${group._id}`);
            await refreshGroups();
          } catch (err) {
            Alert.alert("ลบกลุ่มไม่สำเร็จ");
          }
        },
      },
    ]);
  };

  return (
    <ImageBackground
      source={require("@/assets/backgrounds/bg.png")}
      resizeMode="cover"
      className="flex-1"
    >
      <View className="flex-1">
        <HomeScroll contentPaddingBottom={80}>
          {/* Title */}
          <Text className="text-2xl text-blue-900 font-semibold">
            แชร์แผนการเดินทาง
          </Text>
          <Text className="text-base font-medium text-blue-800 mb-6">
            ร่วมเดินทางกับผู้อื่น
          </Text>

          {/* Glass Wrapper */}
          <View className="bg-white/80 rounded-3xl p-5 shadow-lg">
            {/* Group Section */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-semibold text-gray-800">
                กลุ่มของคุณ
              </Text>

              <Pressable
                onPress={() => router.push("/share/create-group")}
                className="flex-row items-center bg-blue-500 px-4 py-2 rounded-full"
              >
                <Ionicons name="people" size={16} color="white" />
                <Text className="text-white ml-2 text-sm font-medium">
                  สร้างกลุ่ม
                </Text>
              </Pressable>
            </View>

            {loading ? (
              <ActivityIndicator />
            ) : groups.length === 0 ? (
              <Text className="text-gray-500 text-center py-6">
                ยังไม่มีกลุ่ม
              </Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-6"
              >
                {groups.map((group) => (
                  <GroupCard
                    key={group._id}
                    group={group}
                    isOwner={group.owner === user?.id}
                    onPressDetail={(g) => router.push(`/share/${g._id}`)}
                    onPressDelete={handleDeleteGroup}
                  />
                ))}
              </ScrollView>
            )}
          </View>
        </HomeScroll>
      </View>
    </ImageBackground>
  );
}