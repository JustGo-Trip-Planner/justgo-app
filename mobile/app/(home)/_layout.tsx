import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Platform, ActivityIndicator } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { NotificationsProvider } from "@/context/NotificationContext";
import { GroupProvider } from "@/context/GroupContext";

export default function TabLayout() {
  const { token, loading } = useAuth();

  const activeColor = "#3262AB";
  const inactiveColor = "#666";

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <GroupProvider>
      <NotificationsProvider>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: true,
            tabBarStyle: {
              backgroundColor: "#fff",
              borderTopWidth: 0,
              height: 70,
              paddingBottom: Platform.OS === "android" ? 10 : 20,
              paddingTop: 8,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontFamily: "Kanit_400Regular",
            },
          }}
          >
          <Tabs.Screen
            name="index"
            options={{
              title: "Home",
              tabBarIcon: ({ focused }) => (
                <Ionicons name="home" size={24} color={focused ? activeColor : inactiveColor} />
              ),
              tabBarActiveTintColor: activeColor,
            }}
            />
          <Tabs.Screen
            name="mytrip"
            options={{
              title: "My Trip",
              tabBarIcon: ({ focused }) => (
                <Ionicons name="location" size={24} color={focused ? activeColor : inactiveColor} />
              ),
              tabBarActiveTintColor: activeColor,
            }}
            />
          <Tabs.Screen
            name="share"
            options={{
              title: "Share",
              tabBarIcon: ({ focused }) => (
                <Ionicons
                name="share-social"
                size={24}
                color={focused ? activeColor : inactiveColor}
                />
              ),
              tabBarActiveTintColor: activeColor,
            }}
            />
          <Tabs.Screen
            name="profile"
            options={{
              title: "Profile",
              tabBarIcon: ({ focused }) => (
                <Ionicons name="person" size={24} color={focused ? activeColor : inactiveColor} />
              ),
              tabBarActiveTintColor: activeColor,
            }}
            />
        </Tabs>
      </NotificationsProvider>
    </GroupProvider>
  );
}