import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator
} from "react-native";

import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import Constants from "expo-constants";
import Ionicons from "@expo/vector-icons/Ionicons";

type HistoryItem = {
  _id: string
  archivedAt: string
  archiveReason: "archived_by_owner" | "completed"
  finalizedPlanId: {
    _id: string
    trip_title: string
    previewImage?: string
    total_budget: number
  }
}

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
  }, [gid]);


  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 px-6 pt-12">

      {/* HEADER */}
      <View className="flex-row items-center mb-8">
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} />
        </Pressable>

        <Text className="text-lg font-semibold font-sans ml-3">
          ประวัติการเดินทาง
        </Text>
      </View>

      {history.map((item, index) => {
        const img = item.finalizedPlanId?.previewImage
          ? { uri: item.finalizedPlanId.previewImage }
          : require("@/assets/images/default.png");

        const statusText =
          item.archiveReason === "archived_by_owner"
            ? "เจ้าของกลุ่มจัดเก็บแผน"
            : "ทริปสำเร็จแล้ว";
        return (
          <View key={item._id} className="flex-row mb-10">

            {/* timeline */}
            <View className="items-center mr-4">
              <View className="w-4 h-4 rounded-full bg-sky-700" />
              {index !== history.length - 1 && (
                <View className="w-1 h-full bg-gray-300 mt-1" />
              )}
            </View>


            {/* card */}
            <View className="flex-1 bg-white rounded-3xl shadow p-4">
              <Image
                source={img}
                className="w-full h-36 rounded-xl mb-3"
              />

              <Text className="font-semibold font-sans text-base">
                {item.finalizedPlanId?.trip_title}
              </Text>

              <Text className="text-xs text-gray-500 font-medium font-sans mt-1">
                {new Date(item.archivedAt).toLocaleDateString("th-TH")}
              </Text>

              <Text className="text-xs text-orange-600 font-medium font-sans mt-1">
                {statusText}
              </Text>

              <Text className="text-sm text-gray-600 font-medium font-sans mt-1">
                งบประมาณ ฿
                {item.finalizedPlanId?.total_budget?.toLocaleString()}
              </Text>


              <Pressable
                onPress={() =>
                  router.push(`/trip/${item.finalizedPlanId?._id}?viewOnly=true`)
                }
                className="mt-3"
              >

                <Text className="text-sky-700 font-medium">
                  ดูรายละเอียดทริป
                </Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}