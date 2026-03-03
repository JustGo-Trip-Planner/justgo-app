import React from "react";
import { View, Image } from "react-native";
import NotificationBell from "@/components/notifications/NotificationBell";

export default function AppHeader() {
  return (
    <View
      style={{
        height: 56,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 18,
      }}
    >
      {/* Logo Center */}
      <Image
        source={require("@/assets/icons/logo.png")}
        style={{ height: 40, width: 140 }}
        resizeMode="contain"
      />

      {/* Bell Right */}
      <View style={{ position: "absolute", right: 0, top: 6 }}>
        <NotificationBell />
      </View>
    </View>
  );
}