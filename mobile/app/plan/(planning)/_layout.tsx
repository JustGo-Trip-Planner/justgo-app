import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View } from "react-native";
import PlanLayoutHeader from "@/components/plan/SearchHeader";
import { Slot, usePathname } from "expo-router";

export default function PlanLayout() {
  const pathname = usePathname();
  const hideHeader = pathname.includes("/plan/summary");

  return (
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {!hideHeader && <PlanLayoutHeader />}
        <View className="flex-1 bg-white">
          <Slot />
        </View>
      </SafeAreaView>
  );
}
