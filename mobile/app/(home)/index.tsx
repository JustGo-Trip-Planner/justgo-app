import { useEffect, useState, useMemo } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Constants from "expo-constants";
import axios from "axios";

import SearchBar from "@/components/home/SearchBar";
import DestinationCard from "@/components/home/DestinationCard";
import HomeScroll from "@/components/layout/HomeScroll";
import RegionCard from "@/components/home/RegionCard";

type Province = {
  _id: string;
  name_th: string;
  name_en: string;
  region: string;
  description: string;
  cover_image: string;
};

export default function HomeScreen() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState("ทั้งหมด");
  const [searchText, setSearchText] = useState("");

  const API_URL = Constants.expoConfig?.extra?.API_URL;

  const regionLabels = [
    "ทั้งหมด",
    "ภาคเหนือ",
    "ภาคกลาง",
    "ภาคตะวันออก",
    "ภาคตะวันตก",
    "ภาคใต้",
    "ภาคอีสาน",
  ];

  useEffect(() => {
    axios.get<any>(`${API_URL}/api/provinces`)
      .then((res) => setProvinces(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredProvinces = useMemo(() => {
    let data = provinces;

    if (selectedRegion !== "ทั้งหมด") {
      data = data.filter((p) => p.region === selectedRegion);
    }

    if (searchText.trim() !== "") {
      const keyword = searchText.toLowerCase();

      data = data.filter(
        (p) =>
          p.name_th.toLowerCase().includes(keyword) ||
          p.name_en?.toLowerCase().includes(keyword)
      );
    }

    return data;
  }, [provinces, selectedRegion, searchText]);

  const grouped = useMemo(() => {
    return filteredProvinces.reduce((acc, province) => {
      if (!acc[province.region]) acc[province.region] = [];
      acc[province.region].push(province);
      return acc;
    }, {} as Record<string, Province[]>);
  }, [filteredProvinces]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("@/assets/backgrounds/bg.png")}
      resizeMode="cover"
      className="flex-1"
    >
      <View className="flex-1 bg-white/20 backdrop-blur-md">
        <HomeScroll contentPaddingBottom={80}>
          {/* Title */}
          <Text className="text-2xl mx-4 text-sky-700 mb-1 font-semibold">
            ออกสำรวจเมืองไทยได้แล้ววันนี้
          </Text>
          <Text className="text-xl mx-4 text-sky-700 mb-4 font-sans">
            ยกระดับการท่องเที่ยวไทยของคุณ
          </Text>

          {/* Search */}
          <View className="items-center mx-3">
            <SearchBar
              placeholder="ค้นหาจังหวัดปลายทางที่คุณจะไป"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {/* Region Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
            className="mt-5 mb-6"
          >
            {regionLabels.map((region) => (
              <TouchableOpacity
                key={region}
                onPress={() => setSelectedRegion(region)}
                className={`px-4 py-2 rounded-full shadow-sm ${
                  selectedRegion === region
                    ? "bg-orange-500"
                    : "bg-white border border-gray-300"
                }`}
              >
                <Text
                  className={`text-sm font-sans ${
                    selectedRegion === region
                      ? "text-white"
                      : "text-gray-700"
                  }`}
                >
                  {region}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Render */}
          {Object.keys(grouped).length === 0 ? (
            <Text className="text-center font-sans text-gray-500 mt-10">
              ไม่พบจังหวัดที่ค้นหา
            </Text>
          ) : selectedRegion === "ทั้งหมด" ? (
            Object.entries(grouped).map(([region, provs]) => (
              <View key={region} className="mb-6">
                <View className="my-2">
                  <Text className="text-2xl text-gray-800 font-semibold">
                    {region}
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12, paddingHorizontal: 8 }}
                  className="-mx-4"
                >
                  {provs.map((prov) => (
                    <DestinationCard
                      key={prov._id}
                      id={prov._id}
                      name={prov.name_th}
                      desc={prov.description}
                      image={{ uri: prov.cover_image }}
                    />
                  ))}
                </ScrollView>
              </View>
            ))
          ) : (
            <RegionCard provinces={filteredProvinces} />
          )}
        </HomeScroll>
      </View>
    </ImageBackground>
  );
}