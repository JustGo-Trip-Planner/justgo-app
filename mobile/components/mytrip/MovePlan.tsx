import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ActivityIndicator,
  Animated,
  PanResponder,
} from "react-native";

import { Calendar } from "react-native-calendars";
import axios from "axios";

import type { Plan } from "@/types/response";

type Props = {
  visible: boolean;
  plan: Plan | null;
  onClose: () => void;
};

export default function MovePlanModal({
  visible,
  plan,
  onClose,
}: Props) {

  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStartDate(null);
      setEndDate(null);
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({

      onMoveShouldSetPanResponder: (_, gesture) => {
        return gesture.dy > 10;
      },

      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        }
      },

      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 120) {

          Animated.timing(translateY, {
            toValue: 500,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onClose());

        } else {

          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();

        }
      },

    })
  ).current;

  const parseLocalDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  const getMarkedDates = () => {
    const marked: Record<string, any> = {};

    if (startDate) {
      marked[startDate] = {
        selected: true,
        startingDay: true,
        color: "#f97316",
        textColor: "white",
      };
    }

    if (startDate && endDate) {

      let cur = parseLocalDate(startDate);
      const last = parseLocalDate(endDate);

      while (cur <= last) {

        const ds =
          cur.getFullYear() +
          "-" +
          String(cur.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(cur.getDate()).padStart(2, "0");

        marked[ds] = {
          color: "#fb923c",
          textColor: "white",
        };

        cur.setDate(cur.getDate() + 1);
      }

      marked[startDate].startingDay = true;

      marked[endDate] = {
        ...marked[endDate],
        endingDay: true,
      };
    }

    return marked;
  };

  const onSelectDay = (day: any) => {

    const date = day.dateString;

    if (!startDate || (startDate && endDate)) {

      setStartDate(date);
      setEndDate(null);

    } else {

      if (parseLocalDate(date) > parseLocalDate(startDate)) {
        setEndDate(date);
      } else {
        setStartDate(date);
      }

    }

  };

  const reusePlan = async () => {

    if (!plan) return;

    if (!startDate || !endDate) {
      alert("กรุณาเลือกวันเดินทางให้ครบ");
      return;
    }

    try {

      setLoading(true);

      await axios.post(`/api/plan/${plan._id}/reuse`, {
        start_date: startDate,
        end_date: endDate,
      });
      onClose();

    } catch {

      alert("ไม่สามารถสร้างแผนใหม่ได้");

    } finally {

      setLoading(false);

    }
  };



  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
    >

      {/* BACKDROP */}

      <Pressable
        className="flex-1 bg-black/40 justify-end"
        onPress={onClose}
      >

        <Animated.View
          style={{ transform: [{ translateY }] }}
          className="bg-white rounded-t-3xl"
          {...panResponder.panHandlers}
        >

          {/* DRAG HANDLE */}

          <View className="items-center pt-3 pb-2">

            <View className="w-12 h-1.5 bg-gray-300 rounded-full" />

          </View>



          {/* HEADER */}

          <View className="px-6 pb-4">

            <Text className="text-lg font-semibold font-sans text-gray-800">
              เลือกวันเดินทางใหม่
            </Text>

            <Text className="text-gray-500 font-sans font-medium mt-1">
              แผนจะถูกสร้างใหม่ตามช่วงวันที่ที่เลือก
            </Text>

          </View>



          {/* CALENDAR */}

          <View className="px-4">

            <Calendar
              markingType="period"
              minDate={today}
              markedDates={getMarkedDates()}
              onDayPress={onSelectDay}
              theme={{
                todayTextColor: "#f97316",
                arrowColor: "#f97316",
                textMonthFontWeight: "600",
              }}
            />

          </View>



          {/* FOOTER */}

          <View className="px-6 pt-4 pb-10">

            <Pressable
              onPress={reusePlan}
              disabled={!startDate || !endDate || loading}
              className={`py-4 rounded-2xl items-center ${
                startDate && endDate
                  ? "bg-orange-500"
                  : "bg-gray-300"
              }`}
            >

              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-base font-semibold font-sans">
                  สร้างแผนใหม่
                </Text>
              )}

            </Pressable>

          </View>

        </Animated.View>

      </Pressable>

    </Modal>
  );
}