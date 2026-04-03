import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";

type Props = {
  id: string;
  name: string;
  desc: string;
  image: { uri: string };
};

export default function DestinationCard({ id, name, desc, image }: Props) {
  return (
    <Link
      href={{
        pathname: "/detail_province/[province]",
        params: { province: id },
      }}
      asChild
    >
      <TouchableOpacity
        activeOpacity={0.9}
        className="w-64 h-40 rounded-2xl overflow-hidden mr-2 bg-gray-200"
      >
        {/* Image */}
        <Image
          source={image}
          className="absolute w-full h-full"
          resizeMode="cover"
        />

        <View className="absolute inset-0 justify-end">
          <View className="h-full w-full bg-black/30" />
        </View>

        {/* Content */}
        <View className="flex-1 justify-end p-4">
          {/* Title */}
          <Text className="text-white text-lg font-semibold">
            {name}
          </Text>

          {/* Description */}
          <Text
            className="text-white/90 text-xs mt-1 font-sans"
            numberOfLines={1}
          >
            {desc}
          </Text>

          {/* CTA inline */}
          <View className="flex-row items-center mt-2">
            <Text className="text-white text-xs font-medium mr-1">
              ดูเพิ่มเติม
            </Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color="#fff"
            />
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
}