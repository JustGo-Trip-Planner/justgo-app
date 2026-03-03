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

type Member = {
  _id: string;
  name: string;
  avatar?: string;
};

export default function EditGroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const API_URL = Constants.expoConfig?.extra?.API_URL;

  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchGroup = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/groups/${id}`);
        const group = res.data;

        setGroupName(group.name);
        setMembers(group.members || []);
      } catch (err) {
        Alert.alert("โหลดข้อมูลกลุ่มไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [id]);

  const removeMember = (memberId: string) => {
    setMembers((prev) => prev.filter((m) => m._id !== memberId));
  };

  const handleSave = async () => {
    if (!groupName.trim()) {
      Alert.alert("กรุณากรอกชื่อกลุ่ม");
      return;
    }

    try {
      setSaving(true);

      await axios.put(`${API_URL}/api/groups/${id}`, {
        name: groupName,
        members,
      });

      router.replace("/share");
    } catch (err) {
      Alert.alert("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const avatarSource = (uri?: string) =>
    uri && uri.trim()
      ? { uri }
      : require("@/assets/images/default.png");

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

        {/* Header */}
        <View className="relative mb-6 h-12 justify-center">
          <Pressable
            onPress={() => router.back()}
            className="absolute left-0 bg-white/80 p-2 rounded-full"
          >
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </Pressable>

          <View className="items-center">
            <Image
              source={require("@/assets/icons/logo.png")}
              className="h-8"
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Card */}
        <View className="bg-white/50 rounded-3xl px-6 py-7">

          {/* Title */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-semibold text-blue-800 font-sans">
              แก้ไขกลุ่ม
            </Text>

            <Pressable>
              <Ionicons name="trash-outline" size={22} color="#EF4444" />
            </Pressable>
          </View>

          {/* Group Name */}
          <Text className="text-gray-600 font-medium mb-2">
            ชื่อกลุ่ม
          </Text>
          <TextInput
            value={groupName}
            onChangeText={setGroupName}
            className="bg-white rounded-2xl px-4 py-3 mb-6"
          />

          {/* Members */}
          <Text className="text-gray-600 font-medium mb-3">
            สมาชิก
          </Text>

          {members.map((member) => (
            <View
              key={member._id}
              className="flex-row items-center py-3"
            >
              <Image
                source={avatarSource(member.avatar)}
                className="w-10 h-10 rounded-full"
              />
              <Text className="ml-3 flex-1 font-medium">
                {member.name}
              </Text>

              {user?.id !== member._id && (
                <Pressable onPress={() => removeMember(member._id)}>
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color="#EF4444"
                  />
                </Pressable>
              )}
            </View>
          ))}

          {/* Footer Info */}
          <View className="flex-row justify-between mt-6 mb-6">
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text className="ml-2 text-gray-500 text-sm">
                สร้างเมื่อ 21 ก.ย. 2568
              </Text>
            </View>

            <View className="flex-row items-center">
              <Ionicons name="people-outline" size={16} color="#6B7280" />
              <Text className="ml-2 text-gray-500 text-sm">
                จำนวน {members.length} คน
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View className="flex-row justify-between">
            <Pressable
              onPress={() => router.back()}
              className="bg-gray-200 px-6 py-3 rounded-2xl"
            >
              <Text className="font-medium text-gray-700">
                ยกเลิก
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              disabled={saving}
              className="bg-orange-500 px-8 py-3 rounded-2xl"
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
      </View>
    </ImageBackground>
  );
}
