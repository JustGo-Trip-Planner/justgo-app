import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import axios from "axios";

import DateTimePicker from "@react-native-community/datetimepicker";
import CountryPicker from "react-native-country-picker-modal";
import { parsePhoneNumberFromString } from "libphonenumber-js";

import { useAuth } from "@/context/AuthContext";
import AvatarPicker from "@/components/avatar/AvatarPicker";
import { pickAvatar, processAvatar } from "@/components/avatar/upload";

export default function EditProfileScreen() {
  const { user, token, login } = useAuth();
  const router = useRouter();
  const API_URL = Constants.expoConfig?.extra?.API_URL;

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [avatar, setAvatar] = useState("");

  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [countryCode, setCountryCode] = useState("TH");
  const [callingCode, setCallingCode] = useState("66");

  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    gender: "",
    birth_date: "",
    phone: "",
  });

  const [originalForm, setOriginalForm] = useState(form);
  const [birthDateDisplay, setBirthDateDisplay] = useState("");

  // ---------------- INIT ----------------
  useEffect(() => {
    if (!user) return;

    setAvatar(user.avatar || "");

    let localPhone = "";
    let code = "66";
    let country = "TH";

    if (user.phone) {
      const parsed = parsePhoneNumberFromString(user.phone);
      if (parsed) {
        localPhone = parsed.nationalNumber;
        code = parsed.countryCallingCode;
        country = parsed.country || "TH";
      }
    }

    const initial = {
      email: user.email || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      gender: user.gender || "",
      birth_date: user.birth_date?.split("T")[0] || "",
      phone: localPhone,
    };

    setForm(initial);
    setOriginalForm(initial);

    setCountryCode(country);
    setCallingCode(code);

    setBirthDateDisplay(formatDate(user.birth_date));
  }, [user]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-GB");
  };

  // ---------------- ACTIONS ----------------
  const handlePickAvatar = async () => {
    if (!isEditing) return;
    const uri = await pickAvatar();
    if (uri) setAvatar(uri);
  };

  const handleCancel = () => {
    setForm(originalForm);
    setIsEditing(false);
  };

  const handleUpdate = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const avatarUrl = await processAvatar(avatar, user.id);

      const phoneNumber = parsePhoneNumberFromString(
        form.phone,
        countryCode as any
      );

      if (!phoneNumber || !phoneNumber.isValid()) {
        Alert.alert("เบอร์ไม่ถูกต้อง");
        setLoading(false);
        return;
      }

      const { email, ...safeForm } = form;

      const res = await axios.put(
        `${API_URL}/api/users/${user.id}`,
        {
          ...safeForm,
          avatar: avatarUrl,
          phone: phoneNumber.number,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await login(
        token!,
        { ...res.data.user, id: res.data.user._id },
        true
      );

      Alert.alert("สำเร็จ", "อัปเดตเรียบร้อย");
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert("ผิดพลาด", "อัปเดตไม่ได้");
    } finally {
      setLoading(false);
    }
  };

  const fieldContainer = (editable: boolean) =>
    `flex-row items-center px-4 py-3 rounded-xl ${
      editable ? "bg-white border border-gray-200" : "bg-gray-100"
    }`;

  return (
    <View className="flex-1 bg-gray-50">

      <ScrollView 
        className="px-5 pt-12" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 20,
        }}
      >

        {/* HEADER */}
        <View className="flex-row justify-between items-center pt-4 mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} />
          </TouchableOpacity>

          <Text className="text-xl font-semibold">จัดการโปรไฟล์</Text>

          {!isEditing ? (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Ionicons name="create-outline" size={30} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 30 }} />
          )}
        </View>

        {/* AVATAR */}
        <View className="items-center mb-6">
          <AvatarPicker avatar={avatar} onPick={handlePickAvatar} />
          {isEditing && (
            <Text className="text-sm font-sans text-gray-500">
              แตะเพื่อเปลี่ยนรูป
            </Text>
          )}
        </View>

        {/* FLOATING CARD */}
        <View className="bg-white rounded-3xl px-5 py-6 shadow-md">

          {/* EMAIL */}
          <View className="mb-5">
            <Text className="font-sans text-gray-400 mb-1">อีเมล</Text>
            <View className="flex-row items-center bg-gray-100 px-4 py-3 rounded-xl">
              <Ionicons name="mail-outline" size={16} color="#9CA3AF" />
              <Text className="ml-2 flex-1 font-sans">
                {form.email}
              </Text>
              <Ionicons name="lock-closed-outline" size={14} color="#9CA3AF" />
            </View>
          </View>

          {/* FIRST NAME */}
          <Field
            label="ชื่อจริง"
            icon="person-outline"
            value={form.first_name}
            editable={isEditing}
            onChange={(v) => setForm({ ...form, first_name: v })}
          />

          {/* LAST NAME */}
          <Field
            label="นามสกุล"
            icon="person-outline"
            value={form.last_name}
            editable={isEditing}
            onChange={(v) => setForm({ ...form, last_name: v })}
          />

          <View className="flex-row gap-3 mb-5">

            {/* GENDER */}
            <TouchableOpacity
              disabled={!isEditing}
              onPress={() => setShowGenderModal(true)}
              className="flex-1"
            >
              <Text className="font-sans text-gray-400 mb-1">เพศ</Text>

              <View className={fieldContainer(isEditing)}>
                <Ionicons name="male-female-outline" size={16} color="#9CA3AF" />

                <Text className="ml-2 font-sans flex-1">
                  {form.gender || "เลือกเพศ"}
                </Text>

                {isEditing && (
                  <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                )}
              </View>
            </TouchableOpacity>

            {/* BIRTH DATE */}
            <TouchableOpacity
              disabled={!isEditing}
              onPress={() => setShowDatePicker(true)}
              className="flex-1"
            >
              <Text className="font-sans text-gray-400 mb-1">วันเกิด</Text>

              <View className={fieldContainer(isEditing)}>
                <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />

                <Text className="ml-2 font-sans flex-1">
                  {birthDateDisplay || "เลือกวันเกิด"}
                </Text>
              </View>
            </TouchableOpacity>

          </View>

          {/* PHONE */}
          <View className="mb-2">
            <Text className="font-sans text-gray-400 mb-1">เบอร์โทร</Text>
            <View className="flex-row gap-2">
              <View className={fieldContainer(isEditing)}>
                <CountryPicker
                  countryCode={countryCode as any}
                  withFlag
                  withCallingCode
                  onSelect={(c) => {
                    if (!isEditing) return;
                    setCountryCode(c.cca2);
                    setCallingCode(c.callingCode[0]);
                  }}
                />
                <Text>+{callingCode}</Text>
              </View>

              <TextInput
                value={form.phone}
                editable={isEditing}
                onChangeText={(v) => setForm({ ...form, phone: v })}
                className={`flex-1 font-sans text-lg rounded-xl px-4 py-3 ${
                  isEditing
                    ? "bg-white border border-gray-200"
                    : "bg-gray-100"
                }`}
              />
            </View>
          </View>
        </View>

        {/* ACTIONS */}
        {isEditing && (
          <View className="flex-row gap-3 mt-6 mb-10">
            <TouchableOpacity
              onPress={handleCancel}
              className="flex-1 py-4 rounded-xl bg-gray-200 items-center"
            >
              <Text className="font-medium">ยกเลิก</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleUpdate}
              disabled={loading}
              className={`flex-1 py-4 rounded-xl items-center ${
                loading ? "bg-gray-400" : "bg-sky-700"
              }`}
            >
              <Text className="text-white font-medium">
                {loading ? "กำลังบันทึก..." : "บันทึก"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* DATE PICKER */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_, date) => {
            setShowDatePicker(false);
            if (date) {
              const iso = date.toISOString().split("T")[0];
              setForm({ ...form, birth_date: iso });
              setBirthDateDisplay(formatDate(iso));
            }
          }}
        />
      )}

      {/* GENDER MODAL */}
      <Modal visible={showGenderModal} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-center items-center"
          onPress={() => setShowGenderModal(false)}
        >
          <View className="bg-white w-72 rounded-2xl p-4">
            {["ชาย", "หญิง", "อื่นๆ"].map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => {
                  setForm({ ...form, gender: g });
                  setShowGenderModal(false);
                }}
                className="py-3 border-b border-gray-100"
              >
                <Text className="text-center font-sans">{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function Field({
  label,
  icon,
  value,
  editable,
  onChange,
}: any) {
  return (
    <View className="mb-5">
      <Text className="font-sans text-gray-400 mb-1">{label}</Text>
      <View className={`flex-row items-center px-4 py-0.5 rounded-xl ${
        editable ? "bg-white border border-gray-200" : "bg-gray-100"
      }`}>
        <Ionicons name={icon} size={16} color="#9CA3AF" />
        <TextInput
          value={value}
          editable={editable}
          onChangeText={onChange}
          className="ml-2 font-sans flex-1"
        />
      </View>
    </View>
  );
}