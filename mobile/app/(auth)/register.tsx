import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import axios from "axios";
import { useAuth } from '@/context/AuthContext';
import { ScrollView } from 'react-native-gesture-handler';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_URL = Constants.expoConfig?.extra?.API_URL;

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleRegister = async () => {
    if (!email || !password || !confirm) {
      return alert("กรุณากรอกข้อมูลให้ครบ");
    }

    if (!validateEmail(email)) {
      return alert("รูปแบบอีเมลไม่ถูกต้อง");
    }

    if (password !== confirm) {
      return alert("รหัสผ่านไม่ตรงกัน");
    }

    try {
      setLoading(true);

      const res = await axios.post<any>(
        `${API_URL}/api/auth/check-email`,
        { email }
      );

      if (res.data.exists) {
        return alert("อีเมลนี้ถูกใช้ไปแล้ว");
      }

      router.push({
        pathname: "/(auth)/create-profile",
        params: { email, password },
      });
    } catch (err: any) {
      if (err.response?.status === 500) {
        alert("เซิร์ฟเวอร์มีปัญหา");
      } else {
        alert("เกิดข้อผิดพลาด");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('@/assets/backgrounds/bg.png')}
      resizeMode="cover"
      className="flex-1"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center px-6 py-20">

          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-14 left-5 bg-white/70 rounded-full p-2 z-10"
          >
            <Ionicons name="arrow-back" size={22} color="#333" />
          </TouchableOpacity>

          {/* Header */}
          <View className="items-center mb-6 mt-6">
            <Image
              source={require('@/assets/icons/logo.png')}
              style={{ width: 200, height: 80 }}
              resizeMode="contain"
            />
            <Text className="text-3xl font-semibold text-gray-900 mt-4">สร้างบัญชีของคุณ</Text>
            <Text className="text-sm font-sans text-gray-700 mt-1">
              สมัครบัญชีเพื่อวางแผนการเดินทางของคุณได้อย่างเต็มที่
            </Text>
          </View>

          {/* Form */}
          <View className="bg-white/90 p-6 rounded-2xl shadow-lg">
            {/* Email */}
            <Text className="text-gray-700 font-medium mb-1">อีเมล</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="กรอกที่อยู่อีเมลของคุณ"
              keyboardType="email-address"
              autoCapitalize="none"
              className="font-sans bg-white border border-gray-300 rounded-xl px-4 py-3 mb-4"
            />

            {/* Password */}
            <Text className="text-gray-700 font-medium mb-1">รหัสผ่าน</Text>
            <View className="relative mb-4">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="กรอกรหัสผ่านของคุณ"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                className="font-sans bg-white border border-gray-300 rounded-xl px-4 py-3 pr-10"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3"
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color="gray"
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <Text className="text-gray-700 font-medium mb-1">ยืนยันรหัสผ่าน</Text>
            <View className="relative mb-6">
              <TextInput
                value={confirm}
                onChangeText={setConfirm}
                placeholder="กรอกยืนยันรหัสผ่านของคุณ"
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                className="font-sans bg-white border border-gray-300 rounded-xl px-4 py-3 pr-10"
              />
              <TouchableOpacity
                onPress={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-3"
              >
                <Ionicons
                  name={showConfirm ? 'eye-off' : 'eye'}
                  size={22}
                  color="gray"
                />
              </TouchableOpacity>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              onPress={handleRegister}
              className="bg-orange-500 py-3 rounded-xl items-center"
            >
              <Text className="text-white font-semibold text-lg">สร้างบัญชี</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}
