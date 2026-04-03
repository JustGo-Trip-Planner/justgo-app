import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ImageBackground,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import Constants from "expo-constants";
import { ScrollView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <View className="mb-6 flex-row items-center justify-center">
      <View className="items-center">
        <View
          className={`h-9 w-9 items-center justify-center rounded-full ${
            step >= 1 ? "bg-sky-700" : "bg-gray-200"
          }`}
        >
          <Text className="text-sm font-semibold text-white">1</Text>
        </View>
        <Text
          className={`mt-2 text-xs font-medium ${
            step >= 1 ? "text-sky-700" : "text-gray-400"
          }`}
        >
          ยืนยันอีเมล
        </Text>
      </View>

      <View className="mx-3 h-[2px] -mt-5 w-14 bg-sky-700" />

      <View className="items-center">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-sky-700">
          <Text className="text-sm font-semibold text-white">2</Text>
        </View>
        <Text className="mt-2 text-xs font-medium text-sky-700">
          ตั้งรหัสผ่าน
        </Text>
      </View>
    </View>
  );
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const API_URL = Constants.expoConfig?.extra?.API_URL;

  const safeEmail = Array.isArray(email) ? email[0] : email || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [profileName, setProfileName] = useState("");
  const [avatar, setAvatar] = useState("");

  const avatarSource = useMemo(() => {
    const clean = (avatar || "").trim();
    return clean
      ? { uri: clean }
      : require("@/assets/images/avatar.png");
  }, [avatar]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!safeEmail || !API_URL) return;

      try {
        const res = await axios.post(`${API_URL}/api/auth/forgot-password`, {
          email: safeEmail,
        });

        const user = res.data?.user;
        if (user?.first_name || user?.last_name) {
          setProfileName(
            [user.first_name, user.last_name].filter(Boolean).join(" ")
          );
        } else {
          setProfileName(safeEmail);
        }

        setAvatar(user?.avatar || "");
      } catch {
        setProfileName(safeEmail);
        setAvatar("");
      }
    };

    loadProfile();
  }, [safeEmail, API_URL]);

  const handleResetPassword = async () => {
    if (!safeEmail) {
      Alert.alert("เกิดข้อผิดพลาด", "ไม่พบอีเมลสำหรับรีเซ็ตรหัสผ่าน");
      return;
    }

    if (!newPassword || !confirmPassword) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกรหัสผ่านให้ครบ");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("แจ้งเตือน", "ยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    try {
      setLoading(true);

      await axios.post(`${API_URL}/api/auth/reset-password`, {
        email: safeEmail,
        newPassword,
        confirmPassword,
      });

      Alert.alert("สำเร็จ", "เปลี่ยนรหัสผ่านสำเร็จ", [
        {
          text: "ตกลง",
          onPress: () => router.replace("/login"),
        },
      ]);
    } catch (error: any) {
      const message =
        error.response?.data?.message || "รีเซ็ตรหัสผ่านไม่สำเร็จ";
      Alert.alert("เกิดข้อผิดพลาด", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("@/assets/backgrounds/bg.png")}
      resizeMode="cover"
      className="flex-1"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-6 py-16">
          <View className="mb-8 flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="h-11 w-11 items-center justify-center rounded-full bg-white/85"
            >
              <Ionicons name="chevron-back" size={22} color="#111827" />
            </TouchableOpacity>
          </View>

          <View className="mb-8 items-center">
            <Image
              source={require("@/assets/icons/logo.png")}
              style={{ width: 180, height: 72 }}
              resizeMode="contain"
            />

            <Text className="mt-6 text-center text-3xl font-semibold text-gray-900">
              ตั้งรหัสผ่านใหม่
            </Text>
          </View>

          <StepIndicator step={2} />

          <View className="mx-20 mb-5 rounded-3xl border border-white/70 bg-white/75 px-4 py-4 shadow-lg">
            <View className="flex-row items-center">
              <Image
                source={avatarSource}
                className="h-16 w-16 rounded-full border border-white/80"
              />

              <View className="ml-4 flex-1">
                <Text
                  numberOfLines={1}
                  className="text-xl font-semibold text-gray-900"
                >
                  {profileName || "ผู้ใช้งาน"}
                </Text>

                <View className="mt-1 flex-row items-center">
                    <Ionicons name="mail-outline" size={14} color="#4b5563" />

                  <Text
                    numberOfLines={1}
                    className="ml-2 flex-1 text-sm font-medium text-gray-600"
                  >
                    {safeEmail || "-"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View className="rounded-3xl bg-white/90 p-6 shadow-lg">
            <Text className="mb-2 font-medium text-gray-700">
              รหัสผ่านใหม่
            </Text>
            <View className="relative mb-4">
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="กรอกรหัสผ่านใหม่"
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                className="rounded-2xl border border-gray-300 bg-white px-4 py-3 pr-11 font-sans text-gray-900"
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword((prev) => !prev)}
                className="absolute right-3 top-3"
              >
                <Ionicons
                  name={showNewPassword ? "eye-off" : "eye"}
                  size={22}
                  color="gray"
                />
              </TouchableOpacity>
            </View>

            <Text className="mb-2 font-medium text-gray-700">
              ยืนยันรหัสผ่านใหม่
            </Text>
            <View className="relative mb-2">
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                className="rounded-2xl border border-gray-300 bg-white px-4 py-3 pr-11 font-sans text-gray-900"
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-3"
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={22}
                  color="gray"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleResetPassword}
              disabled={loading}
              className={`mt-5 items-center rounded-2xl py-3.5 ${
                loading ? "bg-gray-400" : "bg-orange-500"
              }`}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-lg font-semibold text-white">
                  บันทึกรหัสผ่านใหม่
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.replace("/login")}
              className="mt-4 self-center"
            >
              <Text className="font-medium text-sky-700">
                กลับไปหน้าเข้าสู่ระบบ
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}