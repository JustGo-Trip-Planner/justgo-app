import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ImageBackground,
  Alert,
  Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import Constants from "expo-constants";

export default function VotePlanScreen() {
  const { groupId, planId } = useLocalSearchParams();
  const router = useRouter();
  const API_URL = Constants.expoConfig?.extra?.API_URL;

  const [plan,setPlan] = useState<any>(null);

  const [scores, setScores] = useState({
    suitability: 0,
    budget: 0,
    schedule: 0,
    variety: 0
  });

  const [loading,setLoading] = useState(false);

  useEffect(()=>{
    if(planId){
      axios.get(`${API_URL}/api/plan/${planId}`)
      .then(res => setPlan(res.data))
    }
  },[planId]);

  const StarRow = ({ label, keyName }) => {

    return (
      <View className="mb-4">

        <Text className="font-sans font-medium text-gray-700 mb-1">
          {label}
        </Text>

        <View className="flex-row gap-1">

          {[1,2,3,4,5].map(i => (

            <Pressable
              key={i}
              onPress={() =>
                setScores({ ...scores, [keyName]: i })
              }
            >

              <Ionicons
                name="star"
                size={26}
                color={
                  scores[keyName] >= i
                  ? "#F59E0B"
                  : "#E5E7EB"
                }
              />

            </Pressable>

          ))}

        </View>

      </View>
    );
  };

  const submitVote = async () => {

    if (Object.values(scores).some(v => v === 0)) {
      Alert.alert("กรุณาให้คะแนนทุกหัวข้อ");
      return;
    }

    try {

      setLoading(true);

      await axios.post(`${API_URL}/api/groups/${groupId}/vote`, {
        planId,
        score: scores
      });

      Alert.alert("สำเร็จ","ส่งคะแนนเรียบร้อย");
      router.back();

    } catch(e){
      Alert.alert("โหวตไม่สำเร็จ");
    } finally{
      setLoading(false);
    }
  };

  if(!plan){
    return(
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator/>
      </View>
    )
  }

  return (
    <ImageBackground
      source={require("@/assets/backgrounds/bg.png")}
      className="flex-1"
    >

      <View className="flex-1 px-6 pt-14">

        {/* HEADER */}
        <View className="flex-row items-center mb-6">

          <Pressable
            onPress={() => router.back()}
            className="mr-3"
          >
            <Ionicons name="chevron-back" size={26}/>
          </Pressable>

          <Text className="font-sans font-semibold text-lg">
            ให้คะแนนแผน
          </Text>

        </View>

        {/* CARD */}
        <View className="bg-white rounded-3xl p-5 shadow-lg">

          {/* IMAGE */}
          <Image
            source={{ uri: plan.previewImage }}
            className="w-full h-40 rounded-2xl mb-3"
          />

          {/* TITLE */}
          <Text className="font-sans font-semibold text-lg mb-1">
            {plan.trip_title}
          </Text>

          {/* CREATOR */}
          <Text className="font-sans font-medium text-gray-500">
            โดย {plan.user?.first_name}
          </Text>

          {/* BUDGET */}
          <Text className="font-sans font-medium text-gray-600 mb-4">
            งบประมาณ ~฿{plan.total_budget?.toLocaleString("th-TH")}
          </Text>

          <StarRow
            label="ความน่าสนใจโดยรวม"
            keyName="suitability"
          />

          <StarRow
            label="ความคุ้มค่า"
            keyName="budget"
          />

          <StarRow
            label="ความหลากหลายกิจกรรม"
            keyName="variety"
          />

          <StarRow
            label="ความสะดวกในการเดินทาง"
            keyName="schedule"
          />

          {/* SUBMIT */}
          <Pressable
            onPress={submitVote}
            className="bg-orange-500 rounded-full py-4 items-center mt-5 shadow-lg"
          >

            {loading
              ? <ActivityIndicator color="white"/>
              : <Text className="text-white font-sans font-semibold">
                  ส่งคะแนน
                </Text>
            }
          </Pressable>
        </View>
      </View>
    </ImageBackground>
  );
}