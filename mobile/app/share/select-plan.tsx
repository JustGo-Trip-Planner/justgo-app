import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
  Alert,
  Pressable,
  Image,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";

import PlanSelectCard from "@/components/share/PlanSelect";
import { isCurrentPlan } from "@/lib/formatDate";

type Plan = {
  _id: string;
  trip_title: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  previewImage?: string;
  total_places?: number;
};

export default function SelectMyPlanScreen() {

  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {

    const run = async () => {

      try {

        setLoading(true);

        const res = await axios.get<Plan[]>("/api/plan/me");

        const rawPlans = Array.isArray(res.data) ? res.data : [];

        setPlans(rawPlans);

      } catch {

        setPlans([]);

      } finally {

        setLoading(false);

      }

    };

    run();

  }, []);

  const currentPlans = useMemo(() => {
    return plans.filter((plan) => isCurrentPlan(plan.end_date));
  }, [plans]);

  const onConfirm = async () => {

    if (!groupId) return;

    if (!selected) {
      return Alert.alert("กรุณาเลือกแผนของคุณก่อน");
    }

    try {

      setSubmitting(true);

      await axios.post(`/api/groups/${groupId}/submit`, {
        planId: selected,
      });

      Alert.alert("สำเร็จ", "ส่งแผนเข้ากลุ่มแล้ว");

      router.back();

    } catch (e: any) {

      Alert.alert(
        "ส่งแผนไม่สำเร็จ",
        e?.response?.data?.message || "ลองใหม่อีกครั้ง"
      );

    } finally {

      setSubmitting(false);

    }

  };

  return (

    <ImageBackground
      source={require("@/assets/backgrounds/bg.png")}
      resizeMode="cover"
      className="flex-1"
    >

      <View className="flex-1 px-5 pt-14">

        {/* HEADER */}

        <View className="relative mb-5 h-12 justify-center">

          <Pressable
            onPress={() => router.back()}
            className="absolute left-0 rounded-full bg-white/80 p-2"
          >
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </Pressable>

          <View className="items-center">
            <Image
              source={require("@/assets/icons/logo.png")}
              resizeMode="contain"
              className="h-8"
            />
          </View>

        </View>


        {/* MAIN CARD */}

        <View className="flex-1 rounded-3xl bg-white/80 px-5 py-6">

          {/* TITLE */}

          <Text className="font-semibold font-sans text-2xl text-gray-800">
            เลือกแผนของคุณ
          </Text>

          <Text className="mt-1 font-medium font-sans text-sm text-gray-600">
            เลือก 1 แผนปัจจุบันเพื่อส่งเข้ากลุ่ม
          </Text>


          {/* PLAN LIST */}

          <View className="mt-5 flex-1">

            {loading ? (

              <View className="flex-1 items-center justify-center">

                <ActivityIndicator size="large" />

                <Text className="mt-3 font-medium font-sans text-gray-600">
                  กำลังโหลดแผนของคุณ...
                </Text>

              </View>

            ) : (

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >

                {currentPlans.map((plan) => {

                  const active = selected === plan._id;

                  return (

                    <PlanSelectCard
                      key={plan._id}
                      plan={plan}
                      active={active}
                      onPress={() =>
                        setSelected(prev =>
                          prev === plan._id ? null : plan._id
                        )
                      }
                    />

                  );

                })}

              </ScrollView>

            )}

          </View>

        </View>


        {/* FOOTER CONFIRM */}

        <View className="pt-4 pb-6">

          <Pressable
            onPress={onConfirm}
            disabled={!selected || submitting}
            className={`items-center rounded-full py-4 ${
              !selected || submitting
                ? "bg-white/50"
                : "bg-orange-500"
            }`}
          >

            {submitting ? (

              <ActivityIndicator color="white" />

            ) : (

              <Text className="font-semibold font-sans text-base text-white">
                ยืนยันแผน
              </Text>

            )}

          </Pressable>

        </View>

      </View>

    </ImageBackground>

  );
}