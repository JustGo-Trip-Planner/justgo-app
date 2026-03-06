import { useEffect, useMemo, useState } from "react";
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, ImageBackground, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";

type Plan = {
  _id: string;
  trip_title: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  previewImage?: string;
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
        // ✅ ดึงแผนของฉัน (ต้องมี endpoint)
        // แนะนำทำ GET /api/plan/me ที่ backend (ใช้ JWT)
        const res = await axios.get<Plan[]>("/api/plan/me");
        setPlans(Array.isArray(res.data) ? res.data : []);

        // ✅ ดึง myPlanId ในกลุ่มเพื่อ preselect
        if (groupId) {
          const sp = await axios.get<{ myPlanId: string | null }>(`/api/groups/${groupId}/submit`);
          if (sp.data?.myPlanId) setSelected(sp.data.myPlanId);
        }
      } catch (e) {
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [groupId]);

  const onConfirm = async () => {
    if (!groupId) return;
    if (!selected) return Alert.alert("กรุณาเลือกแผนของคุณก่อน");

    try {
      setSubmitting(true);
      await axios.post(`/api/groups/${groupId}/submit`, { planId: selected });
      Alert.alert("สำเร็จ", "ส่งแผนเข้ากลุ่มแล้ว");
      router.back(); // กลับหน้า group detail
    } catch (e: any) {
      Alert.alert("ส่งแผนไม่สำเร็จ", e?.response?.data?.message || "ลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  };

  const cardImg = (uri?: string) => {
    const clean = (uri ?? "").trim();
    return clean ? { uri: clean } : require("@/assets/images/default.png");
  };

  return (
    <ImageBackground source={require("@/assets/backgrounds/bg.png")} resizeMode="cover" className="flex-1">
      <View className="flex-1 pt-14 px-5">
        {/* Header */}
        <View className="relative mb-4 h-12 justify-center">
          <Pressable
            onPress={() => router.back()}
            style={{ position: "absolute", left: 0, zIndex: 10 }}
            className="bg-white/80 p-2 rounded-full"
          >
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </Pressable>
          <View className="items-center">
            <Image source={require("@/assets/icons/logo.png")} className="h-8" resizeMode="contain" />
          </View>
        </View>

        <View className="bg-white/60 rounded-3xl px-5 py-6 flex-1">
          <Text className="text-2xl font-semibold text-gray-800">เลือกแผนของคุณ</Text>
          <Text className="text-gray-600 mt-1 mb-4">เลือก 1 แผนเพื่อเข้าร่วมจัดอันดับในกลุ่ม</Text>

          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" />
            </View>
          ) : plans.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="map-outline" size={46} color="#94A3B8" />
              <Text className="text-gray-600 mt-2">คุณยังไม่มีแผนของตัวเอง</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingBottom: 80, gap: 12 }}>
              {plans.map((p) => {
                const active = selected === p._id;
                return (
                  <Pressable
                    key={p._id}
                    onPress={() => setSelected(p._id)}
                    style={{
                      backgroundColor: "white",
                      borderRadius: 18,
                      overflow: "hidden",
                      borderWidth: 2,
                      borderColor: active ? "#F97316" : "rgba(17,24,39,0.08)",
                    }}
                  >
                    <View style={{ flexDirection: "row" }}>
                      <Image source={cardImg(p.previewImage)} style={{ width: 110, height: 84 }} />
                      <View style={{ flex: 1, padding: 10 }}>
                        <Text numberOfLines={1} style={{ fontWeight: "800", color: "#111827" }}>
                          {p.trip_title}
                        </Text>
                        <Text style={{ color: "#64748B", marginTop: 2, fontSize: 12 }}>
                          {p.start_date} - {p.end_date}
                        </Text>
                        <Text style={{ color: "#0F172A", marginTop: 4, fontWeight: "700", fontSize: 12 }}>
                          งบประมาณ ~ {p.total_budget?.toLocaleString("th-TH")} บาท
                        </Text>
                      </View>

                      <View style={{ width: 42, alignItems: "center", justifyContent: "center" }}>
                        <Ionicons
                          name={active ? "radio-button-on" : "radio-button-off"}
                          size={22}
                          color={active ? "#F97316" : "#94A3B8"}
                        />
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* Footer buttons */}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
            <Pressable
              onPress={() => router.back()}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: "rgba(148,163,184,0.25)", alignItems: "center" }}
            >
              <Text style={{ color: "#334155", fontWeight: "800" }}>ยกเลิก</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              disabled={submitting}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: "#F97316", alignItems: "center", opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontWeight: "800" }}>ยืนยัน</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}