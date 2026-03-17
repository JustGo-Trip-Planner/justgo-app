import React, { useMemo, useState } from "react";
import { View, Text, Pressable, Modal, ScrollView, Image, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNotifications } from "@/context/NotificationContext";

const avatarSource = (uri?: string) => {
  const clean = (uri ?? "").trim();
  return clean ? { uri: clean } : require("@/assets/images/default.png");
};

export default function NotificationBell() {
  const { items, unreadCount, loading, refresh, respondInvite, markRead } = useNotifications();
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
      <Pressable onPress={openModal} className="w-11 h-11 items-center justify-center">
        <Ionicons name="notifications-outline" size={32} color="#333" />

        {/* Badge */}
        {unreadCount > 0 && (
          <View
            style={{
              position: "absolute",
              top: 4,
              right: 2,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              paddingHorizontal: 5,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#EF4444",
            }}
          >
            <Text style={{ color: "white", fontSize: 11, fontWeight: "700" }}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </Text>
          </View>
        )}
      </Pressable>

      {/* Popup */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              position: "absolute",
              top: 90,
              right: 16,
              width: 320,
              maxHeight: 420,
              borderRadius: 18,
              overflow: "hidden",
              backgroundColor: "rgba(255,255,255,0.92)",
            }}
          >
            <View style={{ padding: 14, flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827", flex: 1 }}>
                การแจ้งเตือน
              </Text>
              {loading ? <ActivityIndicator size="small" /> : null}
              <Pressable onPress={() => setOpen(false)} style={{ marginLeft: 10 }}>
                <Ionicons name="close" size={22} color="#111827" />
              </Pressable>
            </View>

            <View style={{ height: 1, backgroundColor: "rgba(17,24,39,0.08)" }} />

            <ScrollView contentContainerStyle={{ padding: 12, gap: 10 }}>
              {invites.length === 0 ? (
                <View style={{ paddingVertical: 18, alignItems: "center" }}>
                  <Ionicons name="mail-open-outline" size={34} color="#94A3B8" />
                  <Text style={{ marginTop: 8, color: "#64748B" }}>ยังไม่มีคำเชิญ</Text>
                </View>
              ) : (
                invites.map((n) => {
                  const from = typeof n.fromUserId === "string" ? undefined : n.fromUserId;
                  const group = typeof n.groupId === "string" ? undefined : n.groupId;

                  const statusText =
                    n.status === "unread" || n.status === "read"
                      ? "กำลังเชิญ"
                      : n.status === "accepted"
                      ? "เข้าร่วมแล้ว"
                      : "ปฏิเสธแล้ว";

                  const groupId = group?._id || (typeof n.groupId === "string" ? n.groupId : "");

                  return (
                    <View
                      key={n._id}
                      style={{
                        backgroundColor: "white",
                        borderRadius: 16,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: "rgba(17,24,39,0.08)",
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Image
                          source={avatarSource(from?.avatar)}
                          style={{ width: 36, height: 36, borderRadius: 18 }}
                        />
                        <View style={{ marginLeft: 10, flex: 1 }}>
                          <Text style={{ fontWeight: "700", color: "#111827" }}>
                            เชิญเข้ากลุ่ม {group?.name ?? "กลุ่ม"}
                          </Text>
                          <Text style={{ color: "#6B7280", marginTop: 2 }}>
                            โดย {from?.first_name ?? "เพื่อน"} •{" "}
                            <Text style={{ fontWeight: "700", color: "#F97316" }}>{statusText}</Text>
                          </Text>
                        </View>
                      </View>

                      {/* actions */}
                      {(n.status === "unread" || n.status === "read") && groupId ? (
                        <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                          <Pressable
                            onPress={() => respondInvite(groupId, "accept")}
                            style={{
                              flex: 1,
                              backgroundColor: "#22C55E",
                              paddingVertical: 10,
                              borderRadius: 12,
                              alignItems: "center",
                            }}
                          >
                            <Text style={{ color: "white", fontWeight: "700" }}>ตอบรับ</Text>
                          </Pressable>

                          <Pressable
                            onPress={() => respondInvite(groupId, "decline")}
                            style={{
                              flex: 1,
                              backgroundColor: "#EF4444",
                              paddingVertical: 10,
                              borderRadius: 12,
                              alignItems: "center",
                            }}
                          >
                            <Text style={{ color: "white", fontWeight: "700" }}>ปฏิเสธ</Text>
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