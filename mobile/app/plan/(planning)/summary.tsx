import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { usePlan } from "@/context/PlanContext";
import { interestGroups } from "@/constants/interestData";
import { activityGroups } from "@/constants/activityData";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import Constants from "expo-constants";
import dayjs from "dayjs";
import "dayjs/locale/th";

dayjs.locale("th");

export default function SummaryPage() {
  const router = useRouter();
  const { plan, setPlans } = usePlan();

  const [numPlans, setNumPlans] = useState<number>(1);
  const [planName, setPlanName] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (plan.planName) {
      setPlanName(plan.planName);
    } else if (plan.provinceName) {
      setPlanName(`แผน ${plan.provinceName}`);
    }
  }, [plan]);

  useFocusEffect(
    useCallback(() => {
      setLoading(false);
      return () => {};
    }, [])
  );

  const createPlan = async () => {
    if (loading) return;

    try {
      setLoading(true);
      setPlans([]);

      const API_URL = Constants.expoConfig?.extra?.API_URL;

      const res = await axios.post<any>(`${API_URL}/api/plan/generate/start`, {
        province_id: plan.province,
        province_name: plan.provinceName,
        start_date: plan.startDate,
        end_date: plan.endDate,
        group_type: plan.groupType,
        friend_count: plan.friendCount,
        family: plan.family,
        interests: plan.interests,
        activities: plan.activities,
        budget_type: plan.budgetType,
        budget_amount: plan.budgetAmount,
        plan_name: planName,
        num_plans: Math.max(1, Math.min(3, numPlans)),
      });

      const jobId = res?.data?.job_id;
      if (!jobId) {
        throw new Error("ไม่พบ job_id");
      }

      router.push({
        pathname: "/plan/(preview)/loading",
        params: {
          jobId,
          previewImage: plan.image || "",
        },
      });
    } catch (error) {
      console.error("Error generating plans:", error);
      setLoading(false);
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถเริ่มสร้างแผนการเดินทางได้");
    }
  };

  const interestMap = useMemo(() => {
    const map: Record<string, string> = {};
    interestGroups.forEach((g) => {
      g.items.forEach((i) => {
        map[i.id] = i.label;
      });
    });
    return map;
  }, []);

  const activityMap = useMemo(() => {
    const map: Record<string, string> = {};
    activityGroups.forEach((g) => {
      g.items.forEach((i) => {
        map[i.id] = i.label;
      });
    });
    return map;
  }, []);

  const interestLabels = useMemo(() => {
    return (plan.interests || []).map((id: string) => interestMap[id] || id);
  }, [plan.interests, interestMap]);

  const activityLabels = useMemo(() => {
    return (plan.activities || []).map((id: string) => activityMap[id] || id);
  }, [plan.activities, activityMap]);

  const renderGroupDetail = () => {
    if (plan.groupType === "เพื่อน" && plan.friendCount) {
      return `เพื่อน ${plan.friendCount} คน`;
    } else if (plan.groupType === "ครอบครัว" && plan.family) {
      const { adult, kid, elderly } = plan.family;
      const total = adult + kid + elderly;
      return `ครอบครัว ${total} คน \nผู้ใหญ่ ${adult} คน, เด็กเล็ก ${kid} คน, ผู้สูงอายุ ${elderly} คน`;
    } else if (plan.groupType === "คู่รัก") {
      return "คู่รัก 2 คน";
    } else if (plan.groupType === "คนเดียว") {
      return "เดินทางคนเดียว";
    }
    return "-";
  };

  const formatDateRange = () => {
    if (!plan.startDate) return "-";

    const start = dayjs(plan.startDate);
    const end = plan.endDate ? dayjs(plan.endDate) : start;

    const diff = end.diff(start, "day") + 1;
    const nights = diff - 1;

    return `${start.format("D MMMM YYYY")} ถึง ${end.format("D MMMM YYYY")} \n (${diff} วัน ${nights} คืน)`;
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center px-4 pt-6 pb-4 space-x-2">
        <TouchableOpacity onPress={() => router.back()} disabled={loading}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="ml-4 text-xl font-semibold">
          สรุปข้อมูลแผนการเดินทาง
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} className="px-4">
        <View className="px-2">
          <View className="rounded-2xl border border-gray-200 bg-white p-4 space-y-6">
            <View className="mb-2 flex-row items-center">
              <Ionicons name="compass-outline" size={24} />
              <Text className="ml-2 text-lg font-semibold">ชื่อแผนการเดินทาง</Text>
            </View>
            <TextInput
              value={planName}
              onChangeText={setPlanName}
              placeholder="ตั้งชื่อแผนของคุณ"
              editable={!loading}
              className="ml-8 rounded-xl border border-gray-300 p-3 font-sans"
            />
          </View>

          <View className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 space-y-6">
            <View>
              <View className="mb-2 flex-row items-center">
                <Ionicons name="location-outline" size={24} />
                <Text className="ml-2 text-lg font-semibold">จุดหมายปลายทาง</Text>
              </View>
              <View className="flex-row items-center space-x-3">
                <Image
                  source={{ uri: plan.image }}
                  className="ml-8 h-20 w-32 rounded-xl bg-gray-200"
                />
                <Text className="ml-6 font-semibold">
                  จังหวัด {plan.provinceName || "-"}
                </Text>
              </View>
            </View>

            <View className="mt-6">
              <View className="mb-1 flex-row items-center">
                <Ionicons name="people-outline" size={24} />
                <Text className="ml-2 text-lg font-semibold">ผู้ร่วมเดินทาง</Text>
              </View>
              <Text className="ml-9 font-sans">{renderGroupDetail()}</Text>
            </View>

            <View className="mt-6">
              <View className="mb-1 flex-row items-center">
                <Ionicons name="calendar-outline" size={24} />
                <Text className="ml-2 text-lg font-semibold">วันที่เดินทาง</Text>
              </View>
              <Text className="ml-9 font-sans">{formatDateRange()}</Text>
            </View>

            <View className="mt-6">
              <View className="mb-2 flex-row items-center">
                <Ionicons name="star-outline" size={24} />
                <Text className="ml-2 text-lg font-semibold">
                  ความสนใจ {interestLabels.length} อย่าง
                </Text>
              </View>
              <View className="ml-9 flex-row flex-wrap gap-2">
                {interestLabels.map((label, idx) => (
                  <View
                    key={idx}
                    className="rounded-full border border-gray-300 bg-white px-3 py-1"
                  >
                    <Text className="text-sm font-sans">{label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="mt-6">
              <View className="mb-2 flex-row items-center">
                <Ionicons name="bicycle-outline" size={24} />
                <Text className="ml-2 text-lg font-semibold">
                  กิจกรรมที่เลือก {activityLabels.length} อย่าง
                </Text>
              </View>
              <View className="ml-9 flex-row flex-wrap gap-2">
                {activityLabels.map((label, idx) => (
                  <View
                    key={idx}
                    className="rounded-full border border-gray-300 bg-white px-3 py-1"
                  >
                    <Text className="text-sm font-sans">{label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="mt-6">
              <View className="mb-1 flex-row items-center">
                <Ionicons name="cash-outline" size={24} />
                <Text className="ml-2 text-lg font-semibold">งบประมาณการเดินทาง</Text>
              </View>
              <Text className="ml-9 font-sans">
                {plan.budgetType || "-"}
                {plan.budgetAmount && plan.budgetAmount > 0
                  ? ` งบประมาณ ${plan.budgetAmount.toLocaleString()} บาท`
                  : ""}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-8">
          <View className="mb-4 flex-row items-center justify-center space-x-2">
            <Ionicons name="map-outline" size={24} color="#000" />
            <Text className="ml-2 text-lg font-semibold text-black">
              จำนวนแผนที่ต้องการสร้าง
            </Text>
          </View>

          <View className="flex-row items-center justify-center space-x-6">
            <TouchableOpacity
              onPress={() => setNumPlans((prev) => Math.max(1, prev - 1))}
              activeOpacity={0.7}
              disabled={loading}
            >
              <View className="h-10 w-10 items-center justify-center rounded-full border border-gray-300">
                <Ionicons
                  name="remove"
                  size={22}
                  color={numPlans > 1 ? "#111" : "#ccc"}
                />
              </View>
            </TouchableOpacity>

            <View className="min-w-[40px] items-center">
              <Text className="text-lg font-semibold text-black">{numPlans}</Text>
            </View>

            <TouchableOpacity
              onPress={() => setNumPlans((prev) => Math.min(3, prev + 1))}
              activeOpacity={0.7}
              disabled={loading}
            >
              <View className="h-10 w-10 items-center justify-center rounded-full border border-gray-300">
                <Ionicons
                  name="add"
                  size={22}
                  color={numPlans < 3 ? "#2563EB" : "#ccc"}
                />
              </View>
            </TouchableOpacity>
          </View>

          <Text className="mt-3 text-center font-sans text-red-500">
            คุณสามารถสร้างแผนได้สูงสุด 3 แผน
          </Text>
        </View>
      </ScrollView>

      <View className="absolute inset-x-0 bottom-0 border-t border-gray-100 bg-white px-4 py-4">
        <TouchableOpacity
          onPress={createPlan}
          disabled={loading}
          activeOpacity={0.85}
          className={`items-center rounded-xl py-4 ${
            loading ? "bg-orange-300" : "bg-orange-500"
          }`}
        >
          <Text className="font-sans text-lg font-semibold text-white">
            {loading ? "กำลังสร้างแผน..." : "สร้างแผนการเดินทางของฉัน"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
