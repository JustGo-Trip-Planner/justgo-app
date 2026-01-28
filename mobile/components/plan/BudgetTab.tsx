import { View, Text, TouchableOpacity } from "react-native";
import { useState } from "react";

export default function BudgetTab({ plan }: { plan: any }) {
  const [activeDay, setActiveDay] = useState(0);

  const formatTHB = (amount: number) => `฿${amount.toLocaleString()}`;

  const categories = [
    { key: "transportation", label: "การเดินทาง", icon: "📍" },
    { key: "accommodation", label: "โรงแรมที่พัก", icon: "🏨" },
    { key: "food", label: "อาหารและเครื่องดื่ม", icon: "🍽️" },
    { key: "others", label: "อื่นๆ", icon: "➕" },
  ];

  return (
    <View className="space-y-4 px-4 pb-6">
      {/* หัวข้อ */}
      <Text className="text-lg font-semibold font-sans">ภาพรวมการใช้งบประมาณทั้งทริป</Text>
      <Text className="text-3xl text-black font-semibold font-sans">
        {formatTHB(plan.total_expense_breakdown.total)}
      </Text>

      {/* หมวดหมู่ + แถบ bar */}
      {categories.map((cat) => (
        <View key={cat.key} className="space-y-1">
          <View className="flex-row justify-between items-center">
            <Text className="text-base font-medium font-sans">
              {cat.icon} {cat.label}
            </Text>
            <Text className="font-semibold font-sans">
              {formatTHB(plan.total_expense_breakdown[cat.key])}
            </Text>
          </View>
          <View className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <View
              className="bg-orange-500 h-3 rounded-full"
              style={{
                width: `${
                  (plan.total_expense_breakdown[cat.key] /
                    plan.total_expense_breakdown.total) *
                  100
                }%`,
              }}
            />
          </View>
        </View>
      ))}

      {/* วันที่ */}
      <View className="flex-row space-x-2 mt-6">
        {plan.daily_budget?.map((_: any, idx: number) => (
          <TouchableOpacity
            key={idx}
            onPress={() => setActiveDay(idx)}
            className={`px-4 py-2 rounded-full border ${
              activeDay === idx ? "bg-blue-600" : "bg-white"
            }`}
          >
            <Text
              className={`font-sans font-semibold ${
                activeDay === idx ? "text-white" : "text-black"
              }`}
            >
              วันที่ {idx + 1}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* กล่องสรุปรายวัน */}
      <View className="bg-white rounded-xl p-4 mt-4 space-y-2 shadow">
        <Text className="font-sans font-medium text-base">
          📍 การเดินทาง: {formatTHB(plan.daily_budget[activeDay].transportation)}
        </Text>
        <Text className="font-sans font-medium text-base">
          🏨 โรงแรมที่พัก: {formatTHB(plan.daily_budget[activeDay].accommodation)}
        </Text>
        <Text className="font-sans font-medium text-base">
          🍽️ อาหารและเครื่องดื่ม: {formatTHB(plan.daily_budget[activeDay].food)}
        </Text>
        <Text className="font-sans font-medium text-base">
          ➕ อื่นๆ: {formatTHB(plan.daily_budget[activeDay].others)}
        </Text>
        <View className="border-t border-gray-200 mt-2 pt-2">
          <Text className="font-sans font-semibold text-lg">
            💰 วันที่ {activeDay + 1} รวมทั้งหมด {formatTHB(plan.daily_budget[activeDay].total)}
          </Text>
        </View>
      </View>

      {/* ปุ่มเลือกแผน */}
      <TouchableOpacity className="bg-orange-500 p-4 rounded-xl mt-6">
        <Text className="text-white text-center font-sans font-semibold text-base">
          เลือกแผนการเดินทางนี้
        </Text>
      </TouchableOpacity>
    </View>
  );
}
