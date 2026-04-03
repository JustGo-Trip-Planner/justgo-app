import { useState } from "react";
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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import Constants from "expo-constants";
import { useAuth } from "@/context/AuthContext";
import { ScrollView } from "react-native-gesture-handler";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const API_URL = Constants.expoConfig?.extra?.API_URL;

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    try {
      setSubmitting(true);

      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email: email.trim(),
        password,
      });

      const { token, user } = response.data;
      await login(token, user);
      router.replace("/(home)");
    } catch (error: any) {
      const message = error.response?.data?.message || "เข้าสู่ระบบไม่สำเร็จ";
      Alert.alert("เข้าสู่ระบบไม่สำเร็จ", message);
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
        <View className="flex-1 justify-center px-6 py-20">
          <View className="mb-6 items-center">
            <Image
              source={require("@/assets/icons/logo.png")}
              style={{ width: 200, height: 80 }}
              resizeMode="contain"
            />
            <Text className="mt-6 text-3xl font-semibold text-gray-900">
              ยินดีต้อนรับสู่ JustGo
            </Text>
            <Text className="mt-1 text-sm font-sans text-gray-700">
              เข้าสู่ระบบเพื่อเริ่มแพลนเที่ยวที่ใช่สำหรับคุณ
            </Text>
          </View>

          <View className="rounded-2xl bg-white/90 p-6 shadow-lg">
            <Text className="mb-1 font-medium text-gray-700">อีเมล</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="กรอกที่อยู่อีเมลของคุณ"
              keyboardType="email-address"
              autoCapitalize="none"
              className="mb-4 rounded-xl border border-gray-300 bg-white px-4 py-3 font-sans"
              placeholderTextColor="#9CA3AF"
            />

            <Text className="mb-1 font-medium text-gray-700">รหัสผ่าน</Text>
            <View className="relative mb-2">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="กรอกรหัสผ่านของคุณ"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 pr-10 font-sans"
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3"
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={22}
                  color="gray"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className="mb-4 self-end"
              onPress={() => router.push("/forgot-password")}
            >
              <Text className="text-sm font-medium text-orange-500">
                ลืมรหัสผ่าน?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={submitting}
              className={`items-center rounded-xl py-3 ${
                submitting ? "bg-orange-300" : "bg-orange-500"
              }`}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-lg font-semibold text-white">
                  เข้าสู่ระบบ
                </Text>
              )}
            </TouchableOpacity>

            <View className="mt-4 items-center">
              <Text className="font-sans text-sm text-gray-600">
                ยังไม่มีบัญชีผู้ใช้?
              </Text>
              <TouchableOpacity onPress={() => router.push("/register")}>
                <Text className="text-lg font-semibold text-orange-500">
                  สมัครสมาชิก
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}
