import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ImageBackground,
  Alert,
  Image,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import Constants from "expo-constants";

const STAR_SIZE = 30;
const STAR_GAP = 6;
const TOTAL_STARS = 5;

type ScoreKey = "suitability" | "budget" | "schedule" | "variety";

type ScoreState = Record<ScoreKey, number>;

type Plan = {
  _id: string;
  trip_title: string;
  total_budget?: number;
  previewImage?: string;
  user?: {
    first_name?: string;
  };
};

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function snapToHalf(v: number) {
  return Math.round(v * 2) / 2;
}

function starIcon(value: number, index: number) {
  if (value >= index) return "star";
  if (value >= index - 0.5) return "star-half";
  return "star-outline";
}

function imageSource(uri?: string) {
  const clean = (uri ?? "").trim();
  return clean
    ? { uri: clean }
    : require("@/assets/images/default.png");
}

type StarRowProps = {
  label: string;
  scoreKey: ScoreKey;
  value: number;
  onChange: (key: ScoreKey, value: number) => void;
};

function StarRatingRow({
  label,
  scoreKey,
  value,
  onChange,
}: StarRowProps) {

  const rowRef = useRef<View>(null);
  const rowX = useRef(0);
  const rowWidth = useRef(0);

  const totalWidth =
    TOTAL_STARS * STAR_SIZE +
    (TOTAL_STARS - 1) * STAR_GAP;

  const measure = () => {
    rowRef.current?.measure((_, __, width, ___, pageX) => {
      rowX.current = pageX;
      rowWidth.current = width;
    });
  };

  const updateScore = (pageX: number) => {
    const relativeX = pageX - rowX.current;
    const width = rowWidth.current || totalWidth;
    const safeX = clamp(relativeX, 0, width);
    const raw = (safeX / width) * TOTAL_STARS;
    const score = clamp(
      snapToHalf(raw),
      0.5,
      TOTAL_STARS
    );
    onChange(scoreKey, score);
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant: (evt) => {
          measure();
          updateScore(evt.nativeEvent.pageX);
        },

        onPanResponderMove: (_, g) => {
          updateScore(g.moveX);
        },
      }),
    []
  );

  return (
    <View className="mb-4">
      <Text className="text-gray-800 font-sans font-medium">
        {label}
      </Text>

      <View
        ref={rowRef}
        {...pan.panHandlers}
        style={{ width: totalWidth}}
      >
        <View className="flex-row">

          {Array.from({ length: TOTAL_STARS }, (_, i) => {
            const index = i + 1;

            return (
              <View
                key={index}
                style={{
                  width: STAR_SIZE,
                  marginRight:
                    index === TOTAL_STARS
                      ? 0
                      : STAR_GAP,
                }}
              >
                <Ionicons
                  name={starIcon(value, index) as any}
                  size={STAR_SIZE}
                  color="#F59E0B"
                />
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function VotePlanScreen() {
  const { groupId, planId } = useLocalSearchParams<{
    groupId: string;
    planId: string;
  }>();

  const router = useRouter();
  const API_URL = Constants.expoConfig?.extra?.API_URL;

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [scores, setScores] = useState<ScoreState>({
    suitability: 0,
    budget: 0,
    schedule: 0,
    variety: 0,
  });

  useEffect(() => {
    if (!planId) return;

    const loadPlan = async () => {
      try {
        setLoadingPlan(true);
        const res = await axios.get<Plan>(`${API_URL}/api/plan/${planId}`);
        setPlan(res.data);
      } catch {
        Alert.alert("โหลดแผนไม่สำเร็จ");
      } finally {
        setLoadingPlan(false);
      }
    };
    loadPlan();
  }, [planId]);

  const setScore = (key: ScoreKey, value: number) => {
    setScores((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const submitVote = async () => {
    if (Object.values(scores).some((v) => v === 0)) {
      Alert.alert("กรุณาให้คะแนนทุกหัวข้อ");
      return;
    }

    try {
      setSubmitting(true);

      await axios.post(`${API_URL}/api/groups/${groupId}/vote`, { planId, score: scores });
      Alert.alert("สำเร็จ", "ส่งคะแนนเรียบร้อย");

      router.back();
    } catch (error: any) {
      Alert.alert("โหวตไม่สำเร็จ", error?.response?.data?.message || "กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPlan || !plan) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("@/assets/backgrounds/bg.png")}
      resizeMode="cover"
      className="flex-1"
    >

      <View className="flex-1 px-6 pt-14">

        {/* Header */}
        <View className="flex-row items-center mb-6">
          <Pressable
            onPress={() => router.back()}
            className="mr-3"
          >
            <Ionicons
              name="chevron-back"
              size={26}
              color="#111827"
            />
          </Pressable>

          <Text className="font-sans font-semibold text-lg text-gray-900">
            ให้คะแนนแผน
          </Text>
        </View>

        {/* Plan Card */}
        <View className="bg-white rounded-3xl overflow-hidden shadow-sm">
          <Image
            source={imageSource(plan.previewImage)}
            className="w-full h-44"
            resizeMode="cover"
          />

          <View className="p-5">
            <Text
              className="text-lg font-sans font-semibold text-gray-900"
              numberOfLines={1}
            >
              {plan.trip_title}
            </Text>

            <Text className="text-sm text-gray-500 font-sans font-medium mt-1">
              โดย {plan.user?.first_name ?? "Unknown"}
            </Text>

            <Text className="text-sm text-gray-600 font-sans font-medium mt-1">
              งบประมาณ ~฿
              {(plan.total_budget ?? 0).toLocaleString("th-TH")}
            </Text>
          </View>
        </View>

        {/* Rating Card */}
        <View className="bg-white rounded-3xl p-6 mt-4 shadow-sm">

          <StarRatingRow
            label="ความน่าสนใจโดยรวม"
            scoreKey="suitability"
            value={scores.suitability}
            onChange={setScore}
          />

          <StarRatingRow
            label="ความคุ้มค่า"
            scoreKey="budget"
            value={scores.budget}
            onChange={setScore}
          />

          <StarRatingRow
            label="ความหลากหลายกิจกรรม"
            scoreKey="variety"
            value={scores.variety}
            onChange={setScore}
          />

          <StarRatingRow
            label="ความสะดวกในการเดินทาง"
            scoreKey="schedule"
            value={scores.schedule}
            onChange={setScore}
          />

        </View>

        {/* Submit */}
        <Pressable
          onPress={submitVote}
          disabled={submitting}
          className="bg-orange-500 py-4 rounded-full items-center mt-5"
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-sans font-semibold">
              ส่งคะแนน
            </Text>
          )}
        </Pressable>
      </View>
    </ImageBackground>
  );
}