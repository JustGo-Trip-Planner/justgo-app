import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { usePlan } from "@/context/PlanContext";
import PlanCard from "@/components/plan/PlanCard";

export default function ResultPage() {
  const router = useRouter();
  const { plans } = usePlan();

  if (!plans || plans.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg font-sans text-gray-500">
          ไม่พบแผนการเดินทาง
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="bg-white px-4 pt-6 pb-10">
      {plans.map((planItem, index) => (
        <PlanCard
          key={index}
          plan={planItem}
          index={index}
          onPress={() => router.push(`/plan/(preview)/detail/${index}`)}
        />
      ))}
    </ScrollView>
  );
}
