import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
  Platform,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import Constants from "expo-constants";
import { Modal } from "react-native";

type PlaceCandidate = {
  place_id: string;
  name: string;
  formatted_address?: string;
  geometry: { location: { lat: number; lng: number } };
  photos?: { photo_reference: string }[];
};

const buildPhotoUrl = (photoRef: string, key: string) =>
  `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${key}`;

export default function AddLocationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id, dayIndex="0", province, provinceLat, provinceLng } = params as {
    id: string;
    dayIndex: string;
    province: string;
    provinceLat: string;
    provinceLng: string;
  };

  const GOOGLE_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY;

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PlaceCandidate[]>([]);
  const [picked, setPicked] = useState<PlaceCandidate | null>(null);
  const [selectedTime, setSelectedTime] = useState("06:00");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const mapRef = useRef<MapView | null>(null);

  const centerLat = Number(provinceLat ?? "13.736717");
  const centerLng = Number(provinceLng ?? "100.523186");

  const initialRegion: Region = useMemo(
    () => ({
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: 0.12,
      longitudeDelta: 0.12,
    }),
    [centerLat, centerLng]
  );

  // Fetch places
  const runSearch = async (text: string) => {
    if (!GOOGLE_KEY) return;
    if (!text || text.trim().length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const encodedQuery = encodeURIComponent(`${text} ${province}`);
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodedQuery}&region=th&language=th&location=${centerLat},${centerLng}&radius=40000&key=${GOOGLE_KEY}`;
      const res = await axios.get<any>(url);
      setResults(res.data.results ?? []);
    } catch (e) {
      console.warn("Search error", e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  const timeOptions = useMemo(() => {
    const slots: string[] = [];

    // 06:00 → 23:55
    for (let h = 6; h < 24; h++) {
      for (let m = 0; m < 60; m += 5) {
        slots.push(
          `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
        );
      }
    }

    // เพิ่ม 24:00 (เที่ยงคืน)
    slots.push("24:00");

    return slots;
  }, []);

  const onSelect = (place: PlaceCandidate) => {
    setPicked(place);
    setShowTimePicker(true);

    mapRef.current?.animateToRegion(
      {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      },
      400
    );
  };

const onConfirm = () => {
  if (!picked || !GOOGLE_KEY) return;

  const payload = {
    place_name: picked.name,
    address: picked.formatted_address ?? "",
    lat: picked.geometry.location.lat,
    lng: picked.geometry.location.lng,
    image: picked.photos?.[0]
      ? buildPhotoUrl(picked.photos[0].photo_reference, GOOGLE_KEY)
      : "",
    entry_fee: { thai: 0, foreigner: 0 },
    time: selectedTime,
    dayIndex: String(dayIndex ?? "0"),
    place_id: picked.place_id,
    rating: 0,
    category: "location",
  };

  router.replace({
    pathname: `/trip/${id}/edit`,
    params: {
      added: encodeURIComponent(JSON.stringify(payload)),
      _ts: String(Date.now()),
    },
  });
};


  // -----------------------
  // UI
  // -----------------------
  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="pt-12 px-4 mt-2 pb-3 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/80 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text className="text-xl font-semibold text-gray-900">
          เพิ่มสถานที่ใน {province}
        </Text>
        <View className="w-10" />
      </View>

      {/* Map */}
      <MapView
        ref={(r) => (mapRef.current = r)}
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        showsUserLocation
      >
        {picked && (
          <Marker
            coordinate={{
              latitude: picked.geometry.location.lat,
              longitude: picked.geometry.location.lng,
            }}
            title={picked.name}
            description={picked.formatted_address}
          />
        )}
      </MapView>

      {/* Bottom sheet */}
      <View className="bg-white rounded-t-3xl px-4 pt-3 pb-5 shadow-xl">
        <View className="items-center pb-2">
          <View className="w-12 h-1.5 rounded-full bg-gray-200" />
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3">
          <Ionicons name="search-outline" size={18} color="#6B7280" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={`ค้นหาสถานที่ใน ${province}`}
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-2 font-sans text-gray-900"
          />
        </View>

        {/* Result List */}
        <FlatList
          className="mt-3"
          data={results}
          keyExtractor={(item) => item.place_id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onSelect(item)}
              className="py-3 flex-row items-center"
            >
              <View className="w-9 h-9 rounded-full bg-green-50 items-center justify-center">
                <Ionicons name="location" size={18} color="#f97316" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-sm font-semibold text-gray-900">{item.name}</Text>
                <Text numberOfLines={1} className="text-xs text-gray-500 mt-1">
                  {item.formatted_address ?? ""}
                </Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            !loading && query.length >= 2 ? (
              <Text className="text-center font-sans text-gray-400 py-6">ไม่พบผลลัพธ์</Text>
            ) : null
          }
          style={{ maxHeight: Platform.OS === "ios" ? 240 : 260 }}
        />

        {/* Confirm */}
        <Pressable
          onPress={onConfirm}
          disabled={!picked}
          className={`mt-3 py-4 rounded-full items-center ${
            picked ? "bg-orange-500" : "bg-gray-200"
          }`}
        >
          <Text
            className={`font-semibold ${
              picked ? "text-white" : "text-gray-500"
            }`}
          >
            เพิ่มสถานที่
          </Text>
        </Pressable>
      </View>

      <Modal
        visible={showTimePicker}
        transparent
        animationType="slide"
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: "white",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 16,
              maxHeight: 400,
            }}
          >
            <Text style={{ textAlign: "center", fontWeight: "600", marginBottom: 12 }}>
              เลือกเวลา
            </Text>

            <FlatList
              data={timeOptions}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setSelectedTime(item)}
                  style={{
                    paddingVertical: 14,
                    alignItems: "center",
                    backgroundColor:
                      selectedTime === item ? "#FFEDD5" : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: selectedTime === item ? "600" : "400",
                      color: selectedTime === item ? "#EA580C" : "#111",
                    }}
                  >
                    {item}
                  </Text>
                </Pressable>
              )}
            />

            <Pressable
              onPress={() => {
                setShowTimePicker(false);
                onConfirm();
              }}
              style={{
                marginTop: 16,
                backgroundColor: "#F97316",
                paddingVertical: 14,
                borderRadius: 999,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>
                ยืนยันและเพิ่ม
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
