import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  Alert,
  Pressable
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import axios from "axios";

import type { Plan } from "@/types/response";
import PlanCard from "@/components/home/PlanCard";
import { useAuth } from "@/context/AuthContext";
import HomeScroll from "@/components/layout/HomeScroll";
import MovePlanModal from "@/components/mytrip/MovePlan";

export default function MyTrip() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [history, setHistory] = useState<Plan[]>([]);

  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"current" | "history">("current");

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const router = useRouter();
  const { token, loading: authLoading } = useAuth();

  const fetchCurrentPlans = async () => {
    try {
      const res = await axios.get("/api/plan/current");
      setPlans(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log("load current plan error", err);
      setPlans([]);
    }
  };

  const fetchHistoryPlans = async () => {
    try {
      const res = await axios.get("/api/plan/history");
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log("load history plan error", err);
      setHistory([]);
    }
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchCurrentPlans(), fetchHistoryPlans()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      setPlans([]);
      setHistory([]);
      return;
    }

    loadAll();
  }, [authLoading, token]);

  const deletePlan = async (planId: string) => {
    try {
      await axios.delete(`/api/plan/${planId}`);

      setPlans((prev) => prev.filter((p) => p._id !== planId));
      setHistory((prev) => prev.filter((p) => p._id !== planId));
    } catch (err) {
      console.log("delete plan error", err);
    }
  };

  const confirmDelete = (plan: Plan) => {
    if (!plan._id) {
      Alert.alert("ไม่สามารถลบแผนได้", "ไม่พบรหัสแผนการเดินทาง");
      return;
    }

    Alert.alert(
      "ลบแผนการเดินทาง",
      `คุณต้องการลบ "${plan.trip_title}" หรือไม่`,
      [
        {
          text: "ยกเลิก",
          style: "cancel",
        },
        {
          text: "ลบแผน",
          style: "destructive",
          onPress: () => deletePlan(plan._id as string),
        },
      ]
    );
  };

  const EmptyCurrent = () => (
    <View className="flex-1 justify-center items-center px-6">

      <View className="w-full items-center bg-white/80 rounded-3xl px-6 py-10">
          <Ionicons name="map" size={40} color="#9CA3AF" />

        <Text className="mt-5 text-xl font-semibold text-gray-800 text-center">
          ยังไม่มีแผนการเดินทาง
        </Text>

        <Text className="mt-2 text-center text-gray-500 font-medium leading-5">
          เริ่มวางแผนทริปแรกของคุณได้เลย
        </Text>

        <Pressable
          onPress={() => router.push("/")}
          className="mt-6 bg-orange-500 px-6 py-3 rounded-full flex-row items-center"
        >
          <Ionicons name="add-circle" size={20} color="white" />
          <Text className="ml-2 text-white font-semibold">
            สร้างแผนใหม่
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const EmptyHistory = () => (
    <View className="flex-1 justify-center items-center px-6">

      <View className="w-full items-center bg-white/80 rounded-3xl px-6 py-10">
          <Ionicons name="archive" size={40} color="#9CA3AF" />
        <Text className="mt-5 text-xl font-semibold text-gray-800 text-center">
          ยังไม่มีประวัติการเดินทาง
        </Text>

        <Text className="mt-2 text-center text-gray-500 font-medium leading-5">
          เมื่อคุณเดินทางเสร็จแล้ว ทริปจะถูกบันทึกไว้ที่นี่
        </Text>

      </View>
    </View>
  );

  const renderCurrentPlans = () => {
    if (plans.length === 0) {
      return <EmptyCurrent />;
    }

    return plans.map((plan, index) => {
      const planId = plan._id;

      if (!planId) return null;

      return (
        <PlanCard
          key={planId || `current-plan-${index}`}
          plan={plan}
          onPress={() => router.push(`/trip/${planId}`)}
          onDelete={() => confirmDelete(plan)}
        />
      );
    });
  };

  const renderHistoryPlans = () => {
    if (history.length === 0) {
      return <EmptyHistory />;
    }

    return history.map((plan, index) => {
      const planId = plan._id;

      if (!planId) return null;

      return (
        <PlanCard
          key={planId || `history-plan-${index}`}
          plan={plan}
          showReuseButton
          onPress={() => router.push(`/trip/${planId}?viewOnly=true`)}
          onReuse={(p) => {
            setSelectedPlan(p);
            setModalOpen(true);
          }}
          onDelete={() => confirmDelete(plan)}
        />
      );
    });
  };

  return (
    <ImageBackground
      source={require("@/assets/backgrounds/bg.png")}
      resizeMode="cover"
      className="flex-1"
    >
      <View className="flex-1 bg-white/20">
        <HomeScroll contentPaddingBottom={80}>
          <Text className="mb-1 text-center text-2xl font-semibold font-sans text-sky-700">
            แผนการเดินทางของฉัน
          </Text>

          <Text className="mb-6 text-center text-lg font-medium font-sans text-sky-700">
            รวมทุกการเดินทางของคุณไว้ในที่เดียว
          </Text>

          <View className="mb-6 flex-row justify-center">
            <TouchableOpacity
              onPress={() => setTab("current")}
              className={`mr-2 rounded-full px-4 py-2 ${
                tab === "current"
                  ? "bg-orange-500"
                  : "border border-gray-300 bg-white"
              }`}
            >
              <Text
                className={`text-sm font-medium font-sans ${
                  tab === "current" ? "text-white" : "text-gray-700"
                }`}
              >
                แผนเดินทางของคุณ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTab("history")}
              className={`rounded-full px-4 py-2 ${
                tab === "history"
                  ? "bg-orange-500"
                  : "border border-gray-300 bg-white"
              }`}
            >
              <Text
                className={`text-sm font-medium font-sans ${
                  tab === "history" ? "text-white" : "text-gray-700"
                }`}
              >
                ประวัติการเดินทาง
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="items-center justify-center py-10">
              <ActivityIndicator size="large" />
              <Text className="mt-3 font-medium font-sans text-gray-600">
                กำลังโหลดแผนของคุณ...
              </Text>
            </View>
          ) : tab === "current" ? (
            renderCurrentPlans()
          ) : (
            renderHistoryPlans()
          )}
        </HomeScroll>
      </View>

      <MovePlanModal
        visible={modalOpen}
        plan={selectedPlan}
        onClose={() => {
          setModalOpen(false);
          loadAll();
        }}
      />
    </ImageBackground>
  );
}