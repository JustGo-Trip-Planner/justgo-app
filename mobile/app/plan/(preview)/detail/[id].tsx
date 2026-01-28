import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSelectedPlan } from "@/context/PlanContext";
import OverviewTab from "@/components/plan/OverviewTab";
import ItineraryTab from "@/components/plan/ItineraryTab";
import BudgetTab from "@/components/plan/BudgetTab";

export default function PlanDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const plan = useSelectedPlan(id);

  if (!plan) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500 text-base font-sans">ไม่พบข้อมูลแผนการเดินทาง</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 40 }}>
      <Text className="text-2xl font-sans font-bold px-4 pt-4">{plan.trip_title}</Text>

      <OverviewTab plan={plan} />
      <ItineraryTab plan={plan} />
      <BudgetTab plan={plan} />

    </ScrollView>
  );
}
