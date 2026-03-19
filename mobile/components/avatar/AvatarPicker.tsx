import { View, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  avatar?: string;
  onPick: () => void;
};

export default function AvatarPicker({ avatar, onPick }: Props) {
  return (
    <TouchableOpacity
      onPress={onPick}
      className="self-center mb-6 relative"
    >
      <Image
        source={
          avatar
            ? { uri: avatar }
            : require("@/assets/images/default.png")
        }
        className="w-36 h-36 rounded-full"
      />

      <View className="absolute bottom-2 right-2 bg-black/80 p-2 rounded-full">
        <Ionicons name="camera" size={16} color="white" />
      </View>
    </TouchableOpacity>
  );
}