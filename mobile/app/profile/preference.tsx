import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, Pressable, ActivityIndicator
} from "react-native";

import { useRouter } from "expo-router";
import axios from "axios";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/context/AuthContext";

import PreferenceCard from "@/components/preference/PreferenceCard";
import { interestGroups } from "@/constants/interestData";
import { activityGroups } from "@/constants/activityData";

export default function PreferenceScreen(){
  const { user, token, refreshMe } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<"interest" | "activity">("interest");
  const [interests, setInterests] = useState<string[]>([]);
  const [activities, setActivities] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);

  const API_URL = Constants.expoConfig?.extra?.API_URL;

  useEffect(() => {
    if (user) {
      setInterests(user.interests ?? []);
      setActivities(user.activities ?? []);
    }
  },[user]);
  
  const toggle = (type: "interest" | "activity", id: string) => {

    if (type==="interest") {
      setInterests(prev =>
        prev.includes(id)
          ? prev.filter(i => i !== id)
          : [...prev,id]
      );
    } else {
      setActivities(prev =>
        prev.includes(id)
          ? prev.filter(i => i !== id)
          : [...prev,id]
      );
    }
  };

  const handleSave = async() => {
    try {
      setLoading(true);

      await axios.put(
        `${API_URL}/api/users/${user?.id}`,
        {
          interests,
          activities
        },
        {
          headers:{Authorization:`Bearer ${token}`}
        }
      );

      await refreshMe();
      router.back();
    } catch {
      alert("บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (

    <View className="flex-1 bg-gray-50 pt-14 px-5">

      {/* HEADER */}
      <View className="flex-row items-center mb-4">
        <Pressable onPress={() => router.back()} className="mr-3">
          <Ionicons name="chevron-back" size={24}/>
        </Pressable>

        <Text className="text-lg font-semibold font-sans">
          รูปแบบการเดินทาง
        </Text>
      </View>

      {/* TAB */}
      <View className="flex-row bg-white rounded-full p-1 mb-4">

        <Pressable
          onPress={() => setTab("interest")}
          className={`flex-1 py-2 rounded-full items-center ${
            tab === "interest" ? "bg-orange-400":""
          }`}
        >
          <Text className={`text-base font-medium ${
            tab === "interest"?"text-white":"text-gray-500"
          }`}>
            ประเภท
          </Text>
        </Pressable>

        <Pressable
          onPress={()=> setTab("activity")}
          className={`flex-1 py-2 rounded-full items-center ${
            tab==="activity" ? "bg-orange-400":""
          }`}
        >
          <Text className={`text-base font-medium ${
            tab==="activity"?"text-white":"text-gray-500"
          }`}>
            กิจกรรม
          </Text>
        </Pressable>

      </View>

      {/* LIST */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {(tab === "interest" ? interestGroups : activityGroups).map(group => (

          <PreferenceCard
            key={group.id}
            title={group.title}
            image={group.image}
            items={group.items}
            selected={tab === "interest"?interests:activities}
            onToggle={(id) => toggle(tab,id)}
          />

        ))}
      </ScrollView>

      {/* SAVE */}
      <View className="absolute bottom-6 left-5 right-5">
          <Pressable
            onPress={handleSave}
            disabled={loading}
            className={`mx-4 py-4 rounded-xl items-center flex-row justify-center ${
              loading ? "bg-gray-300" : "bg-orange-500"
            }`}
            style={({ pressed }) => ({
              transform: [{ scale: pressed && !loading ? 0.98 : 1 }],
            })}
          >
            {loading ? (
              <>
                <ActivityIndicator color="white" />
                <Text className="text-white font-medium ml-2">
                  กำลังบันทึก...
                </Text>
              </>
            ) : (
              <>
                <Text className="text-white font-semibold font-sans ml-2">
                  บันทึกการตั้งค่า
                </Text>
              </>
            )}
          </Pressable>
      </View>
      
    </View>
  );
}
