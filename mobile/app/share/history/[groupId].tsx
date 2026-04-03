import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import Constants from "expo-constants";
import Ionicons from "@expo/vector-icons/Ionicons";

type HistoryItem = {
  _id: string;
  archivedAt: string;
  archiveReason: "archived_by_owner" | "completed";
  finalizedPlanId: {
    _id: string;
    trip_title: string;
    previewImage?: string;
    total_budget: number;
    start_date?: string;
    end_date?: string;
  };
};

const formatBudget = (value?: number) => {
  const num = Number(value || 0);
  return `฿${num.toLocaleString("th-TH")}`;
};

const formatThaiDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatThaiDateRange = (start?: string, end?: string) => {
  if (!start || !end) return "-";

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "-";
  }

  return `${startDate.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  })} - ${endDate.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
};

export default function TripHistoryScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const gid = Array.isArray(groupId) ? groupId[0] : groupId;

  const router = useRouter();
  const API_URL = Constants.expoConfig?.extra?.API_URL;

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/groups/${gid}/history`);
        setHistory(res.data ?? []);
      } catch (e) {
        console.log("history load error", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [gid, API_URL]);

  const totalTrips = useMemo(() => history.length, [history.length]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F8FAFC] px-6">
        <View className="items-center rounded-[28px] border border-white/70 bg-white px-8 py-8 shadow-sm">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-sky-50">
            <ActivityIndicator size="small" color="#0369A1" />
          </View>
          <Text className="mt-4 text-lg font-semibold font-sans text-gray-900">
            กำลังโหลดประวัติการเดินทาง
          </Text>
          <Text className="mt-1 text-center text-sm font-medium font-sans text-gray-500">
            กรุณารอสักครู่
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <LinearGradient
        colors={["#E0F2FE", "#F8FAFC", "#F8FAFC"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="absolute inset-0"
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 56,
          paddingBottom: 36,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              className="h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/90 shadow-sm"
            >
              <Ionicons name="chevron-back" size={22} color="#0F172A" />
            </Pressable>

            <View className="ml-3">
              <Text className="text-xl font-semibold font-sans text-gray-900">
                ประวัติการเดินทาง
              </Text>
              <Text className="mt-0.5 text-sm font-medium font-sans text-gray-500">
                ทั้งหมด {totalTrips} ทริป
              </Text>
            </View>
          </View>
        </View>

        {history.length === 0 ? (
          <View className="mt-10 items-center rounded-[32px] border border-white/80 bg-white/90 px-6 py-10 shadow-sm">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-sky-50">
              <Ionicons name="time" size={34} color="#0284C7" />
            </View>

            <Text className="mt-5 text-xl font-semibold font-sans text-gray-900">
              ยังไม่มีประวัติการเดินทาง
            </Text>

            <Text className="mt-2 text-center text-sm font-medium font-sans leading-6 text-gray-500">
              เมื่อกลุ่มของคุณจบทริปหรือมีการจัดเก็บแผน
              {"\n"}รายการประวัติจะมาแสดงที่หน้านี้
            </Text>
          </View>
        ) : (
          <View className="pt-1">
            {history.map((item, index) => {
              const img = item.finalizedPlanId?.previewImage
                ? { uri: item.finalizedPlanId.previewImage }
                : require("@/assets/images/default.png");

              const isCompleted = item.archiveReason === "completed";

              const statusText = isCompleted
                ? "ทริปสำเร็จแล้ว"
                : "เจ้าของกลุ่มจัดเก็บแผน";

              const statusIcon = isCompleted ? "checkmark-circle" : "archive";
              const statusBg = isCompleted ? "bg-emerald-50" : "bg-orange-50";
              const statusTextColor = isCompleted
                ? "text-emerald-700"
                : "text-orange-700";

              const tripDateText = formatThaiDateRange(
                item.finalizedPlanId?.start_date,
                item.finalizedPlanId?.end_date
              );

              return (
                <View key={item._id} className="flex-row">
                  <View className="mr-4 w-[74px] items-center">
                    <Text className="mb-2 text-center text-xs font-semibold font-sans text-sky-800">
                      {formatThaiDate(item.archivedAt)}
                    </Text>

                    <View className="h-4 w-4 rounded-full overflow-hidden">
                      <LinearGradient
                        colors={["#0EA5E9", "#0369A1"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ flex: 1 }}
                      />
                    </View>

                    {index !== history.length - 1 && (
                      <View className="mt-2 w-[2px] flex-1 rounded-full bg-sky-100" />
                    )}
                  </View>

                  <View className="mb-8 flex-1">
                    <View className="overflow-hidden rounded-[28px] border border-white/80 bg-white/95 shadow-sm">
                      <ImageBackground
                        source={img}
                        className="h-40 w-full"
                        imageStyle={{
                          borderTopLeftRadius: 28,
                          borderTopRightRadius: 28,
                        }}
                        resizeMode="cover"
                      >
                        <LinearGradient
                          colors={[
                            "rgba(15,23,42,0.03)",
                            "rgba(15,23,42,0.42)",
                          ]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          className="flex-1 justify-between p-4"
                        >
                          <View className="flex-row justify-end">
                            <View
                              className={`flex-row items-center rounded-full px-3 py-1.5 ${statusBg}`}
                            >
                              <Ionicons
                                name={statusIcon as any}
                                size={14}
                                color={isCompleted ? "#047857" : "#C2410C"}
                              />
                              <Text
                                className={`ml-1 text-xs font-semibold font-sans ${statusTextColor}`}
                              >
                                {statusText}
                              </Text>
                            </View>
                          </View>

                          <View className="self-start rounded-full bg-black/35 px-3 py-1.5">
                            <Text className="text-xs font-medium font-sans text-white">
                              แผนเดินทาง {tripDateText}
                            </Text>
                          </View>
                        </LinearGradient>
                      </ImageBackground>

                      <View className="p-4">
                        <Text
                          className="text-lg font-semibold font-sans leading-7 text-gray-900"
                          numberOfLines={2}
                        >
                          {item.finalizedPlanId?.trip_title || "ไม่พบชื่อทริป"}
                        </Text>

                        <View className="mt-4 rounded-2xl bg-gray-50 px-4 py-3">
                          <View className="flex-row items-center justify-between">
                            <View className="mr-3 flex-1">
                              <Text className="text-xs font-medium font-sans text-gray-500">
                                วันที่จัดเก็บ
                              </Text>
                              <Text className="mt-1 text-sm font-semibold font-sans text-gray-900">
                                {formatThaiDate(item.archivedAt)}
                              </Text>
                            </View>

                            <View className="h-10 w-[1px] bg-gray-200" />

                            <View className="ml-3 flex-1">
                              <Text className="text-xs font-medium font-sans text-gray-500">
                                งบประมาณ
                              </Text>
                              <Text className="mt-1 text-sm font-semibold font-sans text-gray-900">
                                {formatBudget(item.finalizedPlanId?.total_budget)}
                              </Text>
                            </View>
                          </View>

                          <View className="mt-3 h-[1px] bg-gray-200" />

                          <View className="mt-3 flex-row items-center justify-between">
                            <View className="flex-row items-center">
                              <View className="h-8 w-8 items-center justify-center rounded-full bg-sky-100">
                                <Ionicons
                                  name="calendar"
                                  size={15}
                                  color="#0369A1"
                                />
                              </View>
                              <View className="ml-2">
                                <Text className="text-xs font-medium font-sans text-gray-500">
                                  ช่วงวันเดินทาง
                                </Text>
                                <Text className="text-sm font-semibold font-sans text-gray-900">
                                  {tripDateText}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>

                        <Pressable
                          onPress={() =>
                            router.push(
                              `/trip/${item.finalizedPlanId?._id}?viewOnly=true`
                            )
                          }
                          className="mt-4 flex-row items-center self-end"
                        >
                          <Text className="text-sm font-semibold font-sans text-sky-700">
                            รายละเอียดทริป
                          </Text>
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color="#0369A1"
                            style={{ marginLeft: 2 }}
                          />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
