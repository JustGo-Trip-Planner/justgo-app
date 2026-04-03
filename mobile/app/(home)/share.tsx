import { useCallback, useRef, useState, useEffect } from "react";
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
import Constants  from "expo-constants";

import GroupCard, { Group } from "@/components/share/GroupCard";
import PlanCard from "@/components/share/PlanCard";
import HomeScroll from "@/components/layout/HomeScroll";
import { useGroups } from "@/context/GroupContext";
import { useAuth } from "@/context/AuthContext";

export default function ShareScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { groups, loading, refreshGroups } = useGroups();
  const API_URL = Constants.expoConfig?.extra?.API_URL;

  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const [groupsProgress, setGroupsProgress] = useState<Group[]>([]);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        await refreshGroups();
      };

      load();
    }, [])
  );

  useEffect(() => {
    let cancelled = false;

    const loadProgress = async () => {
      const result = await Promise.all(
        (groups || []).map(async (g) => {
          try {
            const res = await axios.get<any>(`${API_URL}/api/groups/${g._id}/voting-state`);
            const p = res.data.progress;

            return {
              ...g,
              voteProgress: {
                voted: p.completedVoters,
                total: p.eligibleCount,
              },
            };
          } catch {
            return g;
          }
        })
      );

      if (!cancelled) {
        setGroupsProgress(result);
      }
    };

    if (!groups?.length) {
      setGroupsProgress([]);
      return;
    }

    loadProgress();

    return () => {
      cancelled = true;
    };
  }, [groups, API_URL]);

  const handleDeleteGroup = async (group: Group) => {
    const currentUserId = String((user as any)?.id || (user as any)?._id || "");
    const ownerId = String(group.owner?._id || "");

    if (!currentUserId || ownerId !== currentUserId) {
      Alert.alert("ไม่มีสิทธิ์", "เฉพาะเจ้าของกลุ่มเท่านั้นที่ลบได้");
      return;
    }

    Alert.alert("ลบกลุ่ม", "คุณต้องการลบกลุ่มนี้หรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ลบ",
        style: "destructive",
        onPress: async () => {
          try {
            // optimistic remove
            setGroupsProgress((prev) => prev.filter((g) => g._id !== group._id));

            await axios.delete(`${API_URL}/api/groups/${group._id}`);
            await refreshGroups();

            Alert.alert("สำเร็จ", "ลบกลุ่มเรียบร้อยแล้ว");
          } catch (err: any) {
            console.log("delete group error:", err?.response?.data || err?.message || err);

            // โหลดใหม่คืน state ให้ตรงกับ backend
            await refreshGroups();

            Alert.alert(
              "ลบกลุ่มไม่สำเร็จ",
              err?.response?.data?.message || "เกิดข้อผิดพลาดในการลบกลุ่ม"
            );
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
        <HomeScroll contentPaddingBottom={80}>
          {/* HEADER */}
          <View className="px-6 mb-6">
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
                <Ionicons name="add-circle" size={20} color="white" />

                <Text className="text-white ml-1.5 font-medium">
                  สร้างกลุ่ม
                </Text>
              </Pressable>
            </View>

            {loading ? (
              <View className="py-16 items-center">
                <ActivityIndicator />
              </View>
            ) : groupsProgress.length === 0 ? (
              <View className="flex-1 justify-center items-center px-6">
                <View className="w-full bg-white/80 rounded-3xl py-10 px-6 items-center">
                  <Ionicons name="people" size={40} color="#9CA3AF" />
                  <Text className="mt-4 text-xl font-semibold text-gray-800 text-center">
                    ยังไม่มีกลุ่ม
                  </Text>

                  <Text className="mt-2 text-gray-500 font-medium text-center leading-5">
                    สร้างกลุ่มเพื่อเริ่มวางแผน และโหวตแผนกับเพื่อน
                  </Text>

                </View>
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
                  {groupsProgress.map((group) => (
                    <GroupCard
                      key={group._id}
                      group={group}
                      isOwner={String(group.owner?._id || "") === String((user as any)?.id || (user as any)?._id || "")}
                      onPressDetail={(g) =>
                        router.push(`/share/${g._id}`)
                      }
                      onPressDelete={handleDeleteGroup}
                    />
                  ))}
                </ScrollView>

                {/* DOT PAGINATION */}

                <View className="flex-row justify-center mt-4">
                  {groupsProgress.map((_, i) => {
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
              <Ionicons name="map-outline" size={28} color="#111827" />

              <Text className="text-2xl font-semibold text-gray-900 ml-2">
                แผนการเดินทางที่แชร์
              </Text>
            </View>

            {finalizedPlans.length === 0 ? (
              <View className="flex-1 justify-center items-center">
                <View className="w-full bg-white/80 rounded-3xl py-10 px-6 items-center">

                  <Ionicons name="map" size={40} color="#9CA3AF" />

                  <Text className="mt-4 text-xl font-semibold text-gray-800 text-center">
                    ยังไม่มีแผนที่แชร์
                  </Text>

                  <Text className="mt-2 text-gray-500 font-medium text-center leading-5">
                    เมื่อมีการแชร์แผนแผนจะปรากฏที่นี่
                  </Text>

                </View>
              </View>
            ) : (
              finalizedPlans.map((plan) => (
                <PlanCard
                  key={plan._id || `${plan.trip_title}-${index}`}
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