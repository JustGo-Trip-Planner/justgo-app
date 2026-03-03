import React from "react";
import { View, Text, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Member = {
  _id?: string;
  avatar?: string;
  first_name?: string;
};

export type Group = {
  _id: string;
  name: string;
  members?: Member[];
};

type Props = {
  group: Group;
  isOwner?: boolean;
  onPressDetail?: (group: Group) => void;
  onPressDelete?: (group: Group) => void;
};

const avatarSource = (uri?: string) => {
  const clean = (uri ?? "").trim();
  return clean ? { uri: clean } : require("@/assets/images/default.png");
};

export default function GroupCard({ group, isOwner, onPressDetail, onPressDelete }: Props) {
  const members = group.members ?? [];
  const showAvatars = members.slice(0, 3);
  const extraCount = Math.max(0, members.length - showAvatars.length);

  return (
    <View className="bg-white/80 rounded-3xl p-5 mr-4 w-[320px]">
      {/* Avatars row */}
      <View className="flex-row items-center">
        <View className="flex-row -space-x-3">
          {showAvatars.map((m, idx) => (
            <Image
              key={m._id ?? `${group._id}-mem-${idx}`}
              source={avatarSource(m.avatar)}
              className="w-12 h-12 rounded-full border-2 border-white"
            />
          ))}
        </View>

        {extraCount > 0 && (
          <Text className="ml-3 text-lg font-medium font-sans text-blue-800">
            +{extraCount} คน
          </Text>
        )}
      </View>

      {/* Group name */}
      <Text
        numberOfLines={2}
        className="mt-4 text-2xl font-semibold font-sans text-gray-900"
      >
        {group.name}
      </Text>

      {/* Actions */}
      <View className="mt-5 flex-row items-center justify-between">
        <Pressable
          onPress={() => onPressDetail?.(group)}
          className="bg-orange-300/70 px-5 py-3 rounded-full flex-row items-center"
          hitSlop={8}
        >
          <Ionicons name="eye-outline" size={18} color="#fff" />
          <Text className="ml-2 text-white font-medium font-sans text-base">
            ดูรายละเอียด
          </Text>
        </Pressable>

        {isOwner && (
          <Pressable
            onPress={() => onPressDelete?.(group)}
            className="p-2"
          >
            <Ionicons name="trash-outline" size={28} color="#EF4444" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
