import { useEffect, useState } from "react";
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import Constants from "expo-constants";
import { useAuth } from "@/context/AuthContext";
import Ionicons from "@expo/vector-icons/build/Ionicons";

export default function VoteResultScreen() {
  const { groupId } = useLocalSearchParams<{ groupId : string }>();
  const gid = Array.isArray(groupId) ? groupId[0] : groupId;

  const API_URL = Constants.expoConfig?.extra?.API_URL;
  const router = useRouter();
  const { user } = useAuth();

  const [group,setGroup] = useState<any>(null);
  const [ranking,setRanking] = useState<any[]>([]);
  const [loading,setLoading] = useState(true);

  useEffect(() => {
    if (!gid) return;

    const loadData = async () => {
      try {

        const group = await axios.get(`${API_URL}/api/groups/${gid}`);
        setGroup(group.data);

        const voteResult = await axios.get(`${API_URL}/api/groups/${gid}/voting-result`);
        setRanking(voteResult.data.ranking);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [gid]);

  const isOwner = group?.owner?._id === user?.id;

  const finalizePlan = async (planId: string) => {
    await axios.post(`${API_URL}/api/groups/${gid}/finalize`, {planId});
    router.replace(`/share/${gid}`);
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large"/>
      </View>
    )
  }

  const winner = ranking[0];
  const others = ranking.slice(1);

  const img = (uri?: string) => uri ? {uri} : require("@/assets/images/default.png")

  return (
    <ScrollView className="flex-1 px-5 pt-12">

      {/* HEADER */}

      <View className="flex-row items-center mb-4">
        <Pressable
          onPress={()=>router.back()}
          className="mr-3"
        >
          <Ionicons name="chevron-back" size={26}/>
        </Pressable>

        <Text className="font-semibold text-lg">
          แผนอันดับ 1
        </Text>
      </View>

      {/* WINNER */}

      {winner && (
        <View className="bg-white rounded-3xl shadow-lg mb-5 overflow-hidden">

          <Image
            source={img(winner.plan?.previewImage)}
            className="w-full h-48"
          />

          <View className="p-4">

            <Text className="font-semibold text-lg mb-1">
              {winner.plan?.trip_title}
            </Text>
            <Text className="text-xs text-gray-500 mb-2">
              เจ้าของแผน: {winner.plan?.userId?.first_name ?? "-"}
            </Text>

            <View className="flex-row items-center justify-between">

              <View className="flex-row items-center">
                <Ionicons name="star" size={18} color="#F59E0B"/>
                <Text className="ml-1 font-semibold">
                  {winner.avgScore} / 5
                </Text>
              </View>

              <View className="flex-row">
                {[1,2,3,4,5].map(i => (
                <Ionicons
                  key={i}
                  name="star"
                  size={16}
                  color={i <= Math.round(winner.avgScore) ? "#F59E0B" : "#E5E7EB"}
                />
                ))}
              </View>

            </View>
          </View>
        </View>
      )}

      {/* RANK LIST */}

      {others.map((r, index) => {

        return (
          <View
            key={r.planId}
            className="bg-white rounded-2xl mb-3 p-3 flex-row"
          >

            <Image
              source={img(r.plan?.previewImage)}
              className="w-24 h-20 rounded-xl"
            />

            <View className="flex-1 ml-3">
              <Text className="font-semibold">
                อันดับ {index+2}
              </Text>

              <Text className="text-sm">
                {r.plan?.trip_title}
              </Text>

              <Text className="text-xs text-gray-500">
                คะแนนเฉลี่ย {r.avgScore} / 5
              </Text>

            </View>
          </View>
        )
      })}

      {/* OWNER BUTTON */}

      {winner && isOwner && (
        <Pressable
          onPress={()=>finalizePlan(winner.planId)}
          className="bg-orange-500 py-4 rounded-full items-center mt-4"
        >
          <Text className="text-white font-semibold">
            ใช้อันดับ 1 เป็นแผนหลัก
          </Text>
        </Pressable>
      )}

    </ScrollView>
  )
}