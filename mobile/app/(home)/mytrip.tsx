import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  Alert,
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

  const EmptyState = () => (
    <View className="h-full items-center justify-center rounded-2xl bg-white/80 px-6 py-12 shadow-md">
      <Ionicons name="map-outline" size={72} color="#cbd5e1" />

      <Text className="mt-4 mb-2 text-xl font-semibold font-sans text-gray-700">
        ยังไม่มีแผนของคุณ
      </Text>

      <Text className="mb-6 text-center font-medium font-sans text-gray-500">
        เริ่มสร้างแผนการเดินทางเพื่อบันทึกทริปแรกของคุณ
      </Text>

      <TouchableOpacity
        onPress={() => router.push("/")}
        className="flex-row items-center rounded-full bg-orange-500 px-6 py-3"
      >
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text className="ml-2 text-base font-medium font-sans text-white">
          สร้างแผนการเดินทาง
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCurrentPlans = () => {
    if (plans.length === 0) {
      return <EmptyState />;
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
      return <EmptyState />;
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
                  ? "bg-orange-400"
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
                  ? "bg-orange-400"
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