import React from "react";
import { View, Text, Image, Pressable, Linking, Alert, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type Hotel = {
  _localId: string;
  name: string;
  type?: string;
  stars?: number;
  price_per_night: number;
  price_text?: string;
  rating?: number;
  review_count?: number;
  address?: string;
  image?: string;
  website_url?: string;
  google_hotels_url?: string;
  amenities?: string[];
  check_in_time?: string;
  check_out_time?: string;
  lat?: number;
  lng?: number;
};

type Props = {
  hotels: Hotel[];
  onRemove: (id: string) => void;
  onAdd: () => void;
};

async function openHotelUrl(hotel: Hotel) {
  const target = hotel.google_hotels_url || hotel.website_url || "";

  if (!target) {
    Alert.alert("ยังไม่มีลิงก์", "โรงแรมนี้ยังไม่มีลิงก์สำหรับดูรายละเอียด");
    return;
  }

  try {
    await Linking.openURL(target);
  } catch {
    Alert.alert("เปิดลิงก์ไม่ได้", "ไม่สามารถเปิดหน้ารายละเอียดโรงแรมได้");
  }
}

function getDisplayPrice(hotel: Hotel) {
  if (hotel.price_text?.trim()) return hotel.price_text;
  if (hotel.price_per_night > 0) {
    return `฿${hotel.price_per_night.toLocaleString("th-TH")}/คืน`;
  }
  return "ไม่ระบุราคา";
}

function getRatingValue(rating?: number) {
  const value = Number(rating || 0);
  if (!Number.isFinite(value) || value < 0) return 0;
  if (value > 5) return 5;
  return value;
}

function RatingStars({ rating }: { rating?: number }) {
  const value = getRatingValue(rating);

  return (
    <View className="flex-row items-center">
      {[1, 2, 3, 4, 5].map((star) => {
        let iconName: keyof typeof Ionicons.glyphMap = "star-outline";

        if (value >= star) {
          iconName = "star";
        } else if (value >= star - 0.5) {
          iconName = "star-half";
        }

        return (
          <Ionicons
            key={star}
            name={iconName}
            size={14}
            color={iconName === "star-outline" ? "#D1D5DB" : "#F59E0B"}
            style={{ marginRight: 2 }}
          />
        );
      })}
    </View>
  );
}

export default function HotelTab({ hotels, onRemove, onAdd }: Props) {
  if (!hotels || hotels.length === 0) {
    return (
      <View className="mt-3 pb-24">
        <View className="rounded-3xl border border-dashed border-gray-300 bg-white px-5 py-8 items-center">
          <View className="w-16 h-16 rounded-full bg-orange-50 items-center justify-center">
            <Ionicons name="bed-outline" size={28} color="#f97316" />
          </View>

          <Text className="mt-4 text-base font-semibold text-gray-900">
            ยังไม่ได้เลือกที่พัก
          </Text>

          <Text className="mt-2 text-center text-sm font-sans text-gray-500 leading-5">
            เพิ่มโรงแรมหรือที่พักสำหรับทริปนี้
          </Text>

          <Pressable
            onPress={onAdd}
            className="mt-5 flex-row items-center justify-center rounded-full bg-sky-700 px-5 py-3"
          >
            <Ionicons name="add-circle-outline" size={20} color="white" />
            <Text className="ml-2 text-base font-semibold text-white">
              เพิ่มโรงแรมที่พัก
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const hotel = hotels[0];
  const ratingValue = getRatingValue(hotel.rating);

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 10 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
    >
      <View className="pb-24">
        <View className="mt-3 overflow-hidden rounded-3xl border border-gray-200 bg-white">
          <View className="relative">
            <Image
              source={{
                uri: hotel.image || "https://via.placeholder.com/600x320?text=Hotel",
              }}
              className="h-48 w-full"
            />

            <Pressable
              onPress={() => onRemove(hotel._localId)}
              className="absolute right-3 top-3 h-10 w-10 items-center justify-center rounded-full bg-white/95"
            >
              <Ionicons name="trash-outline" size={18} color="#dc2626" />
            </Pressable>

            {!!hotel.type && (
              <View className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1">
                <Text className="text-sm font-medium text-white">{hotel.type}</Text>
              </View>
            )}
          </View>

          <View className="p-4">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text
                  className="text-lg font-semibold text-gray-900"
                  numberOfLines={2}
                >
                  {hotel.name}
                </Text>

                {!!hotel.address && (
                  <View className="mt-2 flex-row items-start">
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color="#6B7280"
                      style={{ marginTop: 2 }}
                    />
                    <Text
                      numberOfLines={2}
                      className="ml-1 flex-1 text-sm font-sans leading-5 text-gray-500"
                    >
                      {hotel.address}
                    </Text>
                  </View>
                )}
              </View>

              <View className="items-end">
                <Text className="text-lg font-semibold text-gray-900">
                  {getDisplayPrice(hotel)}
                </Text>
              </View>
            </View>

            <View className="mt-4 rounded-2xl bg-gray-50 px-4 py-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <View className="flex-row items-center">
                    <RatingStars rating={ratingValue} />
                    <Text className="ml-2 text-sm font-medium text-gray-800">
                      {ratingValue > 0 ? ratingValue.toFixed(1) : "-"}
                    </Text>

                    {!!hotel.review_count && (
                      <Text className="ml-2 text-sm font-sans text-gray-500">
                        ({hotel.review_count.toLocaleString()} รีวิว)
                      </Text>
                    )}
                  </View>

                  {!!hotel.stars && (
                    <Text className="mt-2 text-sm font-sans text-gray-500">
                      ระดับที่พัก {hotel.stars} ดาว
                    </Text>
                  )}
                </View>

                <Pressable
                  onPress={() => openHotelUrl(hotel)}
                  className="h-10 w-10 items-center justify-center rounded-full bg-sky-700"
                >
                  <Ionicons name="chevron-forward" size={20} color="white" />
                </Pressable>
              </View>
            </View>

            {!!hotel.amenities?.length && (
              <View className="mt-4 flex-row flex-wrap">
                {hotel.amenities.slice(0, 4).map((item, idx) => (
                  <View
                    key={`${hotel._localId}-${idx}`}
                    className="mb-2 mr-2 rounded-full bg-orange-50 px-3 py-1.5"
                  >
                    <Text className="text-sm font-medium text-orange-600">
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {(hotel.check_in_time || hotel.check_out_time) && (
              <View className="mt-4 flex-row flex-wrap">
                {!!hotel.check_in_time && (
                  <View className="mb-2 mr-2 flex-row items-center rounded-full bg-gray-100 px-3 py-1.5">
                    <Ionicons name="log-in-outline" size={14} color="#6B7280" />
                    <Text className="ml-1 text-sm font-sans text-gray-600">
                      เช็กอิน {hotel.check_in_time}
                    </Text>
                  </View>
                )}

                {!!hotel.check_out_time && (
                  <View className="mb-2 mr-2 flex-row items-center rounded-full bg-gray-100 px-3 py-1.5">
                    <Ionicons name="log-out-outline" size={14} color="#6B7280" />
                    <Text className="ml-1 text-sm font-sans text-gray-600">
                      เช็กเอาต์ {hotel.check_out_time}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View className="mt-5 flex-row">
              <Pressable
                onPress={() => openHotelUrl(hotel)}
                className="mr-2 flex-1 flex-row items-center justify-center rounded-full bg-sky-700 py-3"
              >
                <Ionicons name="open-outline" size={18} color="white" />
                <Text className="ml-2 text-base font-semibold text-white">
                  ดูรายละเอียด
                </Text>
              </Pressable>

              <Pressable
                onPress={() => onAdd()}
                className="ml-2 flex-1 flex-row items-center justify-center rounded-full bg-orange-500 py-3"
              >
                <Ionicons
                  name="swap-horizontal-outline"
                  size={18}
                  color="white"
                />
                <Text className="ml-2 text-base font-semibold text-white">
                  เปลี่ยนที่พัก
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => onRemove(hotel._localId)}
              className="mt-3 items-center rounded-full bg-red-50 py-3"
            >
              <Text className="text-base font-semibold text-red-600">
                ลบที่พัก
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}