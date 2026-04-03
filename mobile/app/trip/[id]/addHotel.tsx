import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
  Platform,
  Image,
  Linking,
  Alert,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import Constants from "expo-constants";

type HotelCandidate = {
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
  description?: string;
};

const formatPricePerNight = (hotel: HotelCandidate) => {
  if (hotel.price_text && hotel.price_text.trim()) {
    return hotel.price_text.includes("/คืน")
      ? hotel.price_text
      : `${hotel.price_text}/คืน`;
  }

  const num = Number(hotel.price_per_night || 0);
  if (!num) return "ไม่ระบุราคา";
  return `฿${num.toLocaleString("th-TH")}/คืน`;
};

const getRatingValue = (rating?: number) => {
  const value = Number(rating || 0);
  if (!Number.isFinite(value) || value < 0) return 0;
  if (value > 5) return 5;
  return value;
};

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

async function openHotelUrl(hotel: HotelCandidate) {
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

export default function AddHotelScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const {
    id,
    province,
    provinceLat,
    provinceLng,
    startDate,
    endDate,
  } = params as {
    id: string;
    province: string;
    provinceLat: string;
    provinceLng: string;
    startDate?: string;
    endDate?: string;
  };

  const API_URL = Constants.expoConfig?.extra?.API_URL;

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<HotelCandidate[]>([]);
  const [picked, setPicked] = useState<HotelCandidate | null>(null);

  const mapRef = useRef<MapView | null>(null);
  const firstLoadRef = useRef(true);

  const centerLat = Number(provinceLat ?? "13.736717");
  const centerLng = Number(provinceLng ?? "100.523186");

  const initialRegion: Region = useMemo(
    () => ({
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: 0.18,
      longitudeDelta: 0.18,
    }),
    [centerLat, centerLng]
  );

  const fitMapToMarkers = (items: HotelCandidate[]) => {
    const validCoords = items.filter(
      (item) =>
        typeof item.lat === "number" &&
        Number.isFinite(item.lat) &&
        typeof item.lng === "number" &&
        Number.isFinite(item.lng)
    );

    if (!mapRef.current) return;

    if (validCoords.length === 0) {
      mapRef.current.animateToRegion(initialRegion, 400);
      return;
    }

    if (validCoords.length === 1) {
      mapRef.current.animateToRegion(
        {
          latitude: validCoords[0].lat!,
          longitude: validCoords[0].lng!,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        400
      );
      return;
    }

    mapRef.current.fitToCoordinates(
      validCoords.map((item) => ({
        latitude: item.lat!,
        longitude: item.lng!,
      })),
      {
        edgePadding: {
          top: 80,
          right: 80,
          bottom: 80,
          left: 80,
        },
        animated: true,
      }
    );
  };

  const runSearch = async (text: string) => {
    if (!API_URL) return;

    try {
      setLoading(true);

      const cleanedQuery = text?.trim() || "";

      const res = await axios.get<any>(`${API_URL}/api/hotels/search`, {
        params: {
          q: cleanedQuery,
          province,
          provinceLat,
          provinceLng,
          checkIn: startDate,
          checkOut: endDate,
          adults: 2,
          currency: "THB",
        },
      });

      const items = Array.isArray(res.data?.items) ? res.data.items : [];
      setResults(items);

      if (picked) {
        const stillExists = items.some(
          (item) => item._localId === picked._localId
        );
        if (!stillExists) {
          setPicked(null);
        }
      }

      requestAnimationFrame(() => {
        fitMapToMarkers(items);
      });
    } catch (e) {
      console.warn("Hotel search error", e);
      setResults([]);
      setPicked(null);

      requestAnimationFrame(() => {
        fitMapToMarkers([]);
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      runSearch(query);
      return;
    }

    const t = setTimeout(() => {
      runSearch(query);
    }, 450);

    return () => clearTimeout(t);
  }, [query, province, startDate, endDate]);

  const onSelect = (hotel: HotelCandidate) => {
    const isSame = picked?._localId === hotel._localId;

    if (isSame) {
      setPicked(null);
      fitMapToMarkers(results);
      return;
    }

    setPicked(hotel);

    if (hotel.lat && hotel.lng) {
      mapRef.current?.animateToRegion(
        {
          latitude: hotel.lat,
          longitude: hotel.lng,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        },
        400
      );
    }
  };

  const onConfirm = () => {
    if (!picked) return;

    const payload = {
      _localId: picked._localId,
      name: picked.name,
      address: picked.address ?? "",
      lat: picked.lat ?? centerLat,
      lng: picked.lng ?? centerLng,
      image: picked.image ?? "",
      rating: picked.rating ?? 0,
      stars: picked.stars ?? 0,
      review_count: picked.review_count ?? 0,
      price_per_night: picked.price_per_night ?? 0,
      price_text: formatPricePerNight(picked),
      type: picked.type ?? "โรงแรม",
      website_url: picked.website_url ?? "",
      google_hotels_url: picked.google_hotels_url ?? "",
      amenities: picked.amenities ?? [],
      check_in_time: picked.check_in_time ?? "",
      check_out_time: picked.check_out_time ?? "",
      description: picked.description ?? "",
      category: "hotel",
      source: "serpapi-google-hotels",
    };

    router.push({
      pathname: `/trip/${id}/edit`,
      params: {
        addedHotel: encodeURIComponent(JSON.stringify(payload)),
        _ts: String(Date.now()),
      },
    });
  };

  return (
    <View className="flex-1 bg-white">
      <View className="pt-12 px-4 mt-2 pb-3 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/90 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>

        <Text className="text-xl font-semibold text-gray-900">
          ค้นหาที่พักใน {province}
        </Text>

        <View className="w-10" />
      </View>

      <MapView
        ref={(r) => (mapRef.current = r)}
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        showsUserLocation
      >
        {results.map((item) => {
          if (
            typeof item.lat !== "number" ||
            !Number.isFinite(item.lat) ||
            typeof item.lng !== "number" ||
            !Number.isFinite(item.lng)
          ) {
            return null;
          }

          const isActive = picked?._localId === item._localId;

          return (
            <Marker
              key={item._localId}
              coordinate={{
                latitude: item.lat,
                longitude: item.lng,
              }}
              title={item.name}
              description={item.address || "ไม่พบที่อยู่"}
              pinColor={isActive ? "#f97316" : "red"}
              onPress={() => onSelect(item)}
            />
          );
        })}
      </MapView>

      <View className="bg-white rounded-t-3xl px-4 pt-2 pb-5 shadow-xl">
        <View className="items-center pb-2">
          <View className="w-12 h-1.5 rounded-full bg-gray-200" />
        </View>

        <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3">
          <Ionicons name="search-outline" size={18} color="#6B7280" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={`ค้นหาโรงแรมใน ${province}`}
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-2 font-sans text-gray-900"
          />
          {!!query && (
            <Pressable onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>

        <FlatList
          className="mt-3"
          data={results}
          keyExtractor={(item) => item._localId}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isActive = picked?._localId === item._localId;
            const ratingValue = getRatingValue(item.rating);

            return (
              <Pressable
                onPress={() => onSelect(item)}
                className={`p-3 rounded-2xl mb-3 border ${
                  isActive
                    ? "bg-sky-50 border-sky-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <View className="flex-row items-center">
                  <Image
                    source={{
                      uri:
                        item.image ||
                        "https://via.placeholder.com/160x120?text=Hotel",
                    }}
                    className="w-24 h-24 rounded-xl"
                  />

                  <View className="flex-1 ml-3 justify-between">
                    <View>
                      <Text
                        className="text-base font-semibold text-gray-900"
                        numberOfLines={2}
                      >
                        {item.name}
                      </Text>
                    </View>

                    <View className="mt-2">
                      <View className="flex-row items-center flex-wrap">
                        {!!item.stars && (
                          <Text className="mr-2 text-sm font-sans text-gray-700">
                            ที่พักระดับ {item.stars} ดาว
                          </Text>
                        )}
                      </View>

                      <View className="mt-1 flex-row items-center flex-wrap">
                        <RatingStars rating={ratingValue} />

                        <Text className="ml-2 text-sm font-sans text-gray-700">
                          {ratingValue > 0 ? ratingValue.toFixed(1) : "-"}
                        </Text>

                        {!!item.review_count && (
                          <Text className="ml-2 text-sm font-sans text-gray-500">
                            ({item.review_count.toLocaleString()} รีวิว)
                          </Text>
                        )}
                      </View>

                      <Text className="mt-1 text-base font-semibold text-gray-900">
                        {formatPricePerNight(item)}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      openHotelUrl(item);
                    }}
                    className="ml-2 self-center p-2"
                    hitSlop={10}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={22}
                      color="#0369a1"
                    />
                  </Pressable>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            loading ? null : (
              <View className="py-8 items-center">
                <Ionicons name="bed-outline" size={34} color="#9CA3AF" />
                <Text className="mt-2 text-center text-sm font-sans text-gray-400">
                  ไม่พบที่พักที่ค้นหา
                </Text>
              </View>
            )
          }
          style={{ maxHeight: Platform.OS === "ios" ? 340 : 360 }}
        />

        {loading && <ActivityIndicator className="mt-3" />}

        <Pressable
          onPress={onConfirm}
          disabled={!picked}
          className={`mt-3 py-4 rounded-full items-center ${
            picked ? "bg-sky-700" : "bg-gray-200"
          }`}
        >
          <Text
            className={`text-base font-semibold ${
              picked ? "text-white" : "text-gray-500"
            }`}
          >
            เลือกที่พักนี้
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
