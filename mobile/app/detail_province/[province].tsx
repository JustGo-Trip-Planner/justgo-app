import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Dimensions
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import Constants from "expo-constants";

const highlightIcons = [
  "partly-sunny-outline",
  "map-outline",
  "restaurant-outline",
  "bicycle-outline",
];

export default function ProvinceDetail() {
  const API_URL = Constants.expoConfig?.extra?.API_URL;
  const router = useRouter();
  const { province } = useLocalSearchParams<{ province: string }>();
  const [data, setData] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const screenW = Dimensions.get("window").width;

  useEffect(() => {
    axios.get(`${API_URL}/api/provinces/${province}`)
      .then(res => setData(res.data))
      .catch(console.error);
  }, [province]);

  if (!data) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header */}
      <ImageBackground
        source={{ uri: data.cover_image }}
        className="w-full h-96"
        resizeMode="cover"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-10 left-4 bg-white/80 rounded-full p-2"
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>

        {/* Liquid glass bottom header */}
        <View className="absolute bottom-0 w-full rounded-t-3xl overflow-hidden">
          <BlurView
            intensity={100}
            tint="dark"
            className="px-6 pt-6 pb-4"
          >
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-white text-3xl font-semibold font-sans">
                {data.name_th}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  router.push({ 
                    pathname: "../plan/date", 
                    params: {
                      province: data._id,
                      province_name: data.name_th
                    }
                  })
                }
                className="bg-orange-400 px-4 py-2 rounded-full flex-row items-center"
              >
                <Ionicons name="navigate-circle" size={18} color="#fff" />
                <Text className="text-white text-sm ml-1 font-medium font-sans">
                  เริ่มวางแผนเที่ยว
                </Text>
              </TouchableOpacity>
            </View>
            <Text className="text-white text-balance font-sans">
              {data.description}
            </Text>
          </BlurView>
        </View>
      </ImageBackground>

      {/* Main content */}
      <View className="px-6 py-6">
        {/* Highlights */}
        {data.highlights.map((hl: any, idx: number) => (
          <View key={idx} className="mb-6 border-b border-gray-200 pb-6">
            <View className="flex-row items-center mb-2">
              <Ionicons name={highlightIcons[idx % highlightIcons.length] as any} size={24} color="#111" />
              <Text className="ml-3 text-xl text-black font-semibold">
                {hl.title}
              </Text>
            </View>
            <Text className="text-base text-gray-700 font-medium font-sans leading-relaxed">
              {hl.description}
            </Text>
          </View>
        ))}

        {/* Gallery */}
        {data.gallery?.length > 0 && (
          <View className="mt-2 mb-8">
            {/* Title + Icon */}
            <View className="flex-row items-center mb-3">
              <Ionicons name="images-outline" size={24} color="#111" />
              <Text className="ml-2 text-xl font-semibold text-black">
                แกลเลอรีภาพ
              </Text>
            </View>

            {/* Thumbnails Row */}
            <View className="flex-row" style={{ gap: 12 }}>
              {data.gallery.slice(0, 3).map((img: string, idx: number) => {
                const remaining = Math.max(0, data.gallery.length - 3);
                const isLastThumb = idx === 2 && remaining > 0;

                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.9}
                    onPress={() => {
                      setActiveIndex(idx);
                      setModalVisible(true);
                    }}
                    className="rounded-2xl overflow-hidden bg-gray-200"
                    style={{ width: 100, height: 120 }}
                  >
                    <Image
                      source={{ uri: img }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />

                    {/* Overlay +N */}
                    {isLastThumb && (
                      <View className="absolute inset-0 items-center justify-center bg-black/45">
                        <View className="flex-row items-center">
                          <Ionicons name="add" size={18} color="#fff" />
                          <Text className="text-white font-semibold font-sans ml-1">
                            {remaining} รูป
                          </Text>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Full-screen gallery modal */}
            <Modal visible={modalVisible} animationType="fade" transparent>
              <View className="flex-1 bg-black">
                {/* Top bar */}
                <View className="absolute top-0 left-0 right-0 z-10 pt-12 px-4 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="images-outline" size={18} color="#fff" />
                    <Text className="text-white font-semibold font-sans ml-2">
                      {activeIndex + 1}/{data.gallery.length}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    className="bg-white/15 rounded-full p-2"
                  >
                    <Ionicons name="close" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Pager */}
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) => {
                    const x = e.nativeEvent.contentOffset.x;
                    const next = Math.round(x / screenW);
                    setActiveIndex(next);
                  }}
                  contentOffset={{ x: activeIndex * screenW, y: 0 }}
                >
                  {data.gallery.map((img: string, idx: number) => (
                    <View key={idx} style={{ width: screenW, height: "100%" }} className="items-center justify-center">
                      <Image
                        source={{ uri: img }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="contain"
                      />
                    </View>
                  ))}
                </ScrollView>
              </View>
            </Modal>
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: "../plan/date", 
              params: {
                province: data._id,
                province_name: data.name_th
              } 
            })
          }
          className="bg-orange-400 rounded-full py-4 items-center mb-10"
        >
          <Text className="text-white text-base font-semibold font-sans">
            เริ่มวางแผนการเดินทาง
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
