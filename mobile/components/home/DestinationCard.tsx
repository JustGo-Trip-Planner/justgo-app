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
    <TouchableOpacity className="bg-white/80 rounded-2xl shadow-md overflow-hidden mb-2 w-64 mr-2">
      <Image source={image} className="h-36 w-full" resizeMode="cover" />
      <View className="p-4 relative">
        <Text className="text-lg text-gray-800 mb-1 font-semibold">
          {name}
        </Text>
        <Text className="text-sm text-gray-600 font-sans" numberOfLines={2}>
          {desc}
        </Text>
        <View className="absolute right-3 top-3 flex-row space-x-2">
          <TouchableOpacity>
            <Ionicons name="add-circle" size={22} color="#f97316" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="search" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
    </Link>
  );
}
