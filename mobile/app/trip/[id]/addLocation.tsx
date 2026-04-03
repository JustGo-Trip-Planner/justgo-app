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
  Modal,
  Linking,
  Alert,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import Constants from "expo-constants";

type PlaceTab = "attraction" | "restaurant";

type PlaceCandidate = {
  place_id: string;
  name: string;
  formatted_address?: string;
  geometry: { location: { lat: number; lng: number } };
  photos?: { photo_reference: string }[];
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
  types?: string[];
};

type PlaceExtra = {
  open_time: string;
  close_time: string;
  entry_fee: {
    thai: number;
    foreigner: number;
  };
};

const DEFAULT_LAT = 13.736717;
const DEFAULT_LNG = 100.523186;

const buildPhotoUrl = (photoRef: string, key: string) =>
  `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${key}`;

const getRatingValue = (rating?: number) => {
  const value = Number(rating || 0);
  if (!Number.isFinite(value) || value < 0) return 0;
  if (value > 5) return 5;
  return value;
};

const cleanAddress = (address?: string) => {
  if (!address) return "";

  let cleaned = address.trim();
  cleaned = cleaned.replace(/^[A-Z0-9]{4,}\+[A-Z0-9]{2,}\s*/i, "");
  cleaned = cleaned.replace(/^[,\-\s]+/, "");

  return cleaned.trim();
};

const buildGoogleMapsUrl = (place: PlaceCandidate) => {
  const lat = place.geometry?.location?.lat;
  const lng = place.geometry?.location?.lng;

  if (
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    typeof lng === "number" &&
    Number.isFinite(lng)
  ) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${place.place_id}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${place.name} ${cleanAddress(place.formatted_address)}`
  )}`;
};

async function openPlaceInGoogleMaps(place: PlaceCandidate) {
  try {
    const url = buildGoogleMapsUrl(place);
    await Linking.openURL(url);
  } catch {
    Alert.alert("เปิด Google Maps ไม่ได้", "ไม่สามารถเปิดหน้ารายละเอียดสถานที่ได้");
  }
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

const getPlaceTypeLabel = (types?: string[], tab?: PlaceTab) => {
  const list = types ?? [];

  if (tab === "restaurant") {
    if (list.includes("cafe")) return "คาเฟ่";
    if (list.includes("bakery")) return "เบเกอรี่";
    if (list.includes("bar")) return "บาร์";
    if (list.includes("meal_takeaway")) return "อาหารกลับบ้าน";
    if (list.includes("meal_delivery")) return "เดลิเวอรี";
    if (list.includes("restaurant")) return "ร้านอาหาร";
    if (list.includes("food")) return "ร้านอาหาร";
    return "ร้านอาหาร";
  }

  if (list.includes("tourist_attraction")) return "สถานที่ท่องเที่ยว";
  if (list.includes("museum")) return "พิพิธภัณฑ์";
  if (list.includes("park")) return "สวนสาธารณะ";
  if (list.includes("zoo")) return "สวนสัตว์";
  if (list.includes("aquarium")) return "พิพิธภัณฑ์สัตว์น้ำ";
  if (list.includes("amusement_park")) return "สวนสนุก";
  if (list.includes("art_gallery")) return "หอศิลป์";
  if (list.includes("church")) return "โบสถ์";
  if (list.includes("hindu_temple")) return "ศาสนสถาน";
  if (list.includes("mosque")) return "มัสยิด";
  if (list.includes("place_of_worship")) return "ศาสนสถาน";
  if (list.includes("natural_feature")) return "แหล่งธรรมชาติ";
  if (list.includes("point_of_interest")) return "จุดน่าสนใจ";

  return "สถานที่แนะนำ";
};

const DAY_NAMES_TH = [
  "วันอาทิตย์",
  "วันจันทร์",
  "วันอังคาร",
  "วันพุธ",
  "วันพฤหัสบดี",
  "วันศุกร์",
  "วันเสาร์",
];

function normalizeTime(text?: string) {
  if (!text) return "-";
  const match = text.match(/(\d{1,2}):(\d{2})/);
  if (!match) return "-";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function parseOpeningHoursFromWeekdayText(weekdayText?: string[]) {
  if (!Array.isArray(weekdayText) || weekdayText.length === 0) {
    return { open_time: "-", close_time: "-" };
  }

  const todayName = DAY_NAMES_TH[new Date().getDay()];
  const todayLine =
    weekdayText.find((line) => line.startsWith(todayName)) || weekdayText[0];

  if (!todayLine) {
    return { open_time: "-", close_time: "-" };
  }

  if (
    todayLine.includes("เปิดตลอด 24 ชั่วโมง") ||
    todayLine.toLowerCase().includes("open 24 hours")
  ) {
    return { open_time: "00:00", close_time: "24:00" };
  }

  if (todayLine.includes("ปิด") || todayLine.toLowerCase().includes("closed")) {
    return { open_time: "-", close_time: "-" };
  }

  const matches = todayLine.match(/(\d{1,2}:\d{2})/g);
  if (matches && matches.length >= 2) {
    return {
      open_time: normalizeTime(matches[0]),
      close_time: normalizeTime(matches[1]),
    };
  }

  return { open_time: "-", close_time: "-" };
}

async function fetchPlaceExtra(
  placeId: string,
  googleKey: string
): Promise<PlaceExtra> {
  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/details/json` +
      `?place_id=${encodeURIComponent(placeId)}` +
      `&language=th` +
      `&fields=name,formatted_address,opening_hours,current_opening_hours` +
      `&key=${googleKey}`;

    const res = await axios.get<any>(url);
    const result = res.data?.result || {};

    const weekdayText =
      result?.current_opening_hours?.weekday_text ||
      result?.opening_hours?.weekday_text ||
      [];

    const parsedHours = parseOpeningHoursFromWeekdayText(weekdayText);

    return {
      open_time: parsedHours.open_time,
      close_time: parsedHours.close_time,
      // Google Places API ไม่มี field ค่าเข้าชมโดยตรง
      // ดังนั้นตามเงื่อนไข "ใช้จาก Google API เท่านั้น"
      // จึงคืนค่า 0 โดยไม่ดึงจากแหล่งอื่น
      entry_fee: {
        thai: 0,
        foreigner: 0,
      },
    };
  } catch (error) {
    console.warn("Place details error", error);
    return {
      open_time: "-",
      close_time: "-",
      entry_fee: {
        thai: 0,
        foreigner: 0,
      },
    };
  }
}

export default function AddLocationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const {
    id,
    dayIndex = "0",
    province,
    provinceLat,
    provinceLng,
  } = params as {
    id: string;
    dayIndex: string;
    province: string;
    provinceLat: string;
    provinceLng: string;
  };

  const GOOGLE_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY;

  const [activeTab, setActiveTab] = useState<PlaceTab>("attraction");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PlaceCandidate[]>([]);
  const [picked, setPicked] = useState<PlaceCandidate | null>(null);
  const [selectedTime, setSelectedTime] = useState("06:00");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const mapRef = useRef<MapView | null>(null);
  const firstLoadRef = useRef(true);

  const centerLat = Number(provinceLat ?? DEFAULT_LAT);
  const centerLng = Number(provinceLng ?? DEFAULT_LNG);

  const initialRegion: Region = useMemo(
    () => ({
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: 0.18,
      longitudeDelta: 0.18,
    }),
    [centerLat, centerLng]
  );

  const timeOptions = useMemo(() => {
    const slots: string[] = [];

    for (let h = 6; h < 24; h++) {
      for (let m = 0; m < 60; m += 5) {
        slots.push(
          `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
        );
      }
    }

    slots.push("24:00");
    return slots;
  }, []);

  const fitMapToMarkers = (items: PlaceCandidate[]) => {
    const validCoords = items.filter(
      (item) =>
        typeof item.geometry?.location?.lat === "number" &&
        Number.isFinite(item.geometry.location.lat) &&
        typeof item.geometry?.location?.lng === "number" &&
        Number.isFinite(item.geometry.location.lng)
    );

    if (!mapRef.current) return;

    if (validCoords.length === 0) {
      mapRef.current.animateToRegion(initialRegion, 400);
      return;
    }

    if (validCoords.length === 1) {
      mapRef.current.animateToRegion(
        {
          latitude: validCoords[0].geometry.location.lat,
          longitude: validCoords[0].geometry.location.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        400
      );
      return;
    }

    mapRef.current.fitToCoordinates(
      validCoords.map((item) => ({
        latitude: item.geometry.location.lat,
        longitude: item.geometry.location.lng,
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

  const runSearch = async (text: string, tab: PlaceTab) => {
    if (!GOOGLE_KEY) return;

    try {
      setLoading(true);

      const cleanedQuery = text?.trim() || "";
      const isRestaurant = tab === "restaurant";

      const searchText = cleanedQuery
        ? `${cleanedQuery} ${province}`
        : isRestaurant
        ? `ร้านอาหารแนะนำ ${province}`
        : `สถานที่ท่องเที่ยวแนะนำ ${province}`;

      const typeParam = isRestaurant ? "restaurant" : "tourist_attraction";
      const encodedQuery = encodeURIComponent(searchText);

      const url =
        `https://maps.googleapis.com/maps/api/place/textsearch/json` +
        `?query=${encodedQuery}` +
        `&region=th` +
        `&language=th` +
        `&location=${centerLat},${centerLng}` +
        `&radius=40000` +
        `&type=${typeParam}` +
        `&key=${GOOGLE_KEY}`;

      const res = await axios.get<any>(url);
      const items: PlaceCandidate[] = Array.isArray(res.data?.results)
        ? res.data.results
        : [];

      setResults(items);

      if (picked) {
        const stillExists = items.some((item) => item.place_id === picked.place_id);
        if (!stillExists) {
          setPicked(null);
        }
      }

      requestAnimationFrame(() => {
        fitMapToMarkers(items);
      });
    } catch (e) {
      console.warn("Place search error", e);
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
      runSearch("", activeTab);
      return;
    }

    const t = setTimeout(() => {
      runSearch(query, activeTab);
    }, 450);

    return () => clearTimeout(t);
  }, [query, activeTab, province, provinceLat, provinceLng]);

  const onChangeTab = (tab: PlaceTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setPicked(null);
  };

  const onSelect = (place: PlaceCandidate) => {
    const isSame = picked?.place_id === place.place_id;

    if (isSame) {
      setPicked(null);
      fitMapToMarkers(results);
      return;
    }

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

  const onConfirm = async () => {
    if (!picked || !GOOGLE_KEY || confirming) return;

    try {
      setConfirming(true);

      const isRestaurant = activeTab === "restaurant";
      const cleanedAddress = cleanAddress(picked.formatted_address);

      const extra = await fetchPlaceExtra(picked.place_id, GOOGLE_KEY);

      const payload = {
        place_name: picked.name,
        address: cleanedAddress,
        lat: picked.geometry.location.lat,
        lng: picked.geometry.location.lng,
        image: picked.photos?.[0]
          ? buildPhotoUrl(picked.photos[0].photo_reference, GOOGLE_KEY)
          : "",
        open_time: extra.open_time,
        close_time: extra.close_time,
        entry_fee: extra.entry_fee,
        time: selectedTime,
        dayIndex: String(dayIndex ?? "0"),
        place_id: picked.place_id,
        rating: picked.rating ?? 0,
        review_count: picked.user_ratings_total ?? 0,
        category: isRestaurant
          ? "restaurant"
          : getPlaceTypeLabel(picked.types, activeTab),
        source: "google-places-api",
        google_maps_url: buildGoogleMapsUrl(picked),
      };

      setShowTimePicker(false);

      router.push({
        pathname: `/trip/${id}/edit`,
        params: {
          added: encodeURIComponent(JSON.stringify(payload)),
          _ts: String(Date.now()),
        },
      });
    } catch (error) {
      console.warn("Confirm add place error", error);
      Alert.alert("เพิ่มสถานที่ไม่สำเร็จ", "ไม่สามารถดึงรายละเอียดสถานที่ได้");
    } finally {
      setConfirming(false);
    }
  };

  const placeholderText =
    activeTab === "restaurant"
      ? `ค้นหาร้านอาหารใน ${province}`
      : `ค้นหาสถานที่ใน ${province}`;

  const emptyText =
    activeTab === "restaurant"
      ? "ไม่พบร้านอาหารที่ค้นหา"
      : "ไม่พบสถานที่ที่ค้นหา";

  const headerTitle =
    activeTab === "restaurant"
      ? `เพิ่มร้านอาหารใน ${province}`
      : `เพิ่มสถานที่ใน ${province}`;

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
          {headerTitle}
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
          const lat = item.geometry?.location?.lat;
          const lng = item.geometry?.location?.lng;

          if (
            typeof lat !== "number" ||
            !Number.isFinite(lat) ||
            typeof lng !== "number" ||
            !Number.isFinite(lng)
          ) {
            return null;
          }

          const isActive = picked?.place_id === item.place_id;

          return (
            <Marker
              key={item.place_id}
              coordinate={{ latitude: lat, longitude: lng }}
              title={item.name}
              description={cleanAddress(item.formatted_address) || "ไม่พบที่อยู่"}
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

        <View className="flex-row bg-gray-100 rounded-2xl p-1 mb-3">
          <Pressable
            onPress={() => onChangeTab("attraction")}
            className={`flex-1 py-2.5 rounded-xl items-center ${
              activeTab === "attraction" ? "bg-white" : ""
            }`}
          >
            <Text
              className={`font-semibold ${
                activeTab === "attraction" ? "text-orange-600" : "text-gray-500"
              }`}
            >
              สถานที่ท่องเที่ยว
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onChangeTab("restaurant")}
            className={`flex-1 py-2.5 rounded-xl items-center ${
              activeTab === "restaurant" ? "bg-white" : ""
            }`}
          >
            <Text
              className={`font-semibold ${
                activeTab === "restaurant" ? "text-orange-600" : "text-gray-500"
              }`}
            >
              ร้านอาหาร
            </Text>
          </Pressable>
        </View>

        <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3">
          <Ionicons name="search-outline" size={18} color="#6B7280" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={placeholderText}
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
          keyExtractor={(item) => item.place_id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isActive = picked?.place_id === item.place_id;
            const ratingValue = getRatingValue(item.rating);
            const imageUrl = item.photos?.[0]
              ? buildPhotoUrl(item.photos[0].photo_reference, GOOGLE_KEY || "")
              : "https://via.placeholder.com/160x120?text=Place";
            const cleanedAddress = cleanAddress(item.formatted_address);

            return (
              <Pressable
                onPress={() => onSelect(item)}
                className={`p-3 rounded-2xl mb-3 border ${
                  isActive
                    ? "bg-orange-50 border-orange-500"
                    : "bg-white border-gray-200"
                }`}
              >
                <View className="flex-row items-center">
                  <Image
                    source={{ uri: imageUrl }}
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

                      <Text className="mt-1 text-sm font-medium text-orange-600">
                        {getPlaceTypeLabel(item.types, activeTab)}
                      </Text>
                    </View>

                    <View className="mt-2">
                      <View className="flex-row items-center flex-wrap">
                        <RatingStars rating={ratingValue} />

                        <Text className="ml-2 text-sm font-sans text-gray-700">
                          {ratingValue > 0 ? ratingValue.toFixed(1) : "-"}
                        </Text>

                        {!!item.user_ratings_total && (
                          <Text className="ml-2 text-sm font-sans text-gray-500">
                            ({item.user_ratings_total.toLocaleString()} รีวิว)
                          </Text>
                        )}
                      </View>

                      <Text
                        numberOfLines={2}
                        className="mt-1 text-sm font-sans text-gray-500"
                      >
                        {cleanedAddress || "ไม่พบที่อยู่"}
                      </Text>

                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          openPlaceInGoogleMaps(item);
                        }}
                        className="mt-2 self-start flex-row items-center rounded-full bg-sky-50 px-2.5 py-1.5"
                        hitSlop={8}
                      >
                        <Ionicons
                          name="map-outline"
                          size={15}
                          color="#0369A1"
                        />
                        <Text className="ml-1 text-sm font-medium text-sky-700">
                          ดูบนแผนที่
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            loading ? null : (
              <View className="py-8 items-center">
                <Ionicons
                  name={
                    activeTab === "restaurant"
                      ? "restaurant-outline"
                      : "location-outline"
                  }
                  size={34}
                  color="#9CA3AF"
                />
                <Text className="mt-2 text-center text-sm font-sans text-gray-400">
                  {emptyText}
                </Text>
              </View>
            )
          }
          style={{ maxHeight: Platform.OS === "ios" ? 340 : 360 }}
        />

        {loading && <ActivityIndicator className="mt-3" />}

        <Pressable
          onPress={() => picked && setShowTimePicker(true)}
          disabled={!picked}
          className={`mt-3 py-4 rounded-full items-center ${
            picked ? "bg-orange-500" : "bg-gray-200"
          }`}
        >
          <Text
            className={`text-base font-semibold ${
              picked ? "text-white" : "text-gray-500"
            }`}
          >
            {activeTab === "restaurant" ? "เพิ่มร้านอาหารนี้" : "เพิ่มสถานที่นี้"}
          </Text>
        </Pressable>
      </View>

      <Modal visible={showTimePicker} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[420px] rounded-t-3xl bg-white px-4 pt-4 pb-5">
            <Text className="mb-3 text-center text-xl font-medium text-gray-900">
              เลือกเวลา
            </Text>

            <FlatList
              data={timeOptions}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setSelectedTime(item)}
                  className={`items-center rounded-xl py-3.5 ${
                    selectedTime === item ? "bg-orange-100" : "bg-transparent"
                  }`}
                >
                  <Text
                    className={`text-lg ${
                      selectedTime === item
                        ? "text-xl font-semibold text-orange-600"
                        : "text-xl font-sans text-gray-900"
                    }`}
                  >
                    {item}
                  </Text>
                </Pressable>
              )}
            />

            <Pressable
              onPress={onConfirm}
              disabled={confirming}
              className={`mt-4 items-center rounded-full py-3.5 ${
                confirming ? "bg-orange-300" : "bg-orange-500"
              }`}
            >
              {confirming ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-semibold text-white">
                  ยืนยันและเพิ่ม
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => !confirming && setShowTimePicker(false)}
              className="mt-2.5 items-center rounded-full bg-gray-100 py-3"
            >
              <Text className="font-medium text-gray-700">ยกเลิก</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
