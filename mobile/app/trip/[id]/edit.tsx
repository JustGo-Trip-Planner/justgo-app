import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import ActivityTab from "@/components/plan/ActivityTab";
import HotelTab, { Hotel } from "@/components/plan/HotelTab";

const FALLBACK_LAT = "13.736717";
const FALLBACK_LNG = "100.523186";

export default function EditTripScreen() {
  const router = useRouter();
  const { id, added, addedHotel } = useLocalSearchParams<any>();
  const API_URL = Constants.expoConfig?.extra?.API_URL;

  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<"activity" | "hotel">("activity");
  const [activeDay, setActiveDay] = useState(0);

  const hasFetched = useRef(false);

  /* ================= FETCH PLAN ================= */
  useEffect(() => {
    if (!id || hasFetched.current) return;
    hasFetched.current = true;

    const fetchPlan = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/plan/${id}`);

        const safe = {
          ...res.data,
          daily_itinerary: (res.data.daily_itinerary || []).map((day: any, dayIdx: number) => ({
            ...day,
            activities: (day.activities || []).map((a: any, idx: number) => ({
              ...a,
              _localId: `${a.place_id || a.place_name}-${dayIdx}-${idx}-${Date.now()}`,
            })),
          })),
          recommended_hotels: (res.data.recommended_hotels || []).map((h: any, idx: number) => ({
            ...h,
            _localId: `hotel-${idx}-${Date.now()}`,
          })),
        };

        setPlan(safe);
      } catch (e) {
        Alert.alert("โหลดแผนไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [id, API_URL]);

  /* ================= HANDLE ADDED ACTIVITY (from addLocation) ================= */
  useEffect(() => {
    if (!added || !plan) return;

    try {
      const decoded = decodeURIComponent(added as string);
      const parsed = JSON.parse(decoded);
      const dayIndex = Number(parsed.dayIndex ?? 0);
      if (Number.isNaN(dayIndex)) return;

      setActiveTab("activity");
      setActiveDay(dayIndex);

      setPlan((prev: any) => {
        if (!prev) return prev;

        const nextDaily = [...(prev.daily_itinerary || [])];
        const day = nextDaily[dayIndex] ?? { date: prev.start_date, activities: [] };

        const exists = (day.activities || []).some((a: any) => a.place_id === parsed.place_id);
        if (exists) return prev;

        const newActivity = {
          ...parsed,
          _localId: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        };

        const merged = [...(day.activities || []), newActivity].sort((a: any, b: any) =>
          String(a.time || "00:00").localeCompare(String(b.time || "00:00"))
        );

        nextDaily[dayIndex] = { ...day, activities: merged };
        return { ...prev, daily_itinerary: nextDaily };
      });

      router.setParams({ added: undefined } as any);
    } catch (e) {
      console.log("added parse error", e);
    }
  }, [added, plan, router]);

  /* ================= HANDLE ADDED HOTEL (from addHotel) ================= */
  useEffect(() => {
    if (!addedHotel || !plan) return;

    try {
      const decoded = decodeURIComponent(addedHotel as string);
      const parsed = JSON.parse(decoded) as Hotel;

      setActiveTab("hotel");

      setPlan((prev: any) => {
        if (!prev) return prev;
        const newHotel = {
          ...parsed,
          _localId: parsed._localId || `hotel-${Date.now()}`,
          // บังคับให้มี fields สำคัญ
          price_per_night: Number(parsed.price_per_night ?? 0),
        };

        // ถ้าต้องการ “มีได้แค่ 1 โรงแรม” ให้ replace
        return { ...prev, recommended_hotels: [newHotel] };
        // ถ้าต้องการหลายโรงแรม ให้ใช้บรรทัดนี้แทน:
        // return { ...prev, recommended_hotels: [...(prev.recommended_hotels || []), newHotel] };
      });

      router.setParams({ addedHotel: undefined } as any);
    } catch (e) {
      console.log("addedHotel parse error", e);
    }
  }, [addedHotel, plan, router]);

  /* ================= HELPERS ================= */
  const hotels: Hotel[] = plan?.recommended_hotels ?? [];

  const removeHotel = (localId: string) => {
    setPlan((prev: any) => {
      const next = (prev?.recommended_hotels || []).filter((h: any) => h._localId !== localId);
      return { ...prev, recommended_hotels: next };
    });
  };

  const getCenterLatLng = () => {
    // 1) ถ้ามีโรงแรม -> ใช้พิกัดโรงแรม
    const h0 = plan?.recommended_hotels?.[0];
    if (h0?.lat && h0?.lng) return { lat: String(h0.lat), lng: String(h0.lng) };

    // 2) ถ้ามีกิจกรรมวันแรก -> ใช้พิกัดกิจกรรมแรก
    const a0 = plan?.daily_itinerary?.[0]?.activities?.[0];
    if (a0?.lat && a0?.lng) return { lat: String(a0.lat), lng: String(a0.lng) };

    // 3) fallback
    return { lat: FALLBACK_LAT, lng: FALLBACK_LNG };
  };

  const onPressAddLocation = () => {
    const { lat, lng } = getCenterLatLng();
    router.push({
      pathname: `/trip/${plan._id}/addLocation`,
      params: {
        dayIndex: String(activeDay),
        province: plan.provinceName,
        provinceLat: lat,
        provinceLng: lng,
      },
    });
  };

  const onPressAddHotel = () => {
    const { lat, lng } = getCenterLatLng();
    router.push({
      pathname: `/trip/${plan._id}/addHotel`,
      params: {
        province: plan.provinceName,
        provinceLat: lat,
        provinceLng: lng,
      },
    });
  };

  /* ================= SAVE ================= */
  const savePlan = async () => {
    try {
      setSaving(true);

      const cleaned = {
        ...plan,
        daily_itinerary: (plan.daily_itinerary || []).map((d: any) => ({
          ...d,
          activities: (d.activities || []).map(({ _localId, ...rest }: any) => rest),
        })),
        recommended_hotels: (plan.recommended_hotels || []).map(({ _localId, ...rest }: any) => rest),
      };

      await axios.put(`${API_URL}/api/plan/${id}`, cleaned);
      Alert.alert("บันทึกสำเร็จ");
      router.replace(`/trip/${id}`);
    } catch (e) {
      Alert.alert("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !plan) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <GestureHandlerRootView className="flex-1 bg-white">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View className="relative h-[250px]">
        <Image source={{ uri: plan.previewImage }} className="absolute inset-0 w-full h-full" />
        <View className="absolute inset-0 bg-black/30" />
        <View className="absolute top-12 left-4 right-4 flex-row justify-between items-center">
          <Pressable onPress={() => router.back()} className="bg-white/30 p-2 rounded-full">
            <Ionicons name="chevron-back" size={24} color="white" />
          </Pressable>
          <Text className="text-white font-semibold text-lg">แก้ไขแผน</Text>
          <View className="w-6" />
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 -mt-8 bg-white rounded-t-3xl px-4 pt-6 pb-24">
        {/* Segmented tab */}
        <View className="mb-4">
          <View className="flex-row bg-gray-100 rounded-full p-1 relative">

            {/* Sliding Background */}
            <View
              className={`absolute top-1 bottom-1 w-1/2 bg-white rounded-full shadow ${
                activeTab === "activity" ? "left-1" : "right-1"
              }`}
            />

            <Pressable
              onPress={() => setActiveTab("activity")}
              className="flex-1 py-2 items-center z-10"
            >
              <Text
                className={`font-semibold ${
                  activeTab === "activity" ? "text-blue-600" : "text-gray-500"
                }`}
              >
                แผนกิจกรรม
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab("hotel")}
              className="flex-1 py-2 items-center z-10"
            >
              <Text
                className={`font-semibold ${
                  activeTab === "hotel" ? "text-blue-600" : "text-gray-500"
                }`}
              >
                ที่พัก
              </Text>
            </Pressable>
          </View>
        </View>

        {activeTab === "activity" ? (
          <ActivityTab
            plan={plan}
            setPlan={setPlan}
            activeDay={activeDay}
            setActiveDay={setActiveDay}
            onPressAddLocation={onPressAddLocation}
          />
        ) : (
          <HotelTab
            hotels={hotels}
            onRemove={removeHotel}
            onAdd={onPressAddHotel}
          />
        )}
      </View>

      {/* Save button */}
      <View className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-white border-t border-gray-200">
        <Pressable
          onPress={savePlan}
          disabled={saving}
          className={`py-4 rounded-full items-center ${saving ? "bg-gray-400" : "bg-orange-500"}`}
        >
          <Text className="text-white font-semibold">{saving ? "กำลังบันทึก..." : "บันทึก"}</Text>
        </Pressable>
      </View>
    </GestureHandlerRootView>
  );
}
