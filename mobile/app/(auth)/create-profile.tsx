import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ImageBackground,
  ScrollView,
  Modal,
  Platform,
} from "react-native";

import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import CountryPicker from "react-native-country-picker-modal";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import Constants from "expo-constants";
import axios from "axios";

import { useAuth } from "@/context/AuthContext";

import { interestGroups } from "@/constants/interestData";
import { activityGroups } from "@/constants/activityData";
import ChoosePreference from "@/components/preference/ChoosePreference";

import AvatarPicker from "@/components/avatar/AvatarPicker";
import { pickAvatar, processAvatar } from "@/components/avatar/upload";

type Preference = {
  groupId: string;
  items: string[];
};

export default function CreateProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { user, login, token, logout } = useAuth();
  const params = useLocalSearchParams<{ email: string; password: string }>();
  const [authData] = useState({
    email: params.email,
    password: params.password,
  });
  
  const [step, setStep] = useState(1);
  const [avatar, setAvatar] = useState("");
  
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    gender: "",
    birth_date: "",
    phone: "",
    interests: [] as Preference[],
    activities: [] as Preference[],
  });
  
  const [countryCode, setCountryCode] = useState("TH");
  const [callingCode, setCallingCode] = useState("66");
  
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const API_URL = Constants.expoConfig?.extra?.API_URL;
  
  const [errors, setErrors] = useState<{
    first_name?: string;
    last_name?: string;
    gender?: string;
    birth_date?: string;
    phone?: string;
  }>({});

  const handlePickAvatar = async () => {
    const uri = await pickAvatar();
    if (uri) setAvatar(uri);
  };

  const normalize = (text: string) => text.trim();

  const validateStep1 = () => {
    const newErrors: typeof errors = {};

    const firstName = normalize(form.first_name);
    const lastName = normalize(form.last_name);

    // ===== NAME =====
    if (!firstName) {
      newErrors.first_name = "กรุณากรอกชื่อ";
    }
    if (!lastName) {
      newErrors.last_name = "กรุณากรอกนามสกุล";
    }

    // ===== GENDER =====
    if (!form.gender) {
      newErrors.gender = "กรุณาเลือกเพศ";
    }

    // ===== BIRTH DATE =====
    if (!form.birth_date) {
      newErrors.birth_date = "กรุณาเลือกวันเกิด";
    } else {
      const birth = new Date(form.birth_date);
      const today = new Date();
      if (birth > today) {
        newErrors.birth_date = "วันเกิดไม่ถูกต้อง";
      }
    }

    // ===== PHONE =====
    const phoneNumber = parsePhoneNumberFromString(
      form.phone,
      countryCode as any
    );

    if (!form.phone.trim()) {
      newErrors.phone = "กรุณากรอกเบอร์โทร";
    } else if (!phoneNumber || !phoneNumber.isValid()) {
      newErrors.phone = "เบอร์ไม่ถูกต้อง";
    }
    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
  };

  const togglePreference = (
    field: "interests" | "activities",
    groupId: string,
    itemId: string
  ) => {
    setForm((prev) => {
      const current = [...prev[field]];
      const index = current.findIndex((g) => g.groupId === groupId);

      if (index === -1) {
        current.push({
          groupId,
          items: [itemId],
        });
      } else {
        const group = current[index];

        if (group.items.includes(itemId)) {
          const nextItems = group.items.filter((i) => i !== itemId);

          if (nextItems.length === 0) {
            current.splice(index, 1);
          } else {
            current[index] = { ...group, items: nextItems };
          }
        } else {
          current[index] = {
            ...group,
            items: [...group.items, itemId],
          };
        }
      }

      return {
        ...prev,
        [field]: current,
      };
    });
  };

  const flattenPreference = (data: Preference[]) => {
    return data.flatMap((g) => g.items);
  };

  const handleSubmit = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const avatarUrl = await processAvatar(avatar, "temp");

      const interests = flattenPreference(form.interests);
      const activities = flattenPreference(form.activities);

      const phoneNumber = parsePhoneNumberFromString(
        form.phone,
        countryCode as any
      );

      if (!phoneNumber || !phoneNumber.isValid()) {
        alert("เบอร์ไม่ถูกต้อง");
        setLoading(false);
        return;
      }

      const res = await axios.post<any>(`${API_URL}/api/auth/register`, {
        email: authData.email,
        password: authData.password,
        first_name: form.first_name,
        last_name: form.last_name,
        gender: form.gender,
        birth_date: form.birth_date,
        phone: phoneNumber.number,
        avatar: avatarUrl,
        interests,
        activities,
      });

      const { user, token } = res.data;

      router.replace({
        pathname: "/(auth)/success",
        params: {
          token,
          user: JSON.stringify(user),
        },
      });

    } catch (err: any) {
      console.log(err?.response?.data || err);
      alert("สมัครไม่สำเร็จ");
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 1) {
      logout();
      router.replace("/(auth)/login");
    } else {
      setStep(step - 1);
    }
  };

  return (
    <ImageBackground
      source={require("@/assets/backgrounds/bg.png")}
      className="flex-1 px-6 pt-16 pb-10"
    >
      <TouchableOpacity
        onPress={handleBack}
        className="absolute top-14 left-5 bg-white/70 rounded-full p-2 z-10"
      >
        <Ionicons name="chevron-back" size={24} color="#333" />
      </TouchableOpacity>

      {step === 1 && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text className="text-2xl font-semibold font-sans text-center my-2">
            สร้างโปรไฟล์ของคุณ
          </Text>

          <Text className="text-center text-gray-700 font-medium font-sans mb-4">
            รูปโปรไฟล์
          </Text>

          <AvatarPicker avatar={avatar} onPick={handlePickAvatar} />

          <View className="bg-white/90 p-6 rounded-2xl shadow-lg">
            <Text className="text-gray-700 font-medium font-sans mb-1">
              ชื่อจริง
            </Text>
            <TextInput
              value={form.first_name}
              onChangeText={(v) => handleChange("first_name", v)}
              className={`bg-white border rounded-xl px-4 py-3 mb-1 ${
                errors.first_name ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.first_name && (
              <Text className="text-red-500 font-sans text-xs mb-2">
                {errors.first_name}
              </Text>
            )}

            <Text className="text-gray-700 font-medium font-sans mb-1">
              นามสกุล
            </Text>
            <TextInput
              value={form.last_name}
              onChangeText={(v) => handleChange("last_name", v)}
              className={`bg-white border rounded-xl px-4 py-3 mb-1 ${
                errors.last_name ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.last_name && (
              <Text className="text-red-500 font-sans text-xs mb-2">
                {errors.last_name}
              </Text>
            )}

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-gray-700 font-medium font-sans mb-1">
                  เพศ
                </Text>
                <TouchableOpacity
                  onPress={() => setShowGenderModal(true)}
                  className={`bg-white border rounded-xl px-4 py-3 flex-row justify-between items-center ${
                    errors.gender ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <Text className="font-medium font-sans">
                    {form.gender || "เลือกเพศ"}
                  </Text>
                  <Ionicons name="chevron-down" size={18} />
                </TouchableOpacity>
                {errors.gender && (
                  <Text className="text-red-500 text-xs mt-1 font-sans">
                    {errors.gender}
                  </Text>
                )}
              </View>

              <View className="flex-1">
                <Text className="text-gray-700 font-medium font-sans mb-1">
                  วันเกิด
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className={`bg-white border rounded-xl px-4 py-3 flex-row justify-between items-center ${
                    errors.birth_date ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <Text className="font-medium font-sans">
                    {form.birth_date || "เลือกวันเกิด"}
                  </Text>
                  <Ionicons name="calendar-outline" size={18} />
                </TouchableOpacity>
                {errors.birth_date && (
                  <Text className="text-red-500 text-xs mt-1 font-sans">
                    {errors.birth_date}
                  </Text>
                )}
              </View>
            </View>

            <Text className="text-gray-700 font-medium font-sans mb-1">
              เบอร์โทรศัพท์
            </Text>

            <View className="flex-row items-start gap-2 mb-4">
              <View className="flex-row items-center border border-gray-300 rounded-xl px-3 py-2 bg-white">
                <CountryPicker
                  countryCode={countryCode as any}
                  withFlag
                  withCallingCode
                  onSelect={(c) => {
                    setCountryCode(c.cca2);
                    setCallingCode(c.callingCode[0]);
                  }}
                />
                <Text className="font-medium font-sans">+{callingCode}</Text>
              </View>

              <View className="flex-1">
                <TextInput
                  value={form.phone}
                  onChangeText={(v) => handleChange("phone", v)}
                  keyboardType="phone-pad"
                  className={`bg-white border rounded-xl px-4 py-3 ${
                    errors.phone ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.phone && (
                  <Text className="text-red-500 font-sans text-xs mt-1">
                    {errors.phone}
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                if (!validateStep1()) return;
                setStep(2);
              }}
              className="bg-orange-500 py-3 rounded-xl items-center"
            >
              <Text className="text-white font-semibold font-sans text-lg">
                ถัดไป
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {step === 2 && (
        <ChoosePreference
          title="เลือกสไตล์การท่องเที่ยว"
          subtitle="เลือกสิ่งที่คุณสนใจได้หลายข้อ"
          groups={interestGroups}
          selected={form.interests}
          onToggle={(groupId, itemId) =>
            togglePreference("interests", groupId, itemId)
          }
          onNext={() => setStep(3)}
          onSkip={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <ChoosePreference
          title="เลือกกิจกรรมที่คุณชอบ"
          subtitle="เลือกกิจกรรมที่อยากทำระหว่างทริป"
          groups={activityGroups}
          selected={form.activities}
          onToggle={(groupId, itemId) =>
            togglePreference("activities", groupId, itemId)
          }
          onNext={handleSubmit}
          onSkip={handleSubmit}
          loading={loading}
        />
      )}

      {/* MODAL */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_, date) => {
            setShowDatePicker(false);
            if (date) {
              setForm({
                ...form,
                birth_date: date.toISOString().split("T")[0],
              });
            }
          }}
        />
      )}

      <Modal visible={showGenderModal} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-center items-center"
          onPress={() => setShowGenderModal(false)}
        >
          <View className="bg-white w-64 rounded-xl p-4">
            {["ชาย", "หญิง", "อื่นๆ"].map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => {
                  setForm({ ...form, gender: g });
                  setShowGenderModal(false);
                }}
                className="p-3 border-b border-gray-200"
              >
                <Text className="text-center font-medium font-sans">{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </ImageBackground>
  );
}
