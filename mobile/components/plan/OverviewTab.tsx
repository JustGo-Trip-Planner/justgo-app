import { View, Text, Image, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";

type Props = {
  plan: any;
};

export default function OverviewTab({ plan }: Props) {
  const formatDateRange = (start: string, end: string) => {
    try {
      const startDate = parseISO(start);
      const endDate = parseISO(end);

      const startStr = format(startDate, "d", { locale: th });
      const endStr = format(endDate, "d MMMM yyyy", { locale: th });

      return `${startStr} - ${endStr}`;
    } catch {
      return `${start} - ${end}`;
    }
  };

  const totalPlaces = (plan?.daily_itinerary || []).reduce(
    (sum: number, day: any) => sum + ((day?.activities || []).length), 0);

  const formatTHB = (amount: number) =>
    `฿${Number(amount || 0).toLocaleString("th-TH")}`;

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 80,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Main Summary */}
      <View className="rounded-3xl border border-gray-200 bg-white px-5 py-5 shadow-sm">
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-sm font-sans text-gray-500">
              สรุปแผนการเดินทาง
            </Text>
            <Text className="mt-1 text-2xl font-semibold text-gray-900">
              {plan.trip_title || "แผนการเดินทาง"}
            </Text>
          </View>

          <View className="h-14 w-14 items-center justify-center rounded-full bg-orange-50">
            <Ionicons name="airplane" size={24} color="#f97316" />
          </View>
        </View>

        <View className="flex-row flex-wrap justify-between">
          <View className="mb-3 w-[48%] rounded-2xl bg-gray-50 px-4 py-4">
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={18} color="#4B5563" />
              <Text className="ml-2 text-sm font-sans text-gray-500">
                วันที่เดินทาง
              </Text>
            </View>
            <Text className="mt-2 text-lg font-semibold text-gray-900">
              {formatDateRange(plan.start_date, plan.end_date)}
            </Text>
          </View>

          <View className="mb-3 w-[48%] rounded-2xl bg-gray-50 px-4 py-4">
            <View className="flex-row items-center">
              <Ionicons name="cash-outline" size={18} color="#4B5563" />
              <Text className="ml-2 text-sm font-sans text-gray-500">
                งบประมาณ
              </Text>
            </View>
            <Text className="mt-2 text-lg font-semibold text-gray-900">
              {formatTHB(
                (plan.daily_budget || []).reduce(
                  (sum: number, d: any) => sum + Number(d?.total || 0),
                  0
                )
              )}
            </Text>
          </View>

          <View className="w-[48%] rounded-2xl bg-gray-50 px-4 py-4">
            <View className="flex-row items-center">
              <Ionicons name="bed-outline" size={18} color="#4B5563" />
              <Text className="ml-2 text-sm font-sans text-gray-500">
                ระดับที่พัก
              </Text>
            </View>
            <Text className="mt-2 text-lg font-semibold text-gray-900">
              ระดับ {plan.recommended_hotels?.[0]?.stars || "-"} ดาว
            </Text>
          </View>

          <View className="w-[48%] rounded-2xl bg-gray-50 px-4 py-4">
            <View className="flex-row items-center">
              <Ionicons name="location-outline" size={18} color="#4B5563" />
              <Text className="ml-2 text-sm font-sans text-gray-500">
                จำนวนสถานที่ท่องเที่ยว
              </Text>
            </View>
            <Text className="mt-2 text-lg font-semibold text-gray-900">
              {totalPlaces} สถานที่
            </Text>
          </View>
        </View>
      </View>

      {/* Hotel Section */}
      <View className="mt-6">
        <View className="ml-4 mb-3 flex-row items-center">
          <Ionicons name="business-outline" size={22} color="#4B5563" />
          <Text className="ml-2 text-lg font-semibold text-gray-900">
            แนะนำโรงแรม
          </Text>
        </View>

        {(plan.recommended_hotels || []).map(
          (
            hotel: {
              image?: string;
              name: string;
              stars?: number;
              price_per_night?: number;
              type?: string;
            },
            idx: number
          ) => (
            <View
              key={idx}
              className="mb-4 mx-4 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm"
            >
              <Image
                source={{
                  uri: hotel.image || "https://via.placeholder.com/600x300",
                }}
                className="h-44 w-full"
                resizeMode="cover"
              />

              <View className="p-4">
                {!!hotel.type && (
                  <View className="mb-3 self-start rounded-full bg-sky-50 px-3 py-1">
                    <Text className="text-sm font-medium text-sky-700">
                      {hotel.type}
                    </Text>
                  </View>
                )}

                <Text
                  className="text-xl font-semibold text-gray-900"
                  numberOfLines={2}
                >
                  {hotel.name}
                </Text>

                <View className="mt-4 flex-row flex-wrap">
                  <View className="mr-3 mb-2 flex-row items-center rounded-full bg-gray-50 px-3 py-2">
                    <Ionicons name="star" size={16} color="#FBBF24" />
                    <Text className="ml-2 font-medium text-gray-700">
                      ระดับ {hotel.stars || 3} ดาว
                    </Text>
                  </View>

                  <View className="mb-2 flex-row items-center rounded-full bg-gray-50 px-3 py-2">
                    <Ionicons
                      name="pricetag"
                      size={16}
                      color="#4B5563"
                    />
                    <Text className="ml-2 font-medium text-gray-700">
                      {formatTHB(hotel.price_per_night || 0)}/คืน
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )
        )}

        {!(plan.recommended_hotels || []).length && (
          <View className="items-center rounded-3xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10">
            <Ionicons name="bed-outline" size={28} color="#9CA3AF" />
            <Text className="mt-2 text-sm font-sans text-gray-500">
              ยังไม่มีข้อมูลโรงแรมแนะนำ
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}