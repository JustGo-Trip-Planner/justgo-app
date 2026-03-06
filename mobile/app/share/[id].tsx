import { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import Constants from "expo-constants";
import axios from "axios";

import { useAuth } from "@/context/AuthContext";
import SubmittedPlanCard from "@/components/share/SubmittedPlanCard";
import GroupMembersSection, {
  Member,
} from "@/components/share/GroupMember";

type Owner = {
  _id: string;
  name?: string;
  first_name?: string;
  avatar?: string;
};

type FinalizedPlan = {
  _id: string;
  trip_title: string;
  previewImage?: string;
  total_budget: number;
};

type Group = {
  _id: string;
  name: string;
  owner: Owner;
  members?: Member[];
  createdAt: string;
  finalizedPlanId?: FinalizedPlan | null;
};

type SubmittedItem = {
  _id: string;
  userId: { _id: string; first_name?: string; avatar?: string };
  planId: {
    _id: string;
    trip_title: string;
    start_date: string;
    end_date: string;
    total_budget: number;
    previewImage?: string;
  };
};

type VotingStateResponse = {
  submissions: SubmittedItem[];
  progress: {
    eligibleCount: number;
    completedVoters: number;
    myVotedPlanIds: string[];
  };
};

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const API_URL = Constants.expoConfig?.extra?.API_URL;

  const [group, setGroup] = useState<Group | null>(null);
  const [membersState, setMembersState] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  const [submitted, setSubmitted] = useState<SubmittedItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [myVotedPlanIds, setMyVotedPlanIds] = useState<string[]>([]);
  const [votingFinished, setVotingFinished] = useState(false);

  const finalizedPlan = group?.finalizedPlanId;

  useFocusEffect(
    useCallback(() => {
      if (id) loadData();
    }, [id])
  );

  const loadData = async () => {
    try {
      setLoading(true);

      const groupRes = await axios.get<Group>(`${API_URL}/api/groups/${id}`);
      setGroup(groupRes.data);
      setMembersState(groupRes.data.members ?? []);

      const votingRes = await axios.get<VotingStateResponse>(
        `${API_URL}/api/groups/${id}/voting-state`
      );

      const { submissions, progress } = votingRes.data;

      setSubmitted(submissions ?? []);
      setMyVotedPlanIds(progress?.myVotedPlanIds ?? []);

      const percent =
        progress.eligibleCount === 0
          ? 0
          : progress.completedVoters / progress.eligibleCount;

      setProgress(percent);
      setProgressText(
        `${progress.completedVoters} / ${progress.eligibleCount} คนโหวตแล้ว`
      );

      setVotingFinished(
        progress.completedVoters === progress.eligibleCount ||
          !!groupRes.data.finalizedPlanId
      );
    } catch (err) {
      console.log("โหลดข้อมูลกลุ่มไม่สำเร็จ", err);
    } finally {
      setLoading(false);
    }
  };

  const avatarSource = (uri?: string) =>
    uri?.trim()
      ? { uri }
      : require("@/assets/images/default.png");

  const formatDate = (dateStr: string) => {
    const months = [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ];

    const d = new Date(dateStr);

    return `${String(d.getDate()).padStart(2, "0")} ${
      months[d.getMonth()]
    } ${d.getFullYear()}`;
  };

  if (loading || !group) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const totalPeople = membersState.filter((m) => m.status === "accepted" || m.status === "pending").length + 1;
  const isOwner = String(group.owner._id) === String(user?.id);

  return (
    <ImageBackground
      source={require("@/assets/backgrounds/bg.png")}
      resizeMode="cover"
      className="flex-1"
    >
      <View className="flex-1 pt-14 px-5">
        <View className="relative mb-6 h-12 justify-center">
          <Pressable
            onPress={() => router.back()}
            className="absolute left-0 bg-white p-2 rounded-full"
          >
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </Pressable>

          <View className="items-center">
            <Image
              source={require("@/assets/icons/logo.png")}
              className="h-8"
              resizeMode="contain"
            />
          </View>
        </View>

        <ScrollView
          className="bg-white/50 rounded-3xl px-6 py-7"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-3xl font-sans font-semibold text-gray-800">
              ข้อมูลกลุ่ม
            </Text>

            {isOwner && (
              <Pressable onPress={() => router.push(`/share/edit/${group._id}`)}>
                <Ionicons name="create-outline" size={28} color="#EF4444" />
              </Pressable>
            )}
          </View>

          <Text className="text-gray-600 font-sans font-medium text-lg mb-1">
            ชื่อกลุ่ม
          </Text>

          <Text className="text-blue-800 font-sans font-semibold text-xl mb-4">
            {group.name}
          </Text>

          <View className="h-px bg-gray-300 mb-5" />

          <GroupMembersSection
            groupId={group._id}
            owner={group.owner}
            members={membersState}
            isOwner={isOwner}
            onMembersChange={setMembersState}
          />

          <View className="h-px bg-gray-300 my-5" />

          {finalizedPlan && (
            <View className="bg-white rounded-2xl p-4 mb-5">
              <View className="flex-row items-center mb-2">
                <Ionicons name="trophy" size={18} color="#F59E0B" />
                <Text className="ml-2 font-sans font-semibold text-lg">
                  แผนการเดินทางของกลุ่ม
                </Text>
              </View>

              <Image
                source={avatarSource(finalizedPlan.previewImage)}
                className="w-full h-40 rounded-xl mb-3"
              />

              <Text className="font-sans font-semibold text-base">
                {finalizedPlan.trip_title}
              </Text>

              <Text className="text-xs text-gray-500 font-sans font-medium">
                งบประมาณ ~ {finalizedPlan.total_budget} บาท
              </Text>

              <Pressable
                onPress={() =>
                  router.push(`/trip/${finalizedPlan._id}?viewOnly=true`)
                }
                className="bg-gray-200 mt-3 px-3 py-2 rounded-full self-start"
              >
                <Text className="text-xs font-sans font-medium">ดูแผน</Text>
              </Pressable>
            </View>
          )}

          {!finalizedPlan && (
            <>
              <Text className="text-lg font-sans font-semibold mb-2">
                ความคืบหน้าการโหวต
              </Text>

              <View className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <View
                  style={{ width: `${progress * 100}%` }}
                  className="h-3 bg-blue-500"
                />
              </View>

              <Text className="text-xs text-gray-600 font-sans font-medium mt-1 mb-4">
                {progressText}
              </Text>
            </>
          )}

          {!votingFinished && !finalizedPlan && (
            <>
              <Text className="text-lg font-sans font-semibold mb-2">
                แผนการเดินทางในกลุ่ม
              </Text>

              {submitted.map((row) => {
                const voted = myVotedPlanIds.includes(row.planId._id);

                return (
                  <SubmittedPlanCard
                    key={row._id}
                    plan={row.planId}
                    user={row.userId}
                    voted={voted}
                    onPressVote={() =>
                      router.push(
                        `/share/vote?groupId=${group._id}&planId=${row.planId._id}`
                      )
                    }
                    onPressView={() =>
                      router.push(`/trip/${row.planId._id}?viewOnly=true`)
                    }
                  />
                );
              })}

              <Pressable
                onPress={() =>
                  router.push(`/share/select-plan?groupId=${group._id}`)
                }
                className="mt-4 bg-orange-500 py-3 rounded-2xl items-center"
              >
                <Text className="text-white font-sans font-semibold">
                  ส่งแผนของฉัน
                </Text>
              </Pressable>
            </>
          )}

          {votingFinished && (
            <Pressable
              onPress={() => router.push(`/share/result/${group._id}`)}
              className="bg-orange-500 py-3 rounded-2xl items-center mt-5"
            >
              <Text className="text-white font-sans font-semibold">
                สรุปผลโหวต
              </Text>
            </Pressable>
          )}

          <View className="flex-row justify-between mt-6">
            <View className="flex-row items-center">
              <Ionicons name="calendar" size={16} color="#F97316" />
              <Text className="ml-2 text-xs text-gray-600 font-sans font-medium">
                สร้างกลุ่มเมื่อ {formatDate(group.createdAt)}
              </Text>
            </View>

            <View className="flex-row items-center">
              <Ionicons name="person" size={16} color="#F97316" />
              <Text className="ml-2 text-xs text-gray-600 font-sans font-medium">
                จำนวน {totalPeople} คน
              </Text>
            </View>
          </View>

          {!isOwner && (
            <Pressable
              onPress={async () => {
                await axios.post(`${API_URL}/api/groups/${group._id}/leave`);
                router.back();
              }}
              className="mt-6 bg-red-500 py-3 rounded-2xl items-center"
            >
              <Text className="text-white font-sans font-semibold">
                ออกจากกลุ่ม
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </View>
    </ImageBackground>
  );
}