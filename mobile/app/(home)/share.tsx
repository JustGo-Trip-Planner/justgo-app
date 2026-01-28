import { ScrollView, View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ShareScreen() {
  const groups = [
    {
      id: 1,
      name: "กลุ่มสาวท่องทริปเชียงใหม่",
      members: ["avatar1.png", "avatar2.png", "avatar3.png"],
    },
  ];

  const sharedTrips = [
    {
      id: 1,
      title: "เดทเชียงใหม่ #3",
      placesCount: 6,
      hotelStars: 3,
      date: "25 – 27 ตุลาคม 2025",
      cost: 4500,
      image: require("@/assets/images/chiangmai.jpg"),
      groupName: "กลุ่มสาวท่องทริปเชียงใหม่",
      members: ["avatar1.png", "avatar2.png", "avatar3.png"],
    },
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }} className="pt-14">
      <View className="items-center mb-6">
        <Image
          source={require("@/assets/icons/logo.png")}
          className="h-10 w-32"
          resizeMode="contain"
        />
        <TouchableOpacity className="absolute top-1 right-0">
          <Ionicons name="notifications-outline" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      <Text className="text-3xl font-semibold text-blue-800 mb-1 text-center">
        แชร์แผนการเดินทาง
      </Text>
      <Text className="text-lg text-blue-800 mb-6 text-center">
        ร่วมเดินทางกับผู้อื่น
      </Text>

      <View className="mb-8">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold text-gray-800">กลุ่มของคุณ</Text>
          <TouchableOpacity className="px-4 py-2 bg-blue-500 rounded-full flex-row items-center">
            <Ionicons name="add" size={16} color="white" />
            <Text className="ml-1 text-white">สร้างกลุ่ม</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-4">
          {groups.map((group, idx) => (
            <View
              key={idx}
              className="bg-white rounded-2xl shadow-md px-4 py-3 flex-row items-center"
            >
              <View className="flex-row -space-x-3">
                {group.members.map((mem, i) => (
                  <Image
                    key={i}
                    // source={require(`@/assets/icons/${mem}`)}
                    className="w-10 h-10 rounded-full border-2 border-white"
                  />
                ))}
              </View>
              <Text className="ml-3 text-base font-medium text-gray-800">{group.name}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className="mb-6 flex-row justify-between items-center">
        <Text className="text-lg font-bold text-gray-800">แชร์แผนการเดินทาง</Text>
        <TouchableOpacity className="px-4 py-2 bg-blue-500 rounded-full flex-row items-center">
          <Ionicons name="add" size={16} color="white" />
          <Text className="ml-1 text-white">แชร์แผนใหม่</Text>
        </TouchableOpacity>
      </View>

      {sharedTrips.map((trip, idx) => (
        <TouchableOpacity
          key={idx}
          className="mb-6 bg-white rounded-2xl shadow-md overflow-hidden"
        >
          <Image
            source={trip.image}
            className="w-full h-36"
            resizeMode="cover"
          />
          <View className="p-4">
            <Text className="text-xl font-semibold text-gray-800 mb-1">{trip.title}</Text>

            <View className="flex-row items-center mb-2">
              <Ionicons name="location-outline" size={16} color="#0ea5e9" />
              <Text className="text-sm text-gray-600 ml-1">
                {trip.placesCount} สถานที่
              </Text>
              <View className="mx-2 w-1 h-1 bg-gray-400 rounded-full" />
              <Ionicons name="bed-outline" size={16} color="#0ea5e9" />
              <Text className="text-sm text-gray-600 ml-1">
                {trip.hotelStars} ดาว
              </Text>
            </View>

            <View className="flex-row items-center mb-2">
              <Text className="text-sm text-gray-600">วันที่เดินทาง:</Text>
              <Text className="text-sm text-gray-700 ml-1">{trip.date}</Text>
            </View>

            <Text className="text-base text-gray-800 mb-3">ประมาณ ~฿{trip.cost}</Text>

            <View className="flex-row items-center">
              <View className="flex-row -space-x-3">
                {trip.members.map((mem, i) => (
                  <Image
                    key={i}
                    // source={require(`@/assets/icons/${mem}`)}
                    className="w-8 h-8 rounded-full border-2 border-white"
                  />
                ))}
              </View>
              <Text className="ml-3 text-sm font-medium text-gray-800">
                {trip.groupName}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
