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
  finalizedPlanId?: {
    trip_title?: string;
  };

  voteProgress?: {
    voted: number;
    total: number;
  };
};

type Props = {
  group: Group;
  isOwner?: boolean;
  onPressDetail?: (group: Group) => void;
  onPressDelete?: (group: Group) => void;
};

const avatarSource = (uri?: string) => {
  const clean = (uri ?? "").trim();
  return clean
    ? { uri }
    : require("@/assets/images/default.png");
};

export default function GroupCard({
  group,
  isOwner,
  onPressDetail,
  onPressDelete,
}: Props) {

  const members = group.members ?? [];
  const showAvatars = members.slice(0, 3);
  const extraCount = Math.max(0, members.length - showAvatars.length);

  const voted = group.voteProgress?.voted ?? 0;
  const total = group.voteProgress?.total ?? members.length;

  const percent = total === 0 ? 0 : voted / total;

  const hasPlan = !!group.finalizedPlanId?.trip_title;

  return (

    <View className="
      bg-white
      border border-gray-100
      rounded-3xl
      p-5
      mr-4
      w-[320px]
      shadow-sm
    ">

      {/* PLAN STATUS */}

      <View className="flex-row items-center mb-3">

        <Ionicons
          name={hasPlan ? "checkmark-circle" : "alert-circle"}
          size={16}
          color={hasPlan ? "#22C55E" : "#F59E0B"}
        />

        <Text className="ml-2 text-xs font-medium text-gray-700">

          {hasPlan
            ? `แชร์แผน: ${group.finalizedPlanId?.trip_title}`
            : "ยังไม่ได้แชร์แผน"}

        </Text>

      </View>


      {/* VOTE PROGRESS */}

      <View className="mb-3">

        <View className="flex-row justify-between items-center mb-1">

          <Text className="text-xs text-gray-600 font-medium">
            สถานะโหวต
          </Text>

          <Text className="text-xs text-gray-600 font-medium">
            {voted} / {total} คน
          </Text>

        </View>

        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">

          <View
            style={{ width: `${percent * 100}%` }}
            className="h-2 bg-sky-700"
          />

        </View>

      </View>


      {/* MEMBERS */}

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
          <Text className="ml-3 text-base font-medium text-gray-800">
            +{extraCount}
          </Text>
        )}

      </View>


      {/* GROUP NAME */}

      <Text
        numberOfLines={2}
        className="mt-4 text-2xl font-semibold text-gray-900"
      >
        {group.name}
      </Text>


      {/* ACTIONS */}

      <View className="mt-5 flex-row items-center justify-between">

        <Pressable
          onPress={() => onPressDetail?.(group)}
          className="bg-orange-400 px-5 py-3 rounded-full flex-row items-center"
        >

          <Ionicons
            name="eye-outline"
            size={18}
            color="#fff"
          />

          <Text className="ml-2 text-white font-medium text-base">
            ดูรายละเอียด
          </Text>

        </Pressable>

        {isOwner && (
          <Pressable
            onPress={() => onPressDelete?.(group)}
            className="p-2"
          >
            <Ionicons
              name="trash-outline"
              size={22}
              color="#EF4444"
            />
          </Pressable>
        )}

      </View>

    </View>

  );
}