import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ImageBackground,
  Image,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import axios from "axios";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";

const isValidEmail = (value: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim().toLowerCase());
};

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
        <View
          className={`h-9 w-9 items-center justify-center rounded-full ${
            step >= 2 ? "bg-sky-700" : "bg-gray-200"
          }`}
        >
          <Text
            className={`text-sm font-semibold ${
              step >= 2 ? "text-white" : "text-gray-500"
            }`}
          >
            2
          </Text>
        </View>
        <Text
          className={`mt-2 text-xs font-medium ${
            step >= 2 ? "text-sky-700" : "text-gray-400"
          }`}
        >
          ตั้งรหัสผ่าน
        </Text>
      </View>
    </View>
  );
}

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const API_URL = Constants.expoConfig?.extra?.API_URL;

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const handleSendReset = async () => {
    if (!normalizedEmail) {
      Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอกอีเมล");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      Alert.alert("อีเมลไม่ถูกต้อง", "กรุณากรอกรูปแบบอีเมลให้ถูกต้อง");
      return;
    }

    try {
      setSubmitting(true);

      await axios.post(`${API_URL}/api/auth/forgot-password`, {
        email: normalizedEmail,
      });

      router.push({
        pathname: "/reset-password",
        params: { email: normalizedEmail },
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message || "ไม่สามารถดำเนินการต่อได้";
      Alert.alert("ดำเนินการไม่สำเร็จ", message);
    } finally {
      setSubmitting(false);
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
              ขอเปลี่ยนรหัสผ่าน
            </Text>

            <Text className="mt-2 text-center text-sm font-sans text-gray-700">
              กรอกอีเมลเพื่อดำเนินการต่อ
            </Text>
          </View>

          <StepIndicator step={1} />

          <View className="rounded-3xl bg-white/90 p-6 shadow-lg">
            <Text className="mb-2 font-medium text-gray-700">อีเมล</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="example@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              className="rounded-2xl border border-gray-300 bg-white px-4 py-3 font-sans text-gray-900"
              placeholderTextColor="#9CA3AF"
            />

            {!!normalizedEmail && !isValidEmail(normalizedEmail) && (
              <Text className="mt-2 text-sm font-medium text-red-500">
                กรุณากรอกรูปแบบอีเมลให้ถูกต้อง
              </Text>
            )}

            <TouchableOpacity
              onPress={handleSendReset}
              disabled={submitting}
              className={`mt-5 items-center rounded-2xl py-3.5 ${
                submitting ? "bg-orange-300" : "bg-orange-500"
              }`}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-lg font-semibold text-white">
                  ดำเนินการต่อ
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