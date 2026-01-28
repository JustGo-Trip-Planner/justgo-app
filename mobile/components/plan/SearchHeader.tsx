import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Keyboard,
  StyleSheet,
  FlatList,
  Text,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import Constants from "expo-constants";

export default function PlanLayoutHeader() {
  const router = useRouter();
  const { province_name } = useLocalSearchParams<{ province_name?: string }>();
  const [searchText, setSearchText] = useState(province_name ?? "");
  const [suggestions, setSuggestions] = useState<{ _id: string; name_th: string; cover_image: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const API_URL = Constants.expoConfig?.extra?.API_URL;

  useEffect(() => {
    const trimmed = searchText.trim();

    if (!trimmed || trimmed === province_name) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      setLoading(true);
      axios
        .get(`${API_URL}/api/provinces/search?keyword=${encodeURIComponent(trimmed)}`)
        .then(res => setSuggestions(res.data))
        .catch(() => setSuggestions([]))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchText]);

  const handleSelect = (id: string, name: string) => {
    Keyboard.dismiss();
    setSearchText(name);
    setSuggestions([]);
    router.push({ pathname: "/plan/date", params: { province: id, province_name: name } });
  };

  return (
    <View style={{ position: "relative", zIndex: 20 }}>
      <View style={styles.wrapper}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBack}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <Ionicons name="location-sharp" size={18} color="#EC6E4C" style={styles.locationIcon} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="ค้นหาจังหวัด"
            placeholderTextColor="#666"
            returnKeyType="search"
            style={styles.input}
          />
          <TouchableOpacity onPress={() => Keyboard.dismiss()}>
            <Ionicons name="search-outline" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Autocomplete Results */}
      {suggestions.length > 0 && searchText.trim() !== province_name && (
        <View style={styles.suggestionBox}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item._id}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
            bounces={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSelect(item._id, item.name_th)}
                style={styles.suggestionItem}
              >
                <View style={styles.thumbnailWrapper}>
                  <Image
                    source={{ uri: item.cover_image }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                </View>
                <Text style={styles.suggestionText}>{item.name_th}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    zIndex: 10,
  },
  iconBack: {
    marginRight: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  locationIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 16,
    color: "#333",
    fontFamily: "Kanit_400Regular",
  },
  suggestionBox: {
    position: "absolute",    
    top: 64,                      
    left: 20,
    right: 20,
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
    zIndex: 20,
    maxHeight: 250,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
  },
  suggestionText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#222",
    fontFamily: "Kanit_400Regular",
  },
  thumbnailWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 12,
    backgroundColor: "#eee",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
});
