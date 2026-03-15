import { useCallback, useRef, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ImageBackground,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import axios from "axios";

import GroupCard, { Group } from "@/components/share/GroupCard";
import PlanCard from "@/components/share/PlanCard";
import HomeScroll from "@/components/layout/HomeScroll";
import { useGroups } from "@/context/GroupContext";
import { useAuth } from "@/context/AuthContext";

export default function ShareScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { groups, loading, refreshGroups } = useGroups();

  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

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
          } catch {
            Alert.alert("ลบกลุ่มไม่สำเร็จ");
          }
        },
      },
    ]);
  };

  const finalizedPlans = groups
    .filter((g: any) => g.finalizedPlanId)
    .map((g: any) => ({
      ...g.finalizedPlanId,
      groupName: g.name,
      members: g.members,
    }));

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const cardWidth = 336;

    const i = Math.round(x / cardWidth);

    const safeIndex = Math.max(0, Math.min(i, groups.length - 1));

    setIndex(safeIndex);
  };

  return (
    <ImageBackground
      source={require("@/assets/backgrounds/bg.png")}
      resizeMode="cover"
      className="flex-1"
    >
      <View className="flex-1">
        <HomeScroll contentPaddingBottom={120}>
          {/* HEADER */}
          <View className="px-6 pt-4 mb-6">
            <Text className="text-2xl font-semibold text-sky-700">
              แชร์แผนการเดินทาง
            </Text>

            <Text className="text-lg font-sans text-sky-700 mt-1">
              ร่วมวางแผนและโหวตแผนกับเพื่อน
            </Text>
          </View>

          {/* GROUP SECTION */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center px-6 mb-4">
              <Text className="text-2xl font-semibold text-gray-900">
                กลุ่มของคุณ
              </Text>

              <Pressable
                onPress={() => router.push("/share/create-group")}
                className="flex-row items-center bg-sky-700 px-4 py-2 rounded-full"
              >
                <Ionicons name="add" size={20} color="white" />

                <Text className="text-white ml-1 font-medium">
                  สร้างกลุ่ม
                </Text>
              </Pressable>
            </View>

            {loading ? (
              <View className="py-16 items-center">
                <ActivityIndicator />
              </View>
            ) : groups.length === 0 ? (
              <View className="py-16 items-center">
                <Ionicons name="people-outline" size={34} color="#9CA3AF" />

                <Text className="text-gray-500 mt-3">
                  ยังไม่มีกลุ่ม
                </Text>
              </View>
            ) : (
              <View>
                <ScrollView
                  ref={scrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  onScroll={onScroll}
                  scrollEventThrottle={16}
                  snapToInterval={336}
                  decelerationRate="fast"
                  contentContainerStyle={{
                    paddingLeft: 24,
                    paddingRight: 12,
                  }}
                >
                  {groups.map((group) => (
                    <GroupCard
                      key={group._id}
                      group={group}
                      isOwner={group.owner === user?.id}
                      onPressDetail={(g) =>
                        router.push(`/share/${g._id}`)
                      }
                      onPressDelete={handleDeleteGroup}
                    />
                  ))}
                </ScrollView>

                {/* DOT PAGINATION */}

                <View className="flex-row justify-center mt-4">
                  {groups.map((_, i) => {
                    const active = i === index;

                    return (
                      <View
                        key={i}
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: 4,
                          marginHorizontal: 4,
                          backgroundColor: active
                            ? "#0069a8"
                            : "#D1D5DB",
                        }}
                      />
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* SHARED PLANS */}
          <View className="px-6">
            <View className="flex-row items-center mb-4">
              <Ionicons name="map-outline" size={20} color="#111827" />

              <Text className="text-2xl font-semibold text-gray-900 ml-2">
                แผนการเดินทางที่แชร์
              </Text>
            </View>

            {finalizedPlans.length === 0 ? (
              <View className="py-16 items-center">
                <Ionicons name="map-outline" size={34} color="#9CA3AF" />

                <Text className="text-gray-500 mt-3">
                  ยังไม่มีแผนที่แชร์
                </Text>
              </View>
            ) : (
              finalizedPlans.map((plan) => (
                <PlanCard
                  key={plan._id}
                  plan={plan}
                  groupName={plan.groupName}
                  members={plan.members}
                  onPress={() =>
                    router.push(`/trip/${plan._id}?viewOnly=true`)
                  }
                />
              ))
            )}
          </View>
        </HomeScroll>
      </View>
    </ImageBackground>
  );
}