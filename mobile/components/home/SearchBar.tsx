import { View, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
};

export default function SearchBar({ placeholder, value, onChangeText }: Props) {
  return (
    <View className="flex-row items-center bg-white px-4 py-2 rounded-2xl shadow-sm">
      <Ionicons name="search" size={20} color="#999" />
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        className="ml-2 flex-1 text-gray-800 font-sans text-lg"
        placeholderTextColor="#aaa"
      />
    </View>
  );
}