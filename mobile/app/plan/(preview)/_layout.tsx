import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TouchableOpacity } from "react-native";
import { Slot, useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function PreviewLayout() {
  return (
    <SafeAreaView
      style={{ flex: 1 }}
      edges={["top"]}
    >
        <InnerPlan />
    </SafeAreaView>
  );
}

function InnerPlan() {
  const router = useRouter();
  const { province } = useLocalSearchParams<{ province?: string }>();

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-medium">
            {province ?? "เลือกแผนการเดินทางของคุณ"}
          </Text>
        </View>
        <TouchableOpacity className="p-2">
          <Ionicons name="search-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* หน้าลูก */}
      <Slot />
    </View>
  );
}
