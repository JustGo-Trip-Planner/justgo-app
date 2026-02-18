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
  entry_fee?: { thai?: number; foreigner?: number } | any;
  lat?: number;
  lng?: number;
};

type Props = {
  plan: any;
};

export default function ItineraryTab({ plan }: Props) {
  const [day, setDay] = useState(0);
  const [polylinePoints, setPolylinePoints] = useState<{ latitude: number; longitude: number }[]>([]);
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

  // เรียก Directions API
  useEffect(() => {
    const fetchRoute = async () => {
      if (!apiKey || points.length < 2) return;

      const origin = `${points[0].lat},${points[0].lng}`;
      const destination = `${points[points.length - 1].lat},${points[points.length - 1].lng}`;
      const waypoints = points.slice(1, -1).map(p => `${p.lat},${p.lng}`).join("|");

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=${waypoints}&key=${apiKey}`;

      try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.routes?.[0]?.overview_polyline?.points) {
          const decoded = polyline.decode(data.routes[0].overview_polyline.points);
          setPolylinePoints(decoded.map(([latitude, longitude]) => ({ latitude, longitude })));
        }
      } catch (err) {
        console.error("Directions API Error", err);
      }
    };

    fetchRoute();
  }, [points, apiKey]);

  const openGoogleMapsRoute = () => {
    if (points.length < 2) return;
    const origin = `${points[0].lat},${points[0].lng}`;
    const destination = `${points[points.length - 1].lat},${points[points.length - 1].lng}`;
    const waypoints = points.slice(1, -1).map(p => `${p.lat},${p.lng}`).join("|");

    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}` +
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
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.place_name)}`;
      Linking.openURL(url);
    }
  };

  return (
    <ScrollView className="bg-white px-4 pb-24">
      {/* Tabs วันที่ */}
      <View className="flex-row justify-center mt-4 space-x-2">
        {days.map((_: any, idx: number) => (
          <Pressable
            key={idx}
            onPress={() => setDay(idx)}
            className={`px-3 py-1.5 rounded-full border ${
              idx === day ? "bg-white border-blue-600" : "bg-white border-gray-200"
            }`}
          >
            <Text
              className={`text-sm font-sans ${
                idx === day ? "text-blue-600 font-semibold" : "text-gray-700 font-medium"
              }`}
            >
              วันที่ {idx + 1}
            </Text>
          </Pressable>
        ))}
      </View>

        {/* MapView + Polyline */}
        <View className="mt-4 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100">
          {points.length >= 2 ? (
            <MapView
              style={{ width: "100%", height: 240 }}
              initialRegion={{
                latitude: points[0].lat,
                longitude: points[0].lng,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
              }}
            >
              {polylinePoints.length > 0 && (
                <Polyline coordinates={polylinePoints} strokeColor="#2563EB" strokeWidth={5} />
              )}
              {points.map((p, i) => (
                <Marker
                  key={i}
                  coordinate={{ latitude: p.lat, longitude: p.lng }}
                  title={p.name}
                  description={`จุดที่ ${i + 1}`}
                >
                  <View className="bg-white px-2 py-1 rounded-full border border-gray-400">
                    <Text className="text-xs font-bold text-black">{i + 1}</Text>
                  </View>
                </Marker>
              ))}
            </MapView>
          ) : (
            <View className="w-full h-52 items-center justify-center">
              <Ionicons name="map-outline" size={26} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2 font-sans">
                ยังไม่มีพิกัดเพียงพอสำหรับแสดงเส้นทาง
              </Text>
            </View>
          )}

          <View className="absolute bottom-3 right-3">
            <Pressable
              onPress={openGoogleMapsRoute}
              className="flex-row items-center bg-white px-3 py-2 rounded-full border border-gray-200"
            >
              <Ionicons name="navigate-outline" size={16} color="#2563EB" />
              <Text className="ml-1 text-blue-600 font-sans font-semibold text-sm">ดูเส้นทาง</Text>
            </Pressable>
          </View>
        </View>

      {/* Activities list (timeline style) */}
      <View className="mt-5">
        {activities?.map((activity: Activity, idx: number) => (
          <View key={idx} className="flex-row mb-5">
            {/* Timeline left */}
            <View className="w-16 items-center">
              <Ionicons name="location-outline" size={18} color="#111827" />
              <Text className="mt-1 text-xs font-sans font-semibold text-gray-700">
                {activity.time || "-"}
              </Text>

              {/* line */}
              {idx !== activities.length - 1 && (
                <View className="mt-2 w-[2px] flex-1 bg-gray-200" />
              )}
            </View>

            {/* Card */}
            <View className="flex-1 bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <Image
                source={{
                  uri: activity.image || "https://via.placeholder.com/600x400?text=Place",
                }}
                className="w-full h-36"
                resizeMode="cover"
              />

              <View className="p-3">
                <Text className="text-base font-sans font-semibold text-gray-900" numberOfLines={2}>
                  {activity.place_name || "สถานที่"}
                </Text>

                {!!activity.open_time && (
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="time-outline" size={16} color="#6B7280" />
                    <Text className="ml-1 text-sm font-sans text-gray-600">
                      {activity.open_time}
                    </Text>
                  </View>
                )}

                {activity.entry_fee && typeof activity.entry_fee === "object" && (
                  <View className="flex-row items-center mt-1">
                    <Ionicons name="card-outline" size={16} color="#6B7280" />
                    <Text className="ml-1 text-sm font-sans text-gray-600">
                      ค่าเข้า: คนไทย {activity.entry_fee.thai ?? 0} บาท | ต่างชาติ{" "}
                      {activity.entry_fee.foreigner ?? 0} บาท
                    </Text>
                  </View>
                )}

                <Pressable
                  onPress={() => openPlaceOnMaps(activity)}
                  className="mt-3 self-start flex-row items-center bg-orange-500 px-3 py-2 rounded-full"
                >
                  <Ionicons name="map-outline" size={16} color="#fff" />
                  <Text className="ml-1 text-white font-sans font-semibold text-sm">
                    ดูบนแผนที่
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
