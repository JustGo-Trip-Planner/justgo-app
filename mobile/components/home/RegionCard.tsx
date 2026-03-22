import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";

type Province = {
  _id: string;
  name_th: string;
  name_en: string;
  region: string;
  description: string;
  cover_image: string;
};

type Props = {
  provinces: Province[];
};

function RegionCard({ province }: { province: Province }) {
  return (
    <Link
      href={{
        pathname: "/detail_province/[province]",
        params: { province: province._id },
      }}
      asChild
    >
      <TouchableOpacity
        activeOpacity={0.9}
        className="h-36 rounded-2xl overflow-hidden bg-gray-200"
      >
        {/* Image */}
        <Image
          source={{ uri: province.cover_image }}
          className="absolute w-full h-full"
          resizeMode="cover"
        />

        <View className="absolute inset-0 bg-black/25" />

        {/* Content */}
        <View className="flex-1 justify-end p-3">
          {/* Title */}
          <Text
            className="text-white text-lg font-semibold"
            numberOfLines={1}
          >
            {province.name_th}
          </Text>

          {/* Description */}
          <Text
            className="text-white/90 text-xs mt-1 font-sans"
            numberOfLines={1}
          >
            {province.description}
          </Text>

          {/* CTA */}
          <View className="flex-row items-center mt-1">
            <Text className="text-white text-[11px] font-medium mr-1">
              ดูเพิ่มเติม
            </Text>
            <Ionicons name="chevron-forward" size={12} color="#fff" />
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
}

export default function RegionGrid({ provinces }: Props) {
  return (
    <View className="flex-row flex-wrap -mx-2">
      {provinces.map((prov) => (
        <View key={prov._id} className="w-1/2 p-2">
          <RegionCard province={prov} />
        </View>
      ))}
    </View>
  );
}