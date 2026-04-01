import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import Constants from "expo-constants";

import OverviewTab from "@/components/plan/OverviewTab";
import ItineraryTab from "@/components/plan/ItineraryTab";
import BudgetTab from "@/components/plan/BudgetTab";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");

const HEADER_H = 290;
const COLLAPSED_TOP = HEADER_H - 54;
const EXPANDED_TOP = 100;

const TABS = ["ภาพรวม", "แผนเที่ยว", "งบประมาณ"] as const;

const formatTHB = (value: number) => {
  return `฿${Number(value || 0).toLocaleString("th-TH")}`;
};

export default function TripViewPlan() {
  const [plan, setPlan] = useState<any>(null);
  const { id, viewOnly } = useLocalSearchParams<{
    id: string;
    viewOnly?: string;
  }>();
  const router = useRouter();
  const API_URL = Constants.expoConfig?.extra?.API_URL;
  const isViewOnly = viewOnly === "true";

  const [activeTab, setActiveTab] = useState(0);

  const topAnim = useRef(new Animated.Value(COLLAPSED_TOP)).current;
  const lastTop = useRef(COLLAPSED_TOP);
  const tabAnim = useRef(new Animated.Value(0)).current;

  const tabOuterWidth = SCREEN_W - 32;
  const tabWidth = (tabOuterWidth - 8) / 3;

  useEffect(() => {
    if (id) {
      axios
        .get(`${API_URL}/api/plan/${id}`)
        .then((res) => {
          setPlan(res.data);
        })
        .catch(() => {
          setPlan(null);
        });
    }
  }, [id, API_URL]);

  useEffect(() => {
    Animated.spring(tabAnim, {
      toValue: activeTab,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
      mass: 0.8,
    }).start();
  }, [activeTab, tabAnim]);

  const snapTo = (to: number) => {
    Animated.spring(topAnim, {
      toValue: to,
      useNativeDriver: false,
      damping: 22,
      stiffness: 220,
      mass: 0.9,
    }).start(() => {
      lastTop.current = to;
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
        onPanResponderMove: (_, g) => {
          const next = Math.min(
            COLLAPSED_TOP,
            Math.max(EXPANDED_TOP, lastTop.current + g.dy)
          );
          topAnim.setValue(next);
        },
        onPanResponderRelease: (_, g) => {
          const mid = (EXPANDED_TOP + COLLAPSED_TOP) / 2;

          if (g.vy < -0.4) return snapTo(EXPANDED_TOP);
          if (g.vy > 0.4) return snapTo(COLLAPSED_TOP);

          snapTo(lastTop.current < mid ? EXPANDED_TOP : COLLAPSED_TOP);
        },
      }),
    [topAnim]
  );

  if (plan === null && id) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-sky-50/80">
          <ActivityIndicator size="large" color="#0369A1" />
        </View>
        <Text className="mt-3 text-sm font-sans text-gray-500">
          กำลังโหลดแผนการเดินทาง
        </Text>
      </View>
    );
  }

  if (!plan) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-gray-100/90">
          <Ionicons name="document-text-outline" size={28} color="#9CA3AF" />
        </View>
        <Text className="mt-4 text-lg font-semibold text-gray-900">
          ไม่พบข้อมูลแผนการเดินทาง
        </Text>
        <Text className="mt-2 text-center text-sm font-sans leading-5 text-gray-500">
          แผนนี้อาจถูกลบ หรือไม่สามารถเข้าถึงได้ในขณะนี้
        </Text>
      </View>
    );
  }

  const indicatorTranslateX = tabAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, tabWidth, tabWidth * 2],
  });

  const previewImage =
    plan.previewImage || "https://via.placeholder.com/1200x800?text=Trip+Plan";

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View className="relative w-full bg-black" style={{ height: HEADER_H }}>
        <Image
          source={{ uri: previewImage }}
          className="h-full w-full"
          resizeMode="cover"
        />

        <LinearGradient
          colors={[
            "rgba(0,0,0,0.72)",
            "rgba(0,0,0,0.20)",
            "rgba(0,0,0,0.82)",
          ]}
          locations={[0, 0.48, 1]}
          className="absolute inset-0"
          pointerEvents="none"
        />

        {/* Top actions */}
        <View className="absolute top-12 left-4 right-4 flex-row items-center justify-between">
          <Pressable
            onPress={() => router.replace("/(home)/mytrip")}
            className="h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/15"
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>

          {!isViewOnly ? (
            <Pressable
              onPress={() => router.push(`/trip/${id}/edit`)}
              className="flex-row items-center rounded-full border border-white/20 bg-white/15 px-4 py-2.5"
            >
              <Ionicons name="create-outline" size={18} color="#fff" />
              <Text className="ml-2 text-base font-semibold text-white">
                แก้ไขแผน
              </Text>
            </Pressable>
          ) : (
            <View className="rounded-full border border-white/15 bg-white/10 px-4 py-2.5">
              <Text className="text-sm font-sans text-white/90">
                โหมดดูอย่างเดียว
              </Text>
            </View>
          )}
        </View>

        {/* Header info */}
        <View className="absolute bottom-14 left-5 right-5">
          <View className="overflow-hidden rounded-[28px] border border-white/15 bg-white/10 px-4 py-4">
            <LinearGradient
              colors={["rgba(255,255,255,0.10)", "rgba(255,255,255,0.03)"]}
              className="absolute inset-0"
              pointerEvents="none"
            />

            <Text className="text-sm font-sans text-white/80">แผนการเดินทาง</Text>

            <Text
              numberOfLines={2}
              className="mt-1 text-2xl font-semibold text-white"
            >
              {plan.trip_title || "แผนการเดินทาง"}
            </Text>

            <View className="flex-row flex-wrap items-center">
              <View className="mb-2 mr-2 flex-row items-center rounded-full border border-white/10 bg-white/12 px-3 py-1.5">
                <Ionicons name="cash-outline" size={16} color="#fff" />
                <Text className="ml-1 text-base font-medium text-white">
                  {formatTHB(plan.total_budget || 0)}
                </Text>
              </View>

              <View className="mb-2 mr-2 flex-row items-center rounded-full border border-white/10 bg-white/12 px-3 py-1.5">
                <Ionicons name="location-outline" size={16} color="#fff" />
                <Text className="ml-1 text-base font-medium text-white">
                  {plan.total_places || 0} สถานที่
                </Text>
              </View>

              {!!plan.recommended_hotels?.[0]?.stars && (
                <View className="mb-2 flex-row items-center rounded-full border border-white/10 bg-white/12 px-3 py-1.5">
                  <Ionicons name="bed-outline" size={16} color="#fff" />
                  <Text className="ml-1 text-base font-medium text-white">
                    ระดับ {plan.recommended_hotels[0].stars} ดาว
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Bottom sheet */}
      <Animated.View
        className="absolute left-0 right-0 overflow-hidden rounded-t-[30px] bg-white shadow-xl"
        style={{
          top: topAnim,
          height: SCREEN_H - EXPANDED_TOP + 40,
        }}
      >
        {/* Handle */}
        <View
          {...panResponder.panHandlers}
          className="items-center pt-3 pb-2"
        >
          <View className="h-1.5 w-12 rounded-full bg-gray-300/90" />
        </View>

        {/* Tabs */}
        <View className="px-4 pb-3">
          <View className="relative overflow-hidden rounded-full border border-gray-100 bg-gray-100/90 p-1">
            <Animated.View
              style={{
                width: tabWidth,
                transform: [{ translateX: indicatorTranslateX }],
              }}
              className="absolute left-1 top-1 bottom-1 rounded-full border border-sky-100 bg-white/95 shadow"
            />

            <View className="flex-row">
              {TABS.map((label, idx) => {
                const active = idx === activeTab;

                return (
                  <Pressable
                    key={label}
                    onPress={() => setActiveTab(idx)}
                    className="z-10 flex-1 items-center py-2.5"
                  >
                    <Text
                      className={`text-base ${
                        active
                          ? "font-semibold text-sky-700"
                          : "font-medium text-gray-500"
                      }`}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1 bg-white"
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 0 && <OverviewTab plan={plan} />}
          {activeTab === 1 && <ItineraryTab plan={plan} />}
          {activeTab === 2 && <BudgetTab plan={plan} />}
        </ScrollView>
      </Animated.View>
    </View>
  );
}