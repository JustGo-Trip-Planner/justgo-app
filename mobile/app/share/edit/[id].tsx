import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Image,
  ImageBackground,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import Constants from "expo-constants";
import { useAuth } from "@/context/AuthContext";
import VotingDeadlineModal from "@/components/share/VotingModal";

type Member = {
  _id: string;
  name: string;
  avatar?: string;
};

type Group = {
  _id: string;
  name: string;
  members: Member[];
  votingDeadline?: string;
};

export default function EditGroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const API_URL = Constants.expoConfig?.extra?.API_URL;

  const [group, setGroup] = useState<any>(null);
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [deadline, setDeadline] = useState<Date | null>(null);
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const [deadlineEnabled, setDeadlineEnabled] = useState(false);
  const isOwner = group?.owner?._id === user?.id;

  useEffect(() => {
    if (!id) return;

    const fetchGroup = async () => {
      try {
        const res = await axios.get<Group>(`${API_URL}/api/groups/${id}`);
        const group = res.data;

        setGroup(group);
        setGroupName(group.name);
        setMembers(group.members ?? []);
        setDeadline(group.votingDeadline ? new Date(group.votingDeadline) : null);
        setDeadlineEnabled(!!group.votingDeadline);
      } catch {
        Alert.alert("โหลดข้อมูลกลุ่มไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [id]);

  const avatarSource = (uri?: string) =>
    uri?.trim()
      ? { uri }
      : require("@/assets/images/default.png");

  const removeMember = (memberId: string) => {
    setMembers((prev) => prev.filter((m) => m._id !== memberId));
  };

  const handleSave = async () => {
    if (!groupName.trim()) {
      Alert.alert("กรุณากรอกชื่อกลุ่ม");
      return;
    }

    if (deadlineEnabled && !deadline) {
      Alert.alert("กรุณาเลือกวันหมดเขตโหวต");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: groupName,
        members: members.map((m: any) => ({
          userId: m.userId?._id ?? m._id,
          name: m.name,
          avatar: m.avatar ?? "",
        })),
        votingDeadline: deadlineEnabled
          ? deadline?.toISOString()
          : null,
      };

      await axios.put(`${API_URL}/api/groups/${id}`, payload);

      router.replace("/share");
    } catch {
      Alert.alert("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!isOwner) {
      Alert.alert("ไม่มีสิทธิ์", "เฉพาะเจ้าของกลุ่มเท่านั้นที่ลบได้");
      return;
    }

    Alert.alert(
      "ลบกลุ่ม",
      "คุณต้องการลบกลุ่มนี้หรือไม่?",
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ลบ",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/api/groups/${id}`);
              router.replace("/share");
            } catch {
              Alert.alert("ลบกลุ่มไม่สำเร็จ");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
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
      <View className="flex-1 pt-14 px-5">

        {/* HEADER */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white items-center justify-center mr-3 shadow"
            >
              <Ionicons name="chevron-back" size={22} />
            </Pressable>
            <Text className="text-xl font-semibold text-gray-900">
              แก้ไขกลุ่ม
            </Text>
          </View>

          {isOwner && (
            <View className="items-center mt-4">
              <Pressable
                onPress={handleDeleteGroup}
                className="flex-row items-center bg-red-500 px-4 py-3 rounded-2xl"
              >
                <Ionicons name="trash-outline" size={18} color="#fff" />
                <Text className="ml-2 text-white font-medium">
                  ลบกลุ่ม
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }}
        >

          {/* GROUP NAME */}
          <View className="bg-white rounded-3xl p-5 mb-5 shadow-sm">
            <Text className="text-xl font-semibold text-gray-900 mb-2">
              ชื่อกลุ่ม
            </Text>

            <TextInput
              value={groupName}
              onChangeText={setGroupName}
              placeholder="เช่น Trip Pattaya"
              className="bg-gray-100 px-4 py-3 rounded-xl"
            />
          </View>

          {/* MEMBERS */}
          <View className="bg-white rounded-3xl p-5 mb-5 shadow-sm">

            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-semibold text-gray-900">
                สมาชิกในกลุ่ม
              </Text>

              <Text className="font-medium text-gray-500">
                {members.length} คน
              </Text>
            </View>

            {members.map((member, index) => (
              <View
                key={`${member._id}-${index}`}
                className="flex-row items-center py-3 border-b border-gray-100"
              >
                <Image
                  source={avatarSource(member.avatar)}
                  className="w-11 h-11 rounded-full"
                />

                <Text className="text-lg ml-3 flex-1 font-medium text-gray-800">
                  {member.name}
                </Text>

                {user?.id !== member._id && (
                  <Pressable
                    onPress={() => removeMember(member._id)}
                    className="p-2"
                  >
                    <Ionicons name="close-circle" size={22} color="#EF4444" />
                  </Pressable>
                )}
              </View>
            ))}
          </View>

          {/* DEADLINE */}
          <View className="bg-white rounded-3xl p-5 mb-5 shadow-sm">
            <View className="flex-row items-center justify-between mb-3">

              <Text className="text-xl font-semibold text-gray-900">
                วันปิดโหวต
              </Text>

              <Pressable
                onPress={() => setDeadlineEnabled(!deadlineEnabled)}
                className={`w-12 h-7 rounded-full justify-center px-1 ${
                  deadlineEnabled ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <View
                  className={`w-5 h-5 rounded-full bg-white ${
                    deadlineEnabled ? "self-end" : "self-start"
                  }`}
                />
              </Pressable>
            </View>

            {deadlineEnabled && (
              <Pressable
                onPress={() => setDeadlineOpen(true)}
                className="bg-gray-100 px-4 py-3 rounded-xl flex-row items-center justify-between"
                >

                <Text className="font-sans text-gray-800">
                  {deadline
                    ? deadline.toLocaleString("th-TH")
                    : "เลือกวันและเวลา"}
                </Text>

                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color="#6B7280"
                  />

              </Pressable>
            )}

            <Text className="font-sans text-gray-500 mt-3">
              ระบบจะปิดโหวตเมื่อครบเวลา หรือเมื่อสมาชิกโหวตครบ
            </Text>
          </View>
        </ScrollView>

        {/* FOOTER BUTTONS */}
        <View className="absolute bottom-8 left-5 right-5 flex-row">

          <Pressable
            onPress={() => router.back()}
            className="flex-1 bg-gray-200 py-4 rounded-2xl items-center mr-3"
            >
            <Text className="font-semibold text-gray-700">
              ยกเลิก
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSave}
            disabled={saving}
            className="flex-1 bg-orange-500 py-4 rounded-2xl items-center"
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold">
                บันทึก
              </Text>
            )}
          </Pressable>
        </View>
      </View>

      {/* DATE MODAL */}
      <VotingDeadlineModal
        visible={deadlineOpen}
        value={deadline}
        onClose={() => setDeadlineOpen(false)}
        onConfirm={(date) => {
          setDeadline(date);
          setDeadlineOpen(false);
        }}
      />
    </ImageBackground>
  );
}