import { View, Text, ScrollView, Pressable, Image, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useEffect, useMemo, useState } from "react";
import Constants from "expo-constants";
import polyline from "@mapbox/polyline";

type Activity = {
  time?: string;
  place_name?: string;
  image?: string;
  open_time?: string;
  close_time?: string;
  category?: string;
  entry_fee?: { thai?: number; foreigner?: number } | any;
  lat?: number;
  lng?: number;
};

type Props = {
  plan: any;
};

function ActivityImage({ uri }: { uri?: string }) {
  const [imageFailed, setImageFailed] = useState(false);

  const validUri =
    uri &&
    typeof uri === "string" &&
    uri.trim() !== "" &&
    !["nan", "null", "none", "n/a"].includes(uri.trim().toLowerCase());

  if (!validUri || imageFailed) {
    return (
      <View className="h-44 w-full items-center justify-center bg-gray-100">
        <Ionicons name="image" size={28} color="#9CA3AF" />
        <Text className="mt-2 text-sm font-sans text-gray-500">ไม่มีรูปภาพ</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      className="h-44 w-full"
      resizeMode="cover"
      onError={() => setImageFailed(true)}
    />
  );
}

export default function ItineraryTab({ plan }: Props) {
  const [day, setDay] = useState(0);
  const [polylinePoints, setPolylinePoints] = useState<
    { latitude: number; longitude: number }[]
  >([]);

  const days = plan.daily_itinerary || [];
  const apiKey = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY;

  const activeDay = days[day];
  const activities: Activity[] = activeDay?.activities || [];

  const points = useMemo(() => {
    return activities
      .filter((a) => typeof a.lat === "number" && typeof a.lng === "number")
      .map((a) => ({
        lat: a.lat as number,
        lng: a.lng as number,
        name: a.place_name || "",
      }));
  }, [activities]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!apiKey || points.length < 2) {
        setPolylinePoints([]);
        return;
      }

      const origin = `${points[0].lat},${points[0].lng}`;
      const destination = `${points[points.length - 1].lat},${points[points.length - 1].lng}`;
      const waypoints = points
        .slice(1, -1)
        .map((p) => `${p.lat},${p.lng}`)
        .join("|");

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=${waypoints}&key=${apiKey}`;

      try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.routes?.[0]?.overview_polyline?.points) {
          const decoded = polyline.decode(data.routes[0].overview_polyline.points);
          setPolylinePoints(
            decoded.map(([latitude, longitude]) => ({ latitude, longitude }))
          );
        } else {
          setPolylinePoints([]);
        }
      } catch (err) {
        console.error("Directions API Error", err);
        setPolylinePoints([]);
      }
    };

    fetchRoute();
  }, [points, apiKey]);

  const openGoogleMapsRoute = () => {
    if (points.length < 2) return;

    const origin = `${points[0].lat},${points[0].lng}`;
    const destination = `${points[points.length - 1].lat},${points[points.length - 1].lng}`;
    const waypoints = points.slice(1, -1).map((p) => `${p.lat},${p.lng}`).join("|");

    const url =
      `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}` +
      (waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : "");

    Linking.openURL(url);
  };

  const openPlaceOnMaps = (a: Activity) => {
    if (typeof a.lat === "number" && typeof a.lng === "number") {
      const url = `https://www.google.com/maps/search/?api=1&query=${a.lat},${a.lng}`;
      Linking.openURL(url);
      return;
    }

    if (a.place_name) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        a.place_name
      )}`;
      Linking.openURL(url);
    }
  };

  const getCategoryLabel = (category?: string) => {
    const text = (category || "").toLowerCase();

    if (
      text.includes("restaurant") ||
      text.includes("อาหาร") ||
      text.includes("cafe") ||
      text.includes("คาเฟ่")
    ) {
      return {
        label: "ร้านอาหาร",
        icon: "restaurant" as const,
        iconColor: "#C2410C",
        badgeClass: "bg-orange-50",
        textClass: "text-orange-700",
        isRestaurant: true,
        timelineBgClass: "bg-orange-50",
        timelineBorderClass: "border-orange-100",
      };
    }

    return {
      label: "สถานที่ท่องเที่ยว",
      icon: "location" as const,
      iconColor: "#0369A1",
      badgeClass: "bg-sky-50",
      textClass: "text-sky-700",
      isRestaurant: false,
      timelineBgClass: "bg-sky-50",
      timelineBorderClass: "border-sky-100",
    };
  };

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 80 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Day tabs */}
      <View className="items-center">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 2,
            flexGrow: 1,
            justifyContent: "center",
          }}
        >
          {days.map((_: any, idx: number) => {
            const active = idx === day;

            return (
              <Pressable
                key={idx}
                onPress={() => setDay(idx)}
                className={`mr-2 rounded-full border px-4 py-2 ${
                  active ? "border-sky-700 bg-sky-700" : "border-gray-200 bg-white"
                }`}
              >
                <Text
                  className={`text-base ${
                    active ? "font-semibold text-white" : "font-medium text-gray-700"
                  }`}
                >
                  วันที่ {idx + 1}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Map */}
      <View className="mt-4 overflow-hidden rounded-3xl border border-gray-200 bg-gray-100 shadow-sm">
        <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <View className="flex-row items-center">
            <Ionicons name="map-outline" size={20} color="#374151" />
            <Text className="ml-2 text-lg font-semibold text-gray-900">
              เส้นทางการเดินทาง
            </Text>
          </View>

          <View className="rounded-full bg-sky-50 px-3 py-1.5">
            <Text className="text-sm font-sans text-sky-700">วันที่ {day + 1}</Text>
          </View>
        </View>

        {points.length >= 2 ? (
          <MapView
            style={{ width: "100%", height: 250 }}
            initialRegion={{
              latitude: points[0].lat,
              longitude: points[0].lng,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
          >
            {polylinePoints.length > 0 && (
              <Polyline coordinates={polylinePoints} strokeColor="#0369A1" strokeWidth={5} />
            )}

            {points.map((p, i) => (
              <Marker
                key={i}
                coordinate={{ latitude: p.lat, longitude: p.lng }}
                title={p.name}
                description={`จุดที่ ${i + 1}`}
              >
                <View className="rounded-full border border-gray-300 bg-white px-2 py-1">
                  <Text className="text-xs font-semibold text-black">{i + 1}</Text>
                </View>
              </Marker>
            ))}
          </MapView>
        ) : (
          <View className="h-56 w-full items-center justify-center bg-gray-50">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-white">
              <Ionicons name="map" size={26} color="#9CA3AF" />
            </View>
            <Text className="mt-3 text-base font-medium text-gray-600">
              ยังไม่มีพิกัดเพียงพอสำหรับแสดงเส้นทาง
            </Text>
            <Text className="mt-1 text-sm font-sans text-gray-500">
              เพิ่มสถานที่ที่มีพิกัดอย่างน้อย 2 จุด
            </Text>
          </View>
        )}

        <View className="absolute bottom-3 right-3">
          <Pressable
            onPress={openGoogleMapsRoute}
            className="flex-row items-center rounded-full bg-sky-700 px-4 py-2.5 shadow-sm"
          >
            <Ionicons name="navigate" size={16} color="#fff" />
            <Text className="ml-2 text-base font-semibold text-white">
              ดูเส้นทาง
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Activities */}
      <View className="mt-5">
        <View className="mb-3 flex-row items-center">
          <Ionicons name="list" size={20} color="#374151" />
          <Text className="ml-2 text-lg font-semibold text-gray-900">
            ตารางกิจกรรม
          </Text>
        </View>

        {activities?.map((activity: Activity, idx: number) => {
          const categoryUI = getCategoryLabel(activity.category);

          return (
            <View key={idx} className="mb-5 flex-row">
              {/* Timeline */}
              <View className="w-16 items-center">
                <View
                  className={`h-10 w-10 items-center justify-center rounded-full border ${categoryUI.timelineBorderClass} ${categoryUI.timelineBgClass}`}
                >
                  <Ionicons
                    name={categoryUI.icon}
                    size={18}
                    color={categoryUI.iconColor}
                  />
                </View>

                <Text className="mt-2 text-sm font-sans text-gray-600">
                  {activity.time || "-"}
                </Text>

                {idx !== activities.length - 1 && (
                  <View className="mt-2 w-[2px] flex-1 bg-gray-200" />
                )}
              </View>

              {/* Card */}
              <View className="flex-1 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
                <ActivityImage uri={activity.image} />

                <View className="p-4">
                  <View className="mb-4 flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <View
                        className={`mb-3 self-start rounded-full px-3 py-1.5 ${categoryUI.badgeClass}`}
                      >
                        <View className="flex-row items-center">
                          <Ionicons
                            name={categoryUI.icon}
                            size={14}
                            color={categoryUI.iconColor}
                          />
                          <Text
                            className={`ml-1 text-sm font-medium ${categoryUI.textClass}`}
                          >
                            {categoryUI.label}
                          </Text>
                        </View>
                      </View>

                      <Text
                        className="text-xl font-semibold leading-7 text-gray-900"
                        numberOfLines={2}
                      >
                        {activity.place_name || "สถานที่"}
                      </Text>
                    </View>

                    <View className="rounded-full bg-sky-50 px-3 py-1.5">
                      <Text className="text-sm font-sans text-sky-700">
                        {activity.time || "-"}
                      </Text>
                    </View>
                  </View>

                  <View className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
                    <View className="flex-row items-center">
                      <Ionicons name="time" size={16} color="#6B7280" />
                      <Text className="ml-2 text-base font-medium text-gray-700">
                        เวลาเปิด-ปิด {activity.open_time || "-"} - {activity.close_time || "-"}
                      </Text>
                    </View>

                    {!categoryUI.isRestaurant &&
                      activity.entry_fee &&
                      typeof activity.entry_fee === "object" && (
                        <View className="mt-3 flex-row items-start">
                          <Ionicons
                            name="card"
                            size={16}
                            color="#6B7280"
                            style={{ marginTop: 2 }}
                          />
                          <Text className="ml-2 flex-1 text-sm font-sans leading-5 text-gray-600">
                            ค่าเข้า: คนไทย {activity.entry_fee.thai ?? 0} บาท | ต่างชาติ{" "}
                            {activity.entry_fee.foreigner ?? 0} บาท
                          </Text>
                        </View>
                      )}
                  </View>

                  <Pressable
                    onPress={() => openPlaceOnMaps(activity)}
                    className="mt-4 self-start rounded-full bg-orange-500 px-4 py-2.5"
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="map" size={16} color="#fff" />
                      <Text className="ml-2 text-base font-semibold text-white">
                        ดูบนแผนที่
                      </Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
