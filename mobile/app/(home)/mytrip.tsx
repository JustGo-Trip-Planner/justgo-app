import { ScrollView, View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function MyTrip() {
  const trips = [
    {
      title: "กรุงเทพกับครอบครัว #1",
      placesCount: 5,
      hotelStars: 4,
      participants: "ครอบครัว",
      date: "12 – 14 ธันวาคม 2025",
      cost: 7900,
      image: require("@/assets/images/bangkok.jpg"),
    },
    {
      title: "เดทเชียงใหม่ #3",
      placesCount: 6,
      hotelStars: 3,
      participants: "คู่รัก",
      date: "25 – 27 ตุลาคม 2025",
      cost: 4500,
      image: require("@/assets/images/chiangmai.jpg"),
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
        แผนการเดินทางของฉัน
      </Text>
      <Text className="text-lg text-blue-800 mb-6 text-center">
        รวบรวมทุกการเดินทางของคุณไว้ในที่เดียว
      </Text>

      <View className="flex-row justify-center mb-6">
        <TouchableOpacity className="px-4 py-2 bg-orange-400 rounded-full mr-2">
          <Text className="text-sm text-white">แผนเดินทางของคุณ</Text>
        </TouchableOpacity>
        <TouchableOpacity className="px-4 py-2 bg-white rounded-full border border-gray-300">
          <Text className="text-sm text-gray-700">ประวัติแผนการเดินทาง</Text>
        </TouchableOpacity>
      </View>

      {trips.map((trip, idx) => (
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
            <Text className="text-xl font-semibold text-gray-800 mb-1">
              {trip.title}
            </Text>

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
              <Text className="text-sm text-gray-600">
                ผู้ร่วมเดินทาง: {trip.participants}
              </Text>
            </View>

            <View className="flex-row items-center mb-3">
              <Text className="text-sm text-gray-600">วันที่เดินทาง: </Text>
              <Text className="text-sm text-gray-700 ml-1">{trip.date}</Text>
            </View>

            <Text className="text-base text-gray-800">
              ค่าใช้จ่ายทั้งทริปโดยประมาณ ~฿{trip.cost}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
