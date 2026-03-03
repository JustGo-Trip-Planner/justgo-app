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

type Member = {
  userId: string;
  name: string;
  avatar?: string;
  status: "pending" | "accepted";
};

type Owner = {
  _id: string;
  name: string;
  avatar?: string;
};

type Group = {
  _id: string;
  name: string;
  owner: Owner;
  members?: Member[];
  createdAt: string;
};

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const API_URL = Constants.expoConfig?.extra?.API_URL;

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(false);

  const loadGroup = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const res = await axios.get<Group>(`${API_URL}/api/groups/${id}`);
      setGroup(res.data);
    } catch (err) {
      console.log("โหลดข้อมูลกลุ่มไม่สำเร็จ", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadGroup();
    }, [id])
  );

  const avatarSource = (uri?: string) => {
    const clean = (uri ?? "").trim();
    return clean
      ? { uri: clean }
      : require("@/assets/images/default.png");
  };

  const formatDate = (dateStr: string) => {
    const months = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
      "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
      "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
    ];

    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    return `${day} ${month} ${year}`;
  };

  if (loading || !group) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const members = group.members ?? [];
  const totalPeople = members.length + 1;
  const isOwner = group.owner._id === user?.id;

  return (
    <ImageBackground
      source={require("@/assets/backgrounds/bg.png")}
      resizeMode="cover"
      className="flex-1"
    >
      <View className="flex-1 pt-14 px-5">

        {/* HEADER */}
        <View className="relative mb-6 h-12 justify-center">
          <Pressable
            onPress={() => router.back()}
            style={{ position: "absolute", left: 0, zIndex: 10 }}
            className="bg-white p-2 rounded-full"
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

        {/* CARD */}
        <ScrollView
          className="bg-white/50 rounded-3xl px-6 py-7"
          contentContainerStyle={{ paddingBottom: 40 }}
        >

          {/* TITLE + EDIT */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-3xl font-semibold text-gray-800">
              ข้อมูลกลุ่ม
            </Text>

            {isOwner && (
              <Pressable onPress={() => router.push(`/share/edit/${group._id}`)}>
                <Ionicons name="create-outline" size={32} color="#EF4444" />
              </Pressable>
            )}
          </View>

          {/* ชื่อกลุ่ม */}
          <Text className="text-gray-600 font-semibold text-xl mb-1">
            ชื่อกลุ่ม
          </Text>
          <Text className="text-blue-800 font-semibold text-xl mb-5">
            {group.name}
          </Text>

          <View className="h-px bg-gray-300 mb-5" />

          {/* OWNER */}
          <Text className="text-gray-600 font-semibold text-xl mb-3">
            เจ้าของกลุ่ม
          </Text>

          <View className="flex-row items-center py-3">
            <Image
              source={avatarSource(group.owner.avatar)}
              className="w-12 h-12 rounded-full"
            />
            <View className="ml-3 flex-1">
              <Text className="font-semibold font-sans text-gray-800">
                {group.owner.name}
              </Text>
            </View>
            <Ionicons name="ribbon" size={20} color="#F97316" />
          </View>

          <View className="h-px bg-gray-300 my-5" />

          {/* MEMBERS */}
          <Text className="text-gray-600 font-semibold text-xl font-sans mb-3">
            สมาชิกในกลุ่ม
          </Text>

          {members.map((member, index) => (
            <View
              key={`${member.userId}-${index}`}
              className="flex-row items-center py-3"
            >
              <Image
                source={avatarSource(member.avatar)}
                className="w-12 h-12 rounded-full"
              />
              <Text className="ml-3 font-medium font-sans text-gray-800">
                {member.name}
              </Text>
              <Text className="text-xs font-medium">
                {member.status === "pending" ? "กำลังเชิญ" : "เข้าร่วมแล้ว"}
              </Text>
            </View>
          ))}

          <View className="h-px bg-gray-300 my-5" />

          {/* FOOTER INFO */}
          <View className="flex-row justify-between">
            <View className="flex-row items-center">
              <Ionicons name="calendar" size={16} color="#F97316" />
              <Text className="ml-2 text-xs font-sans text-gray-600">
                สร้างกลุ่มเมื่อ {formatDate(group.createdAt)}
              </Text>
            </View>

            <View className="flex-row items-center">
              <Ionicons name="person" size={16} color="#F97316" />
              <Text className="ml-2 text-xs font-sans text-gray-600">
                จำนวน {totalPeople} คน
              </Text>
            </View>
          </View>

          {!isOwner && (
            <Pressable
              onPress={async () => {
                await axios.post(`/api/groups/${group._id}/leave`);
                router.back();
              }}
              className="mt-6 bg-red-500 py-3 rounded-2xl items-center"
            >
              <Text className="text-white font-semibold">ออกจากกลุ่ม</Text>
            </Pressable>
          )}

        </ScrollView>
      </View>
    </ImageBackground>
  );
}
