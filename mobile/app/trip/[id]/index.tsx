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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import OverviewTab from "@/components/plan/OverviewTab";
import ItineraryTab from "@/components/plan/ItineraryTab";
import BudgetTab from "@/components/plan/BudgetTab";
import axios from "axios";
import Constants from "expo-constants";

const { height: SCREEN_H } = Dimensions.get("window");

const HEADER_H = 270;
const COLLAPSED_TOP = HEADER_H - 46;
const EXPANDED_TOP = 100;

const TABS = ["ภาพรวม", "แผนเที่ยว", "งบประมาณ"] as const;

export default function TripViewPlan() {
  const [plan, setPlan] = useState<any>(null);
  const { id, viewOnly } = useLocalSearchParams<{ id: string; viewOnly?: string }>();
  const router = useRouter();
  const API_URL = Constants.expoConfig?.extra?.API_URL;
  const isViewOnly = viewOnly === "true";

  const [activeTab, setActiveTab] = useState(0);
  const buttonVisible = useRef(new Animated.Value(0)).current;
  const topAnim = useRef(new Animated.Value(COLLAPSED_TOP)).current;
  const lastTop = useRef(COLLAPSED_TOP);

  useEffect(() => {
    if (id) {
      axios.get(`${API_URL}/api/plan/${id}`).then((res) => {
        setPlan(res.data);
      });
    }
  }, [id]);

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

  const handleScroll = (e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const isBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;

    Animated.timing(buttonVisible, {
      toValue: isBottom ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
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
    []
  );

  if (!plan) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">ไม่พบข้อมูลแผนการเดินทาง</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" />

      {/* ================= Header Image ================= */}
      <View className="relative w-full bg-black" style={{ height: HEADER_H }}>
        <Image
          source={{ uri: plan.previewImage }}
          className="w-full h-full"
          resizeMode="cover"
        />

        {/* Gradient Shadow */}
        <LinearGradient
          colors={[
            "rgba(0,0,0,0.6)",
            "rgba(0,0,0,0.15)",
            "rgba(0,0,0,0.65)",
          ]}
          locations={[0, 0.55, 1]}
          className="absolute inset-0"
          pointerEvents="none"
        />

        {/* Top Bar */}
        <View className="absolute top-12 left-4 right-4 flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            className="w-11 h-11 rounded-full bg-white/25 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>

          {!isViewOnly && (
            <Pressable
              onPress={() => router.push(`/trip/${id}/edit`)}
              className="px-5 py-4 rounded-2xl bg-white/25 shadow-lg flex-row items-center"
            >
              <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
              <Text className="text-white font-semibold ml-2">แก้ไขแผน</Text>
            </Pressable>
          )}
        </View>

      </View>

      {/* ================= Draggable Sheet ================= */}
      <Animated.View
        className="absolute left-0 right-0 bg-white rounded-t-3xl shadow-xl overflow-hidden"
        style={{
          top: topAnim,
          height: SCREEN_H - EXPANDED_TOP + 40,
        }}
      >
        {/* Drag Handle */}
        <View
          {...panResponder.panHandlers}
          className="items-center pt-3 pb-2"
        >
          <View className="w-12 h-1.5 rounded-full bg-gray-300" />
        </View>

        {/* Title */}
        <Text
          numberOfLines={1}
          className="text-center text-lg font-semibold mb-1"
        >
          {plan.trip_title}
        </Text>

        {isViewOnly && (
          <Text className="text-center font-sans text-gray-500 mb-2">
            โหมดดูแผน (ไม่สามารถแก้ไขได้)
          </Text>
        )}

        {/* Tabs */}
        <View className="flex-row justify-around border-b border-gray-200 px-4">
          {TABS.map((label, idx) => {
            const active = idx === activeTab;
            return (
              <Pressable
                key={label}
                onPress={() => setActiveTab(idx)}
                className="items-center py-3 px-3"
              >
                <Text
                  className={`font-medium ${
                    active ? "text-blue-600" : "text-gray-500"
                  }`}
                >
                  {label}
                </Text>

                <View
                  className={`mt-2 h-1 w-24 rounded-full ${
                    active ? "bg-blue-600 w-10" : "bg-transparent w-10"
                  }`}
                />
              </Pressable>
            );
          })}
        </View>

        {/* Content */}
        <ScrollView
          className="bg-white"
          contentContainerStyle={{ paddingBottom: 160 }}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {activeTab === 0 && <OverviewTab plan={plan} />}
          {activeTab === 1 && <ItineraryTab plan={plan} />}
          {activeTab === 2 && <BudgetTab plan={plan} />}
        </ScrollView>
        
      </Animated.View>
    </View>
  );
}
