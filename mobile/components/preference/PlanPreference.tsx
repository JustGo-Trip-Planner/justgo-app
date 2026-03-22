import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";

type Item = {
  id: string;
  label: string;
};

type Group = {
  id: string;
  title: string;
  items: Item[];
};

type Props = {
  step: string;
  title: string;
  subtitle?: string;
  groups: Group[];
  profileKey: "interests" | "activities";
  onNext: (selected: string[]) => void;
};

export default function PlanPreference({
  step,
  title,
  subtitle,
  groups,
  profileKey,
  onNext,
}: Props) {
  const { user } = useAuth();

  const [useProfile, setUseProfile] = useState(false);
  const [manualAdd, setManualAdd] = useState<string[]>([]);
  const [manualRemove, setManualRemove] = useState<string[]>([]);
  const profileData = (user?.[profileKey] || []) as string[];

  const selected = useMemo(() => {
    if (!useProfile) return manualAdd;

    return [
      ...new Set(
        [
          ...profileData,
          ...manualAdd,
        ].filter((id) => !manualRemove.includes(id))
      ),
    ];
  }, [useProfile, profileData, manualAdd, manualRemove]);

  const toggle = (itemId: string) => {
    const isInProfile = profileData.includes(itemId);
    const isActive = selected.includes(itemId);

    // ===== CASE 1: used profile =====
    if (useProfile) {
      if (isInProfile) {
        setManualRemove((prev) =>
          prev.includes(itemId)
            ? prev.filter((i) => i !== itemId)
            : [...prev, itemId]
        );
      } else {
        setManualAdd((prev) =>
          prev.includes(itemId)
            ? prev.filter((i) => i !== itemId)
            : [...prev, itemId]
        );
      }
      return;
    }

    // ===== CASE 2: not used profile =====
    setManualAdd((prev) =>
      prev.includes(itemId)
        ? prev.filter((i) => i !== itemId)
        : [...prev, itemId]
    );
  };

  const isSelected = (id: string) => selected.includes(id);
  const totalSelected = selected.length;

  const handleNext = () => {
    onNext([...new Set(selected)]);
  };

  const disableProfileToggle = profileData.length === 0;

  return (
    <View className="flex-1 bg-white">

      {/* HEADER */}
      <View className="px-5 pt-6">
        <Text className="text-gray-500 text-base font-medium font-sans">
          {step}
        </Text>

        <Text className="text-2xl font-semibold font-sans text-[#3262AB] mb-2">
          {title}
        </Text>

        {subtitle && (
          <Text className="text-gray-500 mb-4 font-sans">
            {subtitle}
          </Text>
        )}
      </View>

      {/* TOGGLE */}
      <View className="px-5 mb-4">
        <View className="flex-row items-center justify-between px-4 py-3 rounded-2xl bg-white/70 border border-gray-200">

          <View className="flex-row items-center flex-1">
            <View className="w-9 h-9 rounded-full bg-orange-100 items-center justify-center mr-3">
              <Ionicons name="sparkles-outline" size={18} color="#f97316" />
            </View>

            <View className="flex-1">
              <Text className="text-gray-900 font-semibold font-sans">
                ใช้ความชอบจากโปรไฟล์
              </Text>
              <Text className="text-gray-400 text-sm font-sans">
                แนะนำอัตโนมัติจากข้อมูลของคุณ
              </Text>
            </View>
          </View>

          <Switch
            value={useProfile}
            onValueChange={setUseProfile}
            disabled={disableProfileToggle}
          />
        </View>
      </View>

      {/* SUMMARY */}
      <View className="px-5 mb-2">
        <Text className="text-orange-500 font-semibold font-sans">
          เลือกแล้ว {totalSelected} รายการ
        </Text>
      </View>

      {/* LIST */}
      <ScrollView className="flex-1 px-5">
        {groups.map((group) => (
          <View key={group.id} className="mb-5">
            <Text className="font-semibold text-lg mb-3 font-sans">
              {group.title}
            </Text>

            <View className="flex-row flex-wrap gap-2">
              {group.items.map((item) => {
                const active = isSelected(item.id);
                const isProfile = profileData.includes(item.id);

                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => toggle(item.id)}
                    className={`px-4 py-2 rounded-full border ${
                      active
                        ? "bg-[#3262AB] border-[#3262AB]"
                        : "border-gray-300"
                    }`}
                  >
                    <View className="flex-row items-center">

                      {/* PROFILE BADGE */}
                      {useProfile && isProfile && (
                        <Ionicons name="person" size={12} color={active ? "white" : "#3262AB"} style={{ marginRight: 4 }} />
                      )}
                      <Text
                        className={`font-sans ${
                          active ? "text-white" : "text-gray-700"
                        }`}
                      >
                        {item.label}
                      </Text>

                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* FOOTER */}
      <View className="px-5 pb-6 pt-3">
        <TouchableOpacity
          onPress={handleNext}
          disabled={totalSelected === 0}
          className={`py-4 rounded-xl ${
            totalSelected === 0
              ? "bg-gray-300"
              : "bg-orange-500"
          }`}
        >
          <Text className="text-white text-center font-semibold font-sans">
            ถัดไป
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}