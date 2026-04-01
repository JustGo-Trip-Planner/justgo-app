import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';
import { useAuth } from '@/context/AuthContext';
import { ScrollView } from 'react-native-gesture-handler';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const API_URL = Constants.expoConfig?.extra?.API_URL;

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      const { token, user } = response.data;
      await login(token, user);
      router.replace('/(home)');
    } catch (error: any) {
      const message = error.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ';
      alert(message);
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
          {/* Logo + Headings */}
          <View className="items-center mb-6">
            <Image
              source={require('@/assets/icons/logo.png')}
              style={{ width: 200, height: 80 }}
              resizeMode="contain"
            />
            <Text className="text-3xl font-semibold text-gray-900 mt-6">ยินดีต้อนรับสู่ JustGo</Text>
            <Text className="text-sm font-sans text-gray-700 mt-1">เข้าสู่ระบบเพื่อเริ่มแพลนเที่ยวที่ใช่สำหรับคุณ</Text>
          </View>

          {/* Glass container */}
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
            <View className="relative mb-2">
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

            {/* Forgot Password */}
            <TouchableOpacity className="mb-4 self-end">
              <Text className="text-sm text-orange-500 font-medium">ลืมรหัสผ่าน?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              className="bg-orange-500 py-3 rounded-xl items-center"
            >
              <Text className="text-white font-semibold text-lg">เข้าสู่ระบบ</Text>
            </TouchableOpacity>

            {/* Register link */}
            <View className="mt-4 items-center">
              <Text className="font-sans text-sm text-gray-600">ยังไม่มีบัญชีผู้ใช้?</Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text className="text-lg text-orange-500 font-semibold">สมัครสมาชิก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}
