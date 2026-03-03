import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import Constants from "expo-constants";

type SearchUser = {
  _id: string;
  first_name: string;
  avatar?: string;
};

export default function CreateGroupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const API_URL = Constants.expoConfig?.extra?.API_URL;

  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<SearchUser[]>([]);
  const [creating, setCreating] = useState(false);
  const [searching, setSearching] = useState(false);

  const requestIdRef = useRef(0);

  const searchUsers = async (keyword: string) => {
    const q = keyword.trim();
    if (!q) {
      setResults([]);
      return;
    }
    
    try {
      setSearching(true);
      const currentRequestId = ++requestIdRef.current;
      
      const res = await axios.get<SearchUser[]>(`${API_URL}/api/users/search`, {
        params: { q },
      });
      
      if (currentRequestId === requestIdRef.current) {
        setResults(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.log("search error", err);
    } finally {
      setSearching(false);
    }
  };
  
  useEffect(() => {
    const delay = setTimeout(() => searchUsers(search), 250);
    return () => clearTimeout(delay);
  }, [search]);
  
  const addMember = (member: SearchUser) => {
    if (selectedMembers.some((m) => m._id === member._id)) return;
    setSelectedMembers((prev) => [...prev, member]);
    setSearch("");
    setResults([]);
  };
  
  const removeMember = (id: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m._id !== id));
  };
  
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("กรุณากรอกชื่อกลุ่ม");
      return;
    }
    if (!user) return;
    
    try {
      setCreating(true);
      
      const payload = {
        name: groupName.trim(),
        members: selectedMembers.map((m) => ({
          userId: m._id,
          name: m.first_name,
          avatar: m.avatar ?? "",
        })),
      };

      await axios.post(`${API_URL}/api/groups`, payload);

      router.replace("/share");
    } catch (err) {
      Alert.alert("สร้างกลุ่มไม่สำเร็จ");
    } finally {
      setCreating(false);
    }
  };

  const avatarSource = (uri?: string) => {
    const clean = (uri ?? "").trim();
    return clean ? { uri: clean } : require("@/assets/images/default.png");
  };

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
            onPress={() => router.replace("/share")}
            style={{
              position: "absolute",
              left: 0,
              zIndex: 10,
            }}
            className="bg-white/80 p-2 rounded-full"
          >
            <Ionicons name="chevron-back" size={24} color="#111827" />
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
          <Text className="text-center text-2xl font-semibold font-sans text-gray-800 mb-6">
            สร้างกลุ่ม
          </Text>

          {/* Group Name */}
          <Text className="text-gray-600 font-medium font-sans mb-2">
            ชื่อกลุ่ม
          </Text>
          <TextInput
            value={groupName}
            onChangeText={setGroupName}
            placeholder="กรอกชื่อกลุ่ม"
            placeholderTextColor="#9CA3AF"
            className="bg-white rounded-2xl px-4 py-3 mb-6 font-sans text-gray-800"
          />

          {/* Search */}
          <Text className="text-gray-600 font-medium font-sans mb-2">
            ค้นหาเพื่อน
          </Text>
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 mb-2">
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="ค้นหาเพื่อน"
              placeholderTextColor="#9CA3AF"
              className="flex-1 font-sans text-gray-800"
            />
            {searching ? (
              <ActivityIndicator size="small" />
            ) : (
              <Ionicons name="search" size={18} color="#9CA3AF" />
            )}
          </View>

          {/* Dropdown */}
          {search.trim().length > 0 && results.length > 0 && (
            <View className="bg-white rounded-2xl mb-4 max-h-60 overflow-hidden">
              <ScrollView keyboardShouldPersistTaps="handled">
                {results
                  .filter((u) => !selectedMembers.some((m) => m._id === u._id))
                  .map((u) => (
                    <Pressable
                      key={u._id}
                      onPress={() => addMember(u)}
                      className="flex-row items-center px-4 py-3 border-b border-gray-100"
                    >
                      <Image
                        className="w-9 h-9 rounded-full"
                        source={avatarSource(u.avatar)}
                      />
                      <Text className="ml-3 flex-1 font-medium font-sans text-gray-800">
                        {u.first_name}
                      </Text>
                      <Text className="text-orange-500 font-medium font-sans">
                        เชิญ
                      </Text>
                    </Pressable>
                  ))}
              </ScrollView>
            </View>
          )}

          {/* Selected Members */}
          {selectedMembers.length > 0 && (
            <>
              <Text className="mt-2 mb-2 font-medium font-sans text-gray-600">
                สมาชิกที่เชิญแล้ว
              </Text>

              {selectedMembers.map((member) => (
                <View key={member._id} className="flex-row items-center py-3">
                  <Image
                    className="w-10 h-10 rounded-full"
                    source={avatarSource(member.avatar)}
                  />
                  <Text className="ml-3 flex-1 font-medium font-sans text-gray-800">
                    {member.first_name}
                  </Text>
                  <Pressable onPress={() => removeMember(member._id)} hitSlop={10}>
                    <Ionicons name="trash-outline" size={22} color="#EF4444" />
                  </Pressable>
                </View>
              ))}
            </>
          )}

          {/* Button */}
          <Pressable
            onPress={handleCreateGroup}
            disabled={creating}
            className="bg-orange-500 py-4 rounded-2xl mt-6 items-center"
          >
            {creating ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold font-sans text-base">
                สร้างกลุ่ม
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </ImageBackground>
  );
}
