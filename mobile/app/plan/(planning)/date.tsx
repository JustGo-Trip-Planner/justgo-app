import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Calendar } from "react-native-calendars";
import { useRouter, useLocalSearchParams } from "expo-router";
import axios from "axios";
import Constants from "expo-constants";
import { usePlan } from "../../../context/PlanContext";

export default function DateScreen() {
  const router = useRouter();
  const API_URL = Constants.expoConfig?.extra?.API_URL;
  const { province } = useLocalSearchParams<{ province?: string }>();
  const { plan, setPlan } = usePlan();

  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  useEffect(() => {
    if (province) {
      axios.get(`${API_URL}/api/provinces/${province}`)
        .then(res => {
          const { name_th, cover_image } = res.data;
          setPlan((prev) => ({
            ...prev,
            province,
            provinceName: name_th,
            image: cover_image,
          }));
        })
        .catch(console.error);
    }
  }, [province]);

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
      let cur = new Date(startDate);
      const last = new Date(endDate);

      while (cur <= last) {
        const ds = cur.toISOString().split("T")[0];
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

  const onNext = () => {
    if (!startDate || !endDate) {
      alert("กรุณาเลือกวันที่เดินทางให้ครบถ้วน");
      return;
    }

    setPlan((prev) => ({
      ...prev,
      startDate,
      endDate,
    }));

    router.push({
      pathname: "/plan/who",
      params: { province },
    });
  };

  return (
    <View className="flex-1 bg-white">
      {/* Section: Header + Calendar */}
      <View className="flex-1 px-5 pt-4">
        <Text className="text-gray-500 text-base font-sans font-medium">
          STEP 1
        </Text>
        <Text className="text-2xl font-sans font-semibold text-[#3262AB] mb-4">
          เลือกวันที่เดินทาง
        </Text>

        <Calendar
          markingType="period"
          markedDates={getMarkedDates()}
          onDayPress={(day) => {
            if (!startDate || (startDate && endDate)) {
              setStartDate(day.dateString);
              setEndDate(null);
            } else {
              if (new Date(day.dateString) > new Date(startDate)) {
                setEndDate(day.dateString);
              } else {
                setStartDate(day.dateString);
              }
            }
          }}
          theme={{
            textDayFontFamily: "Kanit_400Regular",
            textMonthFontFamily: "Kanit_500Medium",
            textDayHeaderFontFamily: "Kanit_500Medium",
            textMonthFontWeight: "bold",
            todayTextColor: "#f97316",
            arrowColor: "#f97316",
          }}
        />
      </View>

      {/* Sticky Footer Button */}
      <View className="px-5 pb-6">
        <TouchableOpacity
          onPress={onNext}
          disabled={!startDate}
          className={`w-full py-4 rounded-2xl ${
            startDate ? "bg-orange-500" : "bg-gray-300"
          }`}
        >
          <Text className="text-white text-center text-lg font-sans font-semibold">
            ถัดไป
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
