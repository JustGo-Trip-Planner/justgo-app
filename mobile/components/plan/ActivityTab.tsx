import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  Modal,
} from "react-native";
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  plan: any;
  setPlan: any;
  activeDay: number;
  setActiveDay: (n: number) => void;
  onPressAddLocation: () => void;
};

export default function ActivityTab({
  plan,
  setPlan,
  activeDay,
  setActiveDay,
  onPressAddLocation,
}: Props) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState("06:00");

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const activities = plan?.daily_itinerary?.[activeDay]?.activities ?? [];

  const timeOptions = useMemo(() => {
    const slots: string[] = [];
    for (let h = 6; h <= 24; h++) {
      for (let m = 0; m < 60; m += 5) {
        const hour = h === 24 ? 0 : h;
        if (h === 24 && m > 0) continue;
        slots.push(
          `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")}`
        );
      }
    }
    return slots;
  }, []);

  const updateActivities = (newList: any[]) => {
    setPlan((prev: any) => {
      if (!prev?.daily_itinerary) return prev;

      const updatedDaily = prev.daily_itinerary.map((day: any, idx: number) =>
        idx === activeDay ? { ...day, activities: newList } : day
      );

      return { ...prev, daily_itinerary: updatedDaily };
    });
  };

  const openTimePicker = (id: string, current: string) => {
    setEditingId(id);
    setSelectedTime(current || "06:00");
    setPickerVisible(true);
  };

  const applyTime = () => {
    const updated = activities.map((a: any) =>
      a._localId === editingId ? { ...a, time: selectedTime } : a
    );
    updateActivities(updated);
    setPickerVisible(false);
  };

  const removeActivity = (localId: string) => {
    const filtered = activities.filter((a: any) => a._localId !== localId);
    updateActivities(filtered);
  };

  const confirmDelete = (id: string) => {
    setPendingDeleteId(id);
    setConfirmVisible(true);
  };

  const handleDelete = () => {
    if (pendingDeleteId) {
      removeActivity(pendingDeleteId);
    }
    setConfirmVisible(false);
    setPendingDeleteId(null);
  };

  const renderRightActions = (id: string) => (
    <Pressable
      onPress={() => confirmDelete(id)}
      className="mb-3 w-24 items-center justify-center rounded-xl bg-red-500"
    >
      <Ionicons name="trash-outline" size={26} color="white" />
      <Text className="mt-1 text-sm font-sans text-white">ลบ</Text>
    </Pressable>
  );

  return (
    <View className="flex-1">
      <DraggableFlatList
        data={activities}
        keyExtractor={(item) => item._localId}
        onDragEnd={({ data }) => updateActivities(data)}
        nestedScrollEnabled
        contentContainerStyle={{ paddingBottom: 80 }}
        ListHeaderComponent={
          <View className="my-4 items-center">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ alignItems: "center" }}
            >
              {(plan.daily_itinerary || []).map((_: any, idx: number) => (
                <Pressable
                  key={idx}
                  onPress={() => setActiveDay(idx)}
                  className={`mx-2 h-10 justify-center rounded-full border px-5 ${
                    activeDay === idx
                      ? "border-sky-700 bg-sky-700"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  <Text
                    className={`text-base ${
                      activeDay === idx
                        ? "font-semibold text-white"
                        : "font-medium text-gray-700"
                    }`}
                  >
                    วันที่ {idx + 1}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        }
        renderItem={({ item, drag }) => (
          <ScaleDecorator>
            <ReanimatedSwipeable
              friction={2}
              rightThreshold={40}
              renderRightActions={() => renderRightActions(item._localId)}
            >
              <Pressable className="mb-3 flex-row items-center rounded-xl border border-gray-200 bg-white p-3">
                <Image
                  source={{
                    uri: item.image || "https://via.placeholder.com/150",
                  }}
                  className="mr-3 h-20 w-20 rounded-md"
                />

                <View className="flex-1 justify-center">
                  <Text className="text-lg font-semibold text-gray-900">
                    {item.place_name}
                  </Text>

                  <View className="mt-2 flex-row items-center">
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color="#6b7280"
                    />

                    <Pressable
                      onPress={() => openTimePicker(item._localId, item.time)}
                      className="ml-2 rounded-full bg-gray-100 px-3 py-1"
                    >
                      <Text className="text-base font-medium text-gray-700">
                        {item.time || "06:00"}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  onPressIn={drag}
                  className="justify-center py-2 pl-3 pr-1"
                >
                  <Ionicons
                    name="reorder-three-outline"
                    size={24}
                    color="#9ca3af"
                  />
                </Pressable>
              </Pressable>
            </ReanimatedSwipeable>
          </ScaleDecorator>
        )}
        ListEmptyComponent={
          <View className="items-center py-6">
            <Text className="text-sm font-sans text-gray-400">
              ยังไม่มีสถานที่
            </Text>
          </View>
        }
        ListFooterComponent={
          <Pressable
            onPress={onPressAddLocation}
            className="mt-4 mb-2 flex-row items-center justify-center rounded-full bg-green-600 py-3"
          >
            <Ionicons name="add-circle-outline" size={24} color="white" />
            <Text className="ml-3 text-lg font-semibold text-white">
              เพิ่มสถานที่ใหม่
            </Text>
          </Pressable>
        }
      />

      <Modal visible={pickerVisible} transparent animationType="fade">
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[70%] rounded-t-3xl bg-white px-5 pt-4 pb-8">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-gray-900">
                {selectedTime}
              </Text>
              <Pressable onPress={() => setPickerVisible(false)}>
                <Ionicons name="close" size={22} color="#6b7280" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {timeOptions.map((t) => {
                const active = t === selectedTime;
                return (
                  <Pressable
                    key={t}
                    onPress={() => setSelectedTime(t)}
                    className={`mb-1 rounded-xl px-3 py-3 ${
                      active ? "bg-gray-200" : ""
                    }`}
                  >
                    <Text
                      className={`text-base ${
                        active
                          ? "font-semibold text-black"
                          : "font-medium text-gray-600"
                      }`}
                    >
                      {t}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              onPress={applyTime}
              className="mt-4 rounded-xl bg-sky-700 py-3"
            >
              <Text className="text-center text-lg font-semibold text-white">
                ยืนยัน
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={confirmVisible} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/40">
          <View className="w-80 rounded-2xl bg-white p-6 shadow-lg">
            <Text className="mb-6 text-center text-lg font-semibold text-gray-900">
              ลบสถานที่นี้?
            </Text>

            <View className="flex-row justify-between">
              <Pressable
                onPress={() => setConfirmVisible(false)}
                className="mr-2 flex-1 items-center rounded-xl bg-gray-200 py-3"
              >
                <Text className="text-base font-medium text-gray-700">
                  ยกเลิก
                </Text>
              </Pressable>

              <Pressable
                onPress={handleDelete}
                className="ml-2 flex-1 items-center rounded-xl bg-red-500 py-3"
              >
                <Text className="text-base font-medium text-white">
                  ลบ
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
