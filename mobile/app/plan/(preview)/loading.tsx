import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, Animated, Easing } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { usePlan, GeneratedPlan } from "@/context/PlanContext";

type JobStatus = {
  job_id: string;
  status: "queued" | "running" | "completed" | "failed";
  step: string;
  message: string;
  progress: number;
  result?: { plans: GeneratedPlan[] };
  error?: string | null;
};

const STEP_LABELS: Record<string, string> = {
  queued: "กำลังเตรียมงาน",
  validating: "กำลังตรวจสอบข้อมูลการเดินทาง",
  loading_vector_store: "กำลังโหลดข้อมูลจังหวัด",
  retrieving_context: "กำลังค้นหาสถานที่ที่เกี่ยวข้อง",
  building_prompt: "กำลังจัดโครงสร้างแผน",
  calling_llm: "AI กำลังสร้างแผนการเดินทาง",
  enriching: "กำลังเติมข้อมูลโรงแรมและสถานที่",
  completed: "สร้างแผนสำเร็จ",
  failed: "เกิดข้อผิดพลาด",
};

const clampProgress = (value: any) => {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, num));
};

export default function LoadingPage() {
  const router = useRouter();
  const { setPlans } = usePlan();
  const { jobId, previewImage } = useLocalSearchParams<{
    jobId: string;
    previewImage?: string;
  }>();

  const API_URL = Constants.expoConfig?.extra?.API_URL;

  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("กำลังเตรียมงาน");
  const [step, setStep] = useState<string>("queued");
  const [error, setError] = useState<string | null>(null);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(-120)).current;
  const orbAnim = useRef(new Animated.Value(0)).current;

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedRef = useRef(false);

  const stopPolling = useCallback(() => {
    stoppedRef.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleBackToSummary = useCallback(() => {
    stopPolling();
    setPlans([]);
    router.back();
  }, [router, setPlans, stopPolling]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 450,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  useEffect(() => {
    if (error) return;

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const shimmerLoop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 320,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const orbLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(orbAnim, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(orbAnim, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    floatLoop.start();
    shimmerLoop.start();
    orbLoop.start();

    return () => {
      pulseLoop.stop();
      floatLoop.stop();
      shimmerLoop.stop();
      orbLoop.stop();
    };
  }, [error, pulseAnim, floatAnim, shimmerAnim, orbAnim]);

  useEffect(() => {
    stoppedRef.current = false;

    if (!jobId) {
      setError("ไม่พบรหัสงานสำหรับติดตามสถานะการสร้างแผน");
      setStep("failed");
      setMessage("ไม่สามารถเริ่มติดตามสถานะการสร้างแผนได้");
      setProgress(100);
      return;
    }

    let mounted = true;

    const poll = async () => {
      if (!mounted || stoppedRef.current) return;

      try {
        const res = await axios.get<JobStatus>(
          `${API_URL}/api/plan/generate/status/${jobId}`
        );

        if (!mounted || stoppedRef.current) return;

        const data = res.data;
        const nextProgress = clampProgress(data.progress);
        const nextStep = data.step || "queued";
        const nextMessage =
          data.message || STEP_LABELS[nextStep] || "กำลังดำเนินการ";

        setProgress(nextProgress);
        setStep(nextStep);
        setMessage(nextMessage);

        if (data.status === "completed" && data.result?.plans) {
          stopPolling();

          const plansFromApi = Array.isArray(data.result.plans)
            ? data.result.plans
            : [];

          const mapped = plansFromApi.map((p: GeneratedPlan) => ({
            ...p,
            previewImage: previewImage || p.previewImage,
          }));

          setPlans(mapped);
          router.replace("/plan/result");
          return;
        }

        if (data.status === "failed") {
          stopPolling();
          setError(data.error || "ระบบไม่สามารถสร้างแผนได้ กรุณาลองใหม่อีกครั้ง");
          setStep("failed");
          setMessage("สร้างแผนไม่สำเร็จ");
          setProgress(100);
          return;
        }

        timeoutRef.current = setTimeout(poll, 1200);
      } catch (e: any) {
        if (!mounted || stoppedRef.current) return;

        stopPolling();
        setError(
          e?.response?.data?.message ||
            e?.response?.data?.detail ||
            e?.message ||
            "ไม่สามารถตรวจสอบสถานะการสร้างแผนได้"
        );
        setStep("failed");
        setMessage("ระบบขัดข้องระหว่างตรวจสอบสถานะ");
        setProgress(100);
      }
    };

    poll();

    return () => {
      mounted = false;
      stopPolling();
    };
  }, [jobId, API_URL, previewImage, router, setPlans, stopPolling]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  const orbTranslateY = orbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 10],
  });

  const orbScale = orbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.14],
  });

  const currentStepLabel = STEP_LABELS[step] || message;
  const progressTone = error ? "#ef4444" : "#f97316";

  return (
    <View className="flex-1 overflow-hidden bg-white">
      <LinearGradient
        colors={
          error
            ? ["#fff7f7", "#ffffff", "#fff5f5"]
            : ["#fff7ed", "#ffffff", "#f8fafc"]
        }
        className="absolute inset-0"
      />

      <Animated.View
        pointerEvents="none"
        style={{
          transform: [{ translateY: orbTranslateY }, { scale: orbScale }],
        }}
        className={`absolute -top-10 -left-10 h-56 w-56 rounded-full ${
          error ? "bg-red-100/60" : "bg-orange-100/70"
        }`}
      />

      <Animated.View
        pointerEvents="none"
        style={{
          transform: [{ translateY: orbTranslateY }],
        }}
        className={`absolute right-[-40px] top-24 h-44 w-44 rounded-full ${
          error ? "bg-rose-100/50" : "bg-sky-100/70"
        }`}
      />

      <View className="flex-1 justify-center px-6 py-10">
        <View className="items-center">
          <View className="relative items-center justify-center">
            <Animated.View
              style={{
                transform: [{ scale: pulseAnim }, { translateY: floatAnim }],
              }}
              className={`h-24 w-24 items-center justify-center rounded-[28px] shadow-lg ${
                error ? "bg-red-50" : "bg-white"
              }`}
            >
              <LinearGradient
                colors={
                  error ? ["#fee2e2", "#ffffff"] : ["#fff7ed", "#ffffff"]
                }
                className="rounded-full"
              />
              <Ionicons
                name={error ? "alert-circle-outline" : "map-outline"}
                size={40}
                color={error ? "#dc2626" : "#f97316"}
              />
            </Animated.View>
          </View>

          <Text className="mt-8 text-center text-3xl font-semibold text-gray-900">
            {error ? "สร้างแผนไม่สำเร็จ" : "กำลังสร้างแผนการเดินทาง"}
          </Text>

          <Text className="mt-3 px-6 text-center text-sm font-sans leading-6 text-gray-500">
            {error
              ? error
              : "ระบบกำลังวิเคราะห์จังหวัด ความสนใจ กิจกรรม และงบประมาณ"}
          </Text>
        </View>

        <View className="mt-10 overflow-hidden rounded-[28px] border border-white/70 bg-white/90 px-5 py-5 shadow-sm">
          <View className="mb-4 flex-row items-end justify-between">
            <View>
              <Text className="text-sm font-sans text-gray-500">ความคืบหน้า</Text>
              <Text className="mt-1 text-lg font-semibold text-gray-900">
                {error ? "กระบวนการหยุดชั่วคราว" : currentStepLabel}
              </Text>
            </View>

            <Text
              style={{ color: progressTone }}
              className="text-3xl font-semibold"
            >
              {progress}%
            </Text>
          </View>

          <View className="h-4 overflow-hidden rounded-full bg-gray-200/80">
            <Animated.View
              style={{ width: progressWidth, backgroundColor: progressTone }}
              className="h-full rounded-full"
            />
            {!error && (
              <Animated.View
                pointerEvents="none"
                style={{
                  transform: [{ translateX: shimmerAnim }],
                }}
                className="absolute top-0 h-full w-24 bg-white/35"
              />
            )}
          </View>
        </View>

        {error && (
          <TouchableOpacity
            onPress={handleBackToSummary}
            activeOpacity={0.9}
            className="mt-6 overflow-hidden rounded-2xl"
          >
            <LinearGradient
              colors={["#f97316", "#ea580c"]}
              className="items-center py-4"
            >
              <Text className="text-base font-semibold text-white">
                กลับไปสร้างแผนใหม่
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
