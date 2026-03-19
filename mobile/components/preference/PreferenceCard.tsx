import { View, Text, Image, TouchableOpacity } from "react-native";

type Item = {
  id: string;
  label: string;
};

type Props = {
  title: string;
  image: any;
  items: Item[];
  selected: string[];
  onToggle: (id: string) => void;
};

export default function PreferenceCard({
  title,
  image,
  items,
  selected,
  onToggle,
}: Props) {

  const selectedCount = items.filter(i => selected.includes(i.id)).length;
  const isActiveGroup = selectedCount > 0;

  return (
    <View
      className={`rounded-2xl mb-4 overflow-hidden ${
        isActiveGroup
          ? "border border-sky-700"
          : "border border-gray-200"
      }`}
      style={{
        backgroundColor: "white",
        shadowColor: "#000",
        shadowOpacity: isActiveGroup ? 0.18 : 0.05,
        shadowRadius: isActiveGroup ? 14 : 6,
        elevation: isActiveGroup ? 6 : 2,
      }}
    >

      {/* IMAGE + OVERLAY */}
      <View>
        <Image source={image} className="w-full h-32" />

        {/* highlight overlay */}
        {isActiveGroup && (
          <View className="absolute inset-0 bg-sky-700/20" />
        )}
      </View>

      <View className="p-4">

        {/* TITLE */}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-base font-semibold font-sans text-gray-900">
            {title}
          </Text>

          {selectedCount > 0 && (
            <View className="bg-sky-100 px-2 py-1 rounded-full">
              <Text className="text-xs text-sky-700 font-medium">
                {selectedCount} เลือก
              </Text>
            </View>
          )}
        </View>

        {/* ITEMS */}
        <View className="flex-row flex-wrap">
          {items.map(item => {
            const active = selected.includes(item.id);

            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => onToggle(item.id)}
                activeOpacity={0.7}
                className={`px-3.5 py-1.5 rounded-full mr-2 mb-2 border ${
                  active
                    ? "bg-sky-700 border-sky-700"
                    : "bg-gray-100 border-gray-200"
                }`}
              >
                <Text
                  className={`text-xs font-medium font-sans ${
                    active ? "text-white" : "text-gray-600"
                  }`}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

      </View>
    </View>
  );
}