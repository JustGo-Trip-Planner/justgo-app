import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  Image, ScrollView, Alert, Platform, Modal
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import axios from "axios";
import DateTimePicker from "@react-native-community/datetimepicker";
import CountryPicker from "react-native-country-picker-modal";
import * as ImageManipulator from "expo-image-manipulator";
import { parsePhoneNumberFromString } from "libphonenumber-js";

import { useAuth } from "@/context/AuthContext";

type CloudinarySignature = {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  public_id: string;
};

export default function EditProfileScreen() {
  const { user, token, login } = useAuth();
  const router = useRouter();
  const API_URL = Constants.expoConfig?.extra?.API_URL;
  
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState("");
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [birthDateDisplay, setBirthDateDisplay] = useState("");

  const [countryCode, setCountryCode] = useState("TH");
  const [callingCode, setCallingCode] = useState("66");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    gender: "",
    birth_date: "",
    phone: "",
  });

  useEffect(() => {
    if (user) {
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

      setCountryCode(country);
      setCallingCode(code);

      setForm({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        gender: user.gender || "",
        birth_date: user.birth_date?.split("T")[0] || "",
        phone: localPhone,
      });

      setBirthDateDisplay(formatDate(user.birth_date));
    }
  }, [user]);

  const formatDate = (dateStr?: string) => {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-GB"); 
    };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      let uri = result.assets[0].uri;
      uri = await compressImage(uri);
      setAvatar(uri);
    }
  };

  const compressImage = async (uri: string) => {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [
        { resize: { width: 500 } },
      ],
      {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return result.uri;
  };

  const getSignature = async (): Promise<CloudinarySignature> => {
    const res = await axios.get<CloudinarySignature>(
      `${API_URL}/api/uploads/signature?userId=${user?.id}`
    );
    return res.data;
  };

  const uploadToCloudinary = async (imageUri: string) => {
    const { timestamp, signature, apiKey, cloudName, public_id } =
      await getSignature();

    const data = new FormData();

    const filename = imageUri.split("/").pop() || "avatar.jpg";

    data.append("file", {
      uri: imageUri,
      name: filename,
      type: "image/jpeg",
    } as any);

    data.append("api_key", apiKey);
    data.append("timestamp", String(timestamp));
    data.append("signature", signature);

    data.append("folder", "justgo/avatar");
    data.append("public_id", public_id);
    data.append("overwrite", "true");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: data,
      }
    );

    const json = await res.json();

    if (!json.secure_url) {
      console.error(json);
      throw new Error("Upload failed");
    }

    return json.secure_url;
  };

  const handleUpdate = async () => {
    try {
      if (!user?.id) {
        Alert.alert("Error", "User not found");
        return;
      }

      setLoading(true);

      let avatarUrl = avatar;

      if (avatar && !avatar.startsWith("http")) {
        avatarUrl = await uploadToCloudinary(avatar);
      }

      const phoneNumber = parsePhoneNumberFromString(
        form.phone,
        countryCode as any
      );

      if (!phoneNumber || !phoneNumber.isValid()) {
        Alert.alert("เบอร์ไม่ถูกต้อง");
        return;
      }

      const res = await axios.put<any>(
        `${API_URL}/api/users/${user.id}`,
        {
          ...form,
          avatar: avatarUrl,
          phone: phoneNumber.number,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await login(token!, {
        ...res.data.user,
        id: res.data.user._id,
      }, true);

      Alert.alert("สำเร็จ", "อัปเดตเรียบร้อย");
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert("ผิดพลาด", "อัปเดตไม่ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 px-4 pt-12">

      {/* HEADER */}
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} />
        </TouchableOpacity>

        <Text className="ml-4 text-lg font-semibold">
          แก้ไขโปรไฟล์
        </Text>
      </View>

      {/* AVATAR */}
      <View className="items-center mb-6">
        <TouchableOpacity onPress={pickImage}>
          <Image
            source={
              avatar
                ? { uri: avatar }
                : require("@/assets/images/avatar.png")
            }
            className="w-28 h-28 rounded-full"
          />

          <View className="absolute bottom-0 right-0 bg-black p-2 rounded-full">
            <Ionicons name="camera-outline" size={14} color="white" />
          </View>
        </TouchableOpacity>
      </View>

      {/* CARD */}
      <View className="bg-white rounded-2xl p-4 shadow-sm">

        {/* FIRST NAME */}
        <Input
          label="Name"
          value={form.first_name}
          onChange={(v) => setForm({ ...form, first_name: v })}
        />

        {/* LAST NAME */}
        <Input
          label="Last Name"
          value={form.last_name}
          onChange={(v) => setForm({ ...form, last_name: v })}
        />

        {/* GENDER */}
        <TouchableOpacity
          onPress={() => setShowGenderModal(true)}
          className="mb-4"
        >
          <Text className="text-gray-500 mb-1">Gender</Text>
          <View className="border border-gray-300 rounded-xl px-4 py-3 flex-row justify-between items-center">
            <Text className={form.gender ? "text-black" : "text-gray-400"}>
              {form.gender || "Select gender"}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#999" />
          </View>
        </TouchableOpacity>

        {/* DOB */}
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          className="mb-4"
        >
          <Text className="text-gray-500 mb-1">Date of Birth</Text>
          <View className="border border-gray-300 rounded-xl px-4 py-3">
            <Text className={birthDateDisplay ? "text-black" : "text-gray-400"}>
              {birthDateDisplay || "Select date"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* PHONE */}
        <Text className="text-gray-500 mb-1">Phone Number</Text>
        <View className="flex-row items-center gap-2 mb-4">

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
            <Text className="ml-1">+{callingCode}</Text>
          </View>

          <TextInput
            value={form.phone}
            keyboardType="phone-pad"
            onChangeText={(v) => setForm({ ...form, phone: v })}
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3"
          />
        </View>

      </View>

      {/* SAVE */}
      <TouchableOpacity
        disabled={loading}
        onPress={handleUpdate}
        className={`py-4 rounded-xl mt-6 items-center ${
          loading ? "bg-gray-400" : "bg-sky-700"
        }`}
      >
        <Text className="text-white font-semibold">
          {loading ? "กำลังอัปโหลด..." : "บันทึก"}
        </Text>
      </TouchableOpacity>

      {/* DATE PICKER */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(e, date) => {
            setShowDatePicker(false);
            if (date) {
              const iso = date.toISOString().split("T")[0];
              setForm({
                ...form,
                birth_date: iso,
              });
              setBirthDateDisplay(formatDate(date.toISOString()));
            }
          }}
        />
      )}

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
                <Text className="text-center text-base">{g}</Text>
              </TouchableOpacity>
            ))}

          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View className="mb-4">
      <Text className="text-gray-500 mb-1">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        className="border border-gray-300 rounded-xl px-4 py-3"
      />
    </View>
  );
}