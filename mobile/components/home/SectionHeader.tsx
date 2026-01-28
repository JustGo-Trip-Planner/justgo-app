import { Text, View } from "react-native";

export default function SectionHeader({ title }: { title: string }) {
  return (
    <View className="mt-6 mb-2 px-2">
      <Text className="text-2xl text-gray-800 font-semibold">{title}</Text>
    </View>
  );
}

