import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import Constants from "expo-constants";

export type Member = {
  userId:
    | string
    | {
        _id: string;
        first_name?: string;
        avatar?: string;
      };
  name: string;
  avatar?: string;
  status: "pending" | "accepted";
};

type Owner = {
  _id: string;
  name?: string;
  first_name?: string;
  avatar?: string;
};

type SearchUser = {
  _id: string;
  first_name: string;
  avatar?: string;
};

type Props = {
  groupId: string;
  owner: Owner;
  members: Member[];
  isOwner?: boolean;
  onMembersChange?: (members: Member[]) => void;
};

export default function GroupMembersSection({
  groupId,
  owner,
  members,
  isOwner = false,
  onMembersChange,
}: Props) {
  const API_URL = Constants.expoConfig?.extra?.API_URL;

  const [overlayOpen, setOverlayOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);

  const [localMembers, setLocalMembers] = useState<Member[]>(members);
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  useEffect(() => {
    setLocalMembers(members);
  }, [members]);

  const avatarSource = (uri?: string) =>
    uri?.trim()
      ? { uri }
      : require("@/assets/images/default.png");

  const ownerName = owner.name || owner.first_name || "เจ้าของกลุ่ม";

  const memberIdSet = useMemo(() => {
    return new Set(
      localMembers.map((m) =>
        typeof m.userId === "string" ? m.userId : m.userId._id
      )
    );
  }, [localMembers]);

  const filteredResults = useMemo(() => {
    return results.filter((u) => !memberIdSet.has(u._id));
  }, [results, memberIdSet]);

  const updateMembers = (next: Member[]) => {
    setLocalMembers(next);
    onMembersChange?.(next);
  };

  const searchUsers = async (keyword: string) => {
    const q = keyword.trim();

    if (!q) {
      setResults([]);
      return;
    }

    try {
      setSearching(true);

      const requestId = ++requestIdRef.current;

      const res = await axios.get<SearchUser[]>(
        `${API_URL}/api/users/search`,
        { params: { q } }
      );

      if (requestId === requestIdRef.current) {
        setResults(res.data ?? []);
      }
    } catch (err) {
      console.log("search error", err);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => searchUsers(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const inviteUser = async (user: SearchUser) => {
    if (invitingUserId) return;

    const optimisticMember: Member = {
      userId: user._id,
      name: user.first_name,
      avatar: user.avatar ?? "",
      status: "pending",
    };

    const prevMembers = localMembers;
    const nextMembers = [...localMembers, optimisticMember];

    updateMembers(nextMembers);
    setInvitingUserId(user._id);

    try {
      await axios.post(`${API_URL}/api/groups/${groupId}/invite`, {
        userId: user._id,
        name: user.first_name,
        avatar: user.avatar ?? "",
      });

      setSearch("");
      setResults([]);
    } catch (err: any) {
      updateMembers(prevMembers);
      Alert.alert(
        "เชิญเพื่อนไม่สำเร็จ",
        err?.response?.data?.message || "กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setInvitingUserId(null);
    }
  };

  const removeInvite = async (member: Member) => {
    const uid =
      typeof member.userId === "string"
        ? member.userId
        : member.userId?._id;

    if (!uid) return;

    const prevMembers = localMembers;
    const nextMembers = localMembers.filter((m) => {
      const id =
        typeof m.userId === "string"
          ? m.userId
          : m.userId?._id;

      return id !== uid;
    });

    updateMembers(nextMembers);
    setRemovingUserId(uid);

    try {
      await axios.delete(`${API_URL}/api/groups/${groupId}/invite/${uid}`);
    } catch (err: any) {
      updateMembers(prevMembers);

      Alert.alert(
        "ลบคำเชิญไม่สำเร็จ",
        err?.response?.data?.message || "กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setRemovingUserId(null);
    }
  };

  return (
    <View>

      <Text className="text-lg font-sans font-semibold text-gray-800 mb-4">
        สมาชิกในกลุ่ม
      </Text>

      {/* OWNER */}
      <View className="flex-row items-center mb-4">
        <Image
          source={avatarSource(owner.avatar)}
          className="w-12 h-12 rounded-full"
        />

        <Text className="ml-3 font-sans font-semibold text-gray-800">
          {ownerName}
        </Text>

        <Ionicons
          name="ribbon"
          size={18}
          color="#F97316"
          style={{ marginLeft: 6 }}
        />
      </View>

      {/* MEMBERS */}
      {localMembers.map((member, idx) => {
        const memberId =
          typeof member.userId === "string"
            ? member.userId
            : member.userId?._id;

        const isPending = member.status === "pending";
        const isRemoving = removingUserId === memberId;

        return (
          <View
            key={`${memberId}-${idx}`}
            className="flex-row items-center py-3 border-b border-gray-100"
          >

            <Image
              source={avatarSource(member.avatar)}
              className="w-10 h-10 rounded-full"
            />

            <View className="ml-3 flex-1">

              <Text className="font-sans font-medium text-gray-800">
                {member.name}
              </Text>

              <Text className="text-xs text-gray-500 font-sans font-medium">
                {isPending ? "กำลังเชิญ" : "เข้าร่วมแล้ว"}
              </Text>

            </View>

            {isOwner && isPending && (
              <Pressable
                onPress={() => removeInvite(member)}
                disabled={isRemoving}
                className="items-center justify-center"
              >
                {isRemoving ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <Ionicons name="close-circle" size={22} color="#EF4444" />
                )}
              </Pressable>
            )}

          </View>
        );
      })}

      {isOwner && (
        <Pressable
          onPress={() => setOverlayOpen(true)}
          className="mt-4 bg-blue-500 py-3 rounded-2xl flex-row items-center justify-center"
        >
          <Ionicons name="person-add" size={18} color="white" />
          <Text className="ml-2 text-white font-sans font-semibold">
            เชิญเพื่อน
          </Text>
        </Pressable>
      )}

      {/* MODAL */}
      <Modal visible={overlayOpen} animationType="slide" transparent>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-3xl p-5 max-h-[80%]">
            <View className="flex-row items-center mb-4">
              <Pressable onPress={() => setOverlayOpen(false)}>
                <Ionicons name="chevron-down" size={28} />
              </Pressable>

              <Text className="ml-3 text-lg font-sans font-semibold">
                เชิญเพื่อน
              </Text>
            </View>

            <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3 mb-3">
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="ค้นหาเพื่อน"
                className="flex-1 font-sans text-gray-800"
              />

              {searching ? (
                <ActivityIndicator size="small" />
              ) : (
                <Ionicons name="search" size={18} color="#9CA3AF" />
              )}

            </View>

            <ScrollView>
              {filteredResults.map((u) => {
                const isInviting = invitingUserId === u._id;

                return (
                  <Pressable
                    key={u._id}
                    onPress={() => inviteUser(u)}
                    disabled={isInviting}
                    className="flex-row items-center py-3 border-b border-gray-100"
                  >

                    <Image
                      source={avatarSource(u.avatar)}
                      className="w-10 h-10 rounded-full"
                    />

                    <Text className="ml-3 flex-1 font-sans font-medium text-gray-800">
                      {u.first_name}
                    </Text>

                    {isInviting ? (
                      <ActivityIndicator size="small" />
                    ) : (
                      <Text className="text-orange-500 font-medium">
                        เชิญ
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}