import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNotifications } from "@/context/NotificationContext";

const avatarSource = (uri?: string) => {
  const clean = (uri ?? "").trim();
  return clean ? { uri: clean } : require("@/assets/images/default.png");
};

export default function NotificationBell() {
  const { items, unreadCount, loading, refresh, respondInvite, markRead } =
    useNotifications();
  const [open, setOpen] = useState(false);

  const invites = useMemo(
    () => items.filter((n) => n.type === "group_invite"),
    [items]
  );

  const openModal = async () => {
    setOpen(true);

    const latest = await refresh();
    for (const n of latest) {
      if (n.type === "group_invite" && n.status === "unread") {
        markRead(n._id);
      }
    }
  };

  return (
    <>
      {/* Bell */}
      <Pressable
        onPress={openModal}
        className="w-12 h-12 items-center justify-center"
      >
        <Ionicons name="notifications-outline" size={32} color="#111" />

        {unreadCount > 0 && (
          <View className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 items-center justify-center">
            <Text className="text-white text-[10px] font-bold">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Text>
          </View>
        )}
      </Pressable>

      {/* Modal */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        {/* Background Blur */}
        <Pressable
          onPress={() => setOpen(false)}
          className="flex-1 bg-black/30"
        >
          {/* Glass Container */}
          <Pressable
            onPress={() => {}}
            className="absolute top-14 right-4 w-80 max-h-[420px] rounded-3xl overflow-hidden bg-white/90 backdrop-blur-xl"
          >
            {/* Header */}
            <View className="flex-row items-center px-4 py-3">
              <Text className="text-xl font-semibold text-gray-900 flex-1">
                การแจ้งเตือน
              </Text>

              {loading && <ActivityIndicator size="small" />}

              <Pressable onPress={() => setOpen(false)}>
                <Ionicons name="close" size={20} color="#111" />
              </Pressable>
            </View>

            <View className="h-[1px] bg-black/5" />

            {/* Content */}
            <ScrollView className="px-3 py-2">
              {invites.length === 0 ? (
                <View className="py-10 items-center">
                  <Ionicons
                    name="notifications-off-outline"
                    size={30}
                    color="#94A3B8"
                  />
                  <Text className="text-gray-400 mt-2 font-sans">
                    ไม่มีการแจ้งเตือน
                  </Text>
                </View>
              ) : (
                invites.map((n) => {
                  const from = typeof n.fromUserId === "string" ? undefined : n.fromUserId;
                  const group = typeof n.groupId === "string" ? undefined : n.groupId;
                  const statusText = n.status === "unread" || n.status === "read" ? "กำลังเชิญ" : n.status === "accepted" ? "เข้าร่วมแล้ว" : "ปฏิเสธแล้ว";
                  const groupId = group?._id || (typeof n.groupId === "string" ? n.groupId : "");

                  return (
                    <View
                      key={n._id}
                      className="mb-3 p-3 rounded-2xl bg-white/70 backdrop-blur-md"
                    >
                      {/* Top */}
                      <View className="flex-row items-center">
                        <Image
                          source={avatarSource(from?.avatar)}
                          className="w-12 h-12 rounded-full"
                        />

                        <View className="ml-3 flex-1">
                          <Text className="text-gray-900 font-medium text-lg">
                            {group?.name ?? "กลุ่ม"}
                          </Text>

                          <Text className="text-gray-500 text-sm mt-1">
                            {from?.first_name ?? "เพื่อน"} •{" "}
                            <Text className="text-orange-500 font-medium">
                              {statusText}
                            </Text>
                          </Text>
                        </View>
                      </View>

                      {/* Actions */}
                      {(n.status === "unread" || n.status === "read") &&
                      groupId ? (
                        <View className="flex-row mt-3 gap-2">
                          <Pressable
                            onPress={() =>
                              respondInvite(groupId, "accept")
                            }
                            className="flex-1 py-2 rounded-xl bg-green-500/90 items-center"
                          >
                            <Text className="text-white text-sm font-medium">
                              รับ
                            </Text>
                          </Pressable>

                          <Pressable
                            onPress={() =>
                              respondInvite(groupId, "decline")
                            }
                            className="flex-1 py-2 rounded-xl bg-gray-200 items-center"
                          >
                            <Text className="text-gray-700 text-sm font-medium">
                              ปฏิเสธ
                            </Text>
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                  );
                })
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}