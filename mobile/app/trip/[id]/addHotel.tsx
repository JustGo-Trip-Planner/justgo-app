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

type PlaceCandidate = {
  place_id: string;
  name: string;
  formatted_address?: string;
  geometry: { location: { lat: number; lng: number } };
  photos?: { photo_reference: string }[];
  rating?: number;
  types?: string[];
};

const buildPhotoUrl = (photoRef: string, key: string) =>
  `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${key}`;

export default function AddHotelScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const { id, province, provinceLat, provinceLng } = params as {
    id: string;
    province: string;
    provinceLat: string;
    provinceLng: string;
  };

  const GOOGLE_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY;

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PlaceCandidate[]>([]);
  const [picked, setPicked] = useState<PlaceCandidate | null>(null);

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

  // -----------------------------
  // Search Lodging only
  // -----------------------------
  const runSearch = async (text: string) => {
    if (!GOOGLE_KEY) return;

    if (!text || text.trim().length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);

      const encodedQuery = encodeURIComponent(`${text} ${province}`);
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodedQuery}&type=lodging&region=th&language=th&location=${centerLat},${centerLng}&radius=40000&key=${GOOGLE_KEY}`;

      const res = await axios.get(url);

      // กรองเฉพาะที่เป็น lodging จริง
      const filtered =
        (res.data.results ?? []).filter((r: PlaceCandidate) =>
          r.types?.includes("lodging")
        ) ?? [];

      setResults(filtered);
    } catch (e) {
      console.warn("Hotel search error", e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  const onSelect = (place: PlaceCandidate) => {
    setPicked(place);

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

  // -----------------------------
  // Confirm -> Send back
  // -----------------------------
  const onConfirm = () => {
    if (!picked || !GOOGLE_KEY) return;

    const payload = {
      name: picked.name,
      address: picked.formatted_address ?? "",
      lat: picked.geometry.location.lat,
      lng: picked.geometry.location.lng,
      image: picked.photos?.[0]
        ? buildPhotoUrl(picked.photos[0].photo_reference, GOOGLE_KEY)
        : "",
      rating: picked.rating ?? 0,
      stars: 3,
      price_per_night: 0,
      type: "โรงแรม",
      place_id: picked.place_id,
      category: "location",
    };

    router.push({
      pathname: `/trip/${id}/edit`,
      params: {
        addedHotel: encodeURIComponent(JSON.stringify(payload)),
        _ts: String(Date.now()),
      },
    });
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="pt-12 px-4 pb-3 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/80 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text className="text-base font-semibold text-gray-900">
          เพิ่มโรงแรมใน {province}
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

      {/* Bottom Sheet */}
      <View className="bg-white rounded-t-3xl px-4 pt-3 pb-5 shadow-xl">
        <View className="items-center pb-2">
          <View className="w-10 h-1.5 rounded-full bg-gray-200" />
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3">
          <Ionicons name="search-outline" size={18} color="#6B7280" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={`ค้นหาโรงแรมใน ${province}`}
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-2 text-gray-900"
          />
        </View>

        {/* Results */}
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
              <View className="w-9 h-9 rounded-full bg-blue-50 items-center justify-center">
                <Ionicons name="bed-outline" size={18} color="#2563EB" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-sm font-semibold text-gray-900">
                  {item.name}
                </Text>
                <Text numberOfLines={1} className="text-xs text-gray-500 mt-1">
                  {item.formatted_address ?? ""}
                </Text>
              </View>
              {item.rating && (
                <Text className="text-xs text-gray-600">
                  ⭐ {item.rating.toFixed(1)}
                </Text>
              )}
            </Pressable>
          )}
          ListEmptyComponent={
            !loading && query.length >= 2 ? (
              <Text className="text-center text-gray-400 py-6">
                ไม่พบโรงแรม
              </Text>
            ) : null
          }
          style={{ maxHeight: Platform.OS === "ios" ? 240 : 260 }}
        />

        {loading && <ActivityIndicator className="mt-3" />}

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
            เพิ่มโรงแรม
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
