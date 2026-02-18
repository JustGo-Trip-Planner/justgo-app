import React from "react";
import { View, Text, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type Hotel = {
  _localId: string;
  name: string;
  type?: string;
  stars?: number;
  price_per_night: number;
  rating?: number;
  address?: string;
  image?: string;
};

type Props = {
  hotels: Hotel[];
  onRemove: (id: string) => void;
  onAdd: () => void; // ไปหน้า addHotel
};

export default function HotelTab({ hotels, onRemove, onAdd }: Props) {
  if (!hotels || hotels.length === 0) {
    return (
      <View className="mt-2">
        <Pressable onPress={onAdd} className="bg-green-600 py-3 rounded-full items-center">
          <Text className="text-white font-semibold">+ เพิ่มโรงแรมที่พัก</Text>
        </Pressable>

        <View className="mt-4 bg-gray-50 border border-gray-200 rounded-2xl p-4">
          <Text className="text-gray-700 font-semibold">ยังไม่มีที่พัก</Text>
          <Text className="text-gray-500 mt-1 text-sm">
            ค้นหาที่พัก
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="space-y-3">
      {hotels.map((hotel) => (
        <View
          key={hotel._localId}
          className="flex-row bg-white border border-gray-200 rounded-2xl p-4 relative"
        >
          <Image
            source={{ uri: hotel.image || "https://via.placeholder.com/150" }}
            className="w-28 h-28 rounded-xl mr-4"
          />

          <View className="flex-1 justify-between">
            <View>
              <Text className="text-base font-semibold text-gray-900" numberOfLines={2}>
                {hotel.name}
              </Text>
              {!!hotel.type && <Text className="text-sm text-gray-500 mt-0.5">{hotel.type}</Text>}
            </View>

            {!!hotel.address && (
              <Text numberOfLines={1} className="text-xs text-gray-400 mt-1">
                {hotel.address}
              </Text>
            )}

            <View className="flex-row items-center justify-between mt-2">
              <View className="flex-row items-center">
                <Ionicons name="star" size={16} color="#fbbf24" />
                <Text className="ml-1 text-sm text-gray-800">
                  {hotel.rating?.toFixed(1) ?? "-"}
                </Text>
                {!!hotel.stars && (
                  <Text className="ml-2 text-xs text-gray-500">{hotel.stars} ดาว</Text>
                )}
              </View>

              <Text className="font-bold text-base text-gray-800">
                ฿{hotel.price_per_night}/คืน
              </Text>
            </View>
          </View>

          <Pressable onPress={() => onRemove(hotel._localId)} className="absolute top-2 right-2 p-1">
            <Ionicons name="trash-outline" size={20} color="red" />
          </Pressable>
        </View>
      ))}
    </View>
  );
}
