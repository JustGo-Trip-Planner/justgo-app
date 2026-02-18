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

  const activities =
    plan?.daily_itinerary?.[activeDay]?.activities ?? [];

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

      const updatedDaily = prev.daily_itinerary.map(
        (day: any, idx: number) =>
          idx === activeDay
            ? { ...day, activities: newList }
            : day
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
      a._localId === editingId
        ? { ...a, time: selectedTime }
        : a
    );
    updateActivities(updated);
    setPickerVisible(false);
  };

  const removeActivity = (localId: string) => {
    const filtered = activities.filter(
      (a: any) => a._localId !== localId
    );
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
      className="justify-center items-center bg-red-500 w-24 rounded-xl mb-3"
    >
      <Ionicons name="trash-outline" size={26} color="white" />
      <Text className="text-white text-xs mt-1">ลบ</Text>
    </Pressable>
  );

  return (
    <View className="flex-1">

      <DraggableFlatList
        data={activities}
        keyExtractor={(item) => item._localId}
        onDragEnd={({ data }) => updateActivities(data)}
        nestedScrollEnabled
        contentContainerStyle={{ paddingBottom: 120 }}

        ListHeaderComponent={
          <View className="items-center my-4">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ alignItems: "center" }}
            >
              {(plan.daily_itinerary || []).map((_: any, idx: number) => (
                <Pressable
                  key={idx}
                  onPress={() => setActiveDay(idx)}
                  className={`mx-2 px-5 h-10 rounded-full border justify-center items-center ${
                    activeDay === idx
                      ? "bg-blue-600 border-blue-600"
                      : "bg-white border-gray-300"
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      activeDay === idx
                        ? "text-white"
                        : "text-gray-700"
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
              renderRightActions={() =>
                renderRightActions(item._localId)
              }
            >
              <Pressable className="flex-row items-center bg-white border border-gray-200 rounded-xl p-3 mb-3">
                <Image
                  source={{
                    uri:
                      item.image ||
                      "https://via.placeholder.com/150",
                  }}
                  className="w-20 h-20 mr-3 rounded-md"
                />

                <View className="flex-1 justify-center">
                  <Text className="font-semibold">
                    {item.place_name}
                  </Text>

                  <View className="flex-row items-center mt-2">
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color="#6b7280"
                    />

                    <Pressable
                      onPress={() =>
                        openTimePicker(
                          item._localId,
                          item.time
                        )
                      }
                      className="ml-2 px-3 py-1 rounded-full bg-gray-100"
                    >
                      <Text className="text-gray-700 font-medium">
                        {item.time}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  onPressIn={drag}
                  className="pl-3 pr-1 py-2 justify-center"
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
          <View className="py-6 items-center">
            <Text className="text-gray-400">
              ยังไม่มีสถานที่
            </Text>
          </View>
        }

        ListFooterComponent={
          <Pressable
            onPress={onPressAddLocation}
            className="flex-row bg-green-600 py-3 rounded-full justify-center items-center mt-4"
          >
            <Ionicons name="add-circle-outline" size={24} color="white" />
            <Text className="ml-3 text-white font-semibold">
              เพิ่มสถานที่ใหม่
            </Text>
          </Pressable>
        }
      />

      {/* Time Picker Modal */}
      <Modal visible={pickerVisible} transparent animationType="fade">
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl px-5 pt-4 pb-8 max-h-[70%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold">
                {selectedTime}
              </Text>
              <Pressable
                onPress={() => setPickerVisible(false)}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color="#6b7280"
                />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {timeOptions.map((t) => {
                const active = t === selectedTime;
                return (
                  <Pressable
                    key={t}
                    onPress={() => setSelectedTime(t)}
                    className={`py-3 px-3 rounded-xl mb-1 ${
                      active ? "bg-gray-200" : ""
                    }`}
                  >
                    <Text
                      className={`text-base ${
                        active
                          ? "font-semibold text-black"
                          : "text-gray-600"
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
              className="bg-blue-600 mt-4 py-3 rounded-xl"
            >
              <Text className="text-white text-center font-semibold">
                ยืนยัน
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/40">
          <View className="bg-white w-80 rounded-2xl p-6 shadow-lg">
            <Text className="text-center text-lg font-semibold mb-6">
              ลบสถานที่นี้?
            </Text>

            <View className="flex-row justify-between">
              <Pressable
                onPress={() => setConfirmVisible(false)}
                className="flex-1 py-3 mr-2 rounded-xl bg-gray-200 items-center"
              >
                <Text className="font-medium text-gray-700">
                  ยกเลิก
                </Text>
              </Pressable>

              <Pressable
                onPress={handleDelete}
                className="flex-1 py-3 ml-2 rounded-xl bg-red-500 items-center"
              >
                <Text className="font-medium text-white">
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
