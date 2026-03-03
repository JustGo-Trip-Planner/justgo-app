import React from "react";
import { ScrollView, View } from "react-native";
import AppHeader from "@/components/layout/AppHeader";

export default function HomeScroll({
  children,
  contentPaddingBottom = 80,
}: {
  children: React.ReactNode;
  contentPaddingBottom?: number;
}) {
  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingBottom: contentPaddingBottom,
      }}
      className="pt-14"
      showsVerticalScrollIndicator={false}
    >
      
      <AppHeader />

      {children}
    </ScrollView>
  );
}