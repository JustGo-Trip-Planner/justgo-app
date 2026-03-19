import { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  ActivityIndicator
} from "react-native";

type Item = {
  id: string;
  label: string;
};

type Group = {
  id: string;
  title: string;
  image: any;
  items: Item[];
};

type Preference = {
  groupId: string;
  items: string[];
};

type Props = {
  title: string;
  subtitle: string;
  groups: Group[];
  selected: Preference[];
  onToggle: (groupId: string, itemId: string) => void;
  onNext: () => void;
  onSkip?: () => void;
  loading?: boolean;
};

export default function ChoosePreference({
  title,
  subtitle,
  groups,
  selected,
  onToggle,
  onNext,
  onSkip,
  loading
}: Props) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const selectedSet = useMemo(() => {
    const set = new Set<string>();
    selected.forEach((g) => g.items.forEach((i) => set.add(i)));
    return set;
  }, [selected]);

  const totalSelected = selectedSet.size;

  const countGroup = (groupId: string) => {
    const group = selected.find((g) => g.groupId === groupId);
    return group?.items.length || 0;
  };

  return (
    <View className="flex-1 px-2">

      {/* HEADER */}
      <View className="mb-5">
        <View className="flex-row items-center justify-center px-4 my-2">
          <Text className="text-2xl font-semibold text-gray-900 font-sans text-center">
            {title}
          </Text>
        </View>

        <Text className="text-gray-500 text-center font-sans px-4">
          {subtitle}
        </Text>
      </View>

      {/* SUMMARY */}
      <View className="mb-3">
        <Text className="text-sm text-orange-500 font-semibold font-sans">
          เลือกแล้ว {totalSelected} รายการ
        </Text>
      </View>

      {/* LIST */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 160,
        }}
      >
        {groups.map((group) => {
          const isOpen = openGroup === group.id;
          const count = countGroup(group.id);

          return (
            <View key={group.id} className="mb-4">

              {/* CARD */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() =>
                  setOpenGroup(isOpen ? null : group.id)
                }
                className="rounded-2xl overflow-hidden"
              >
                <ImageBackground
                  source={group.image}
                  className="h-40 justify-end"
                  imageStyle={{ borderRadius: 16 }}
                >
                  <View className="bg-black/40 px-4 py-3">
                    <View className="flex-row justify-between items-center">

                      <Text className="text-white text-lg font-semibold font-sans">
                        {group.title}
                      </Text>

                      {count > 0 && (
                        <View className="bg-white/90 px-2 py-1 rounded-full">
                          <Text className="text-xs font-medium">
                            {count} เลือก
                          </Text>
                        </View>
                      )}

                    </View>
                  </View>
                </ImageBackground>
              </TouchableOpacity>

              {/* EXPAND */}
              {isOpen && (
                <View className="mt-3 flex-row flex-wrap">
                  {group.items.map((item) => {
                    const active = selectedSet.has(item.id);

                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => onToggle(group.id, item.id)}
                        className={`px-4 py-2 mr-2 mb-2 rounded-full ${
                          active
                            ? "bg-sky-700"
                            : "bg-gray-100"
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            active
                              ? "text-white"
                              : "text-gray-700"
                          }`}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

            </View>
          );
        })}
      </ScrollView>

      {/* FOOTER */}
      <View className="absolute bottom-6 left-2 right-2">

        <View className="bg-white/90 backdrop-blur-md rounded-2xl p-3 shadow-lg">

          <View className="flex-row items-center gap-3">

            {/* SKIP */}
            {onSkip && (
              <TouchableOpacity
                onPress={onSkip}
                className="px-4 py-3 rounded-xl bg-gray-100"
              >
                <Text className="text-gray-600 font-medium font-sans">
                  ข้าม
                </Text>
              </TouchableOpacity>
            )}

            {/* NEXT */}
            <TouchableOpacity
              onPress={onNext}
              disabled={totalSelected === 0 || loading}
              className={`flex-1 py-3 rounded-xl items-center ${
                totalSelected === 0 || loading
                  ? "bg-gray-300"
                  : "bg-orange-500"
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold font-sans">
                  ถัดไป
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}