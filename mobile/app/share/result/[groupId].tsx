import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  LayoutAnimation
} from "react-native";

import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import Constants from "expo-constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import ConfettiCannon from "react-native-confetti-cannon";

import { useAuth } from "@/context/AuthContext";

export default function VoteResultScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const gid = Array.isArray(groupId) ? groupId[0] : groupId;

  const API_URL = Constants.expoConfig?.extra?.API_URL;
  const router = useRouter();
  const { user } = useAuth();

  const [group,setGroup] = useState<any>(null);
  const [ranking,setRanking] = useState<any[]>([]);
  const [loading,setLoading] = useState(true);
  const [finalizing,setFinalizing] = useState(false);

  const [expanded,setExpanded] = useState<Record<string,boolean>>({});

  const winnerScale = useRef(new Animated.Value(0.9)).current;

  const revealAnim = useRef(new Animated.Value(0)).current;

  const [showConfetti,setShowConfetti] = useState(false);

  useEffect(()=>{

    if(!gid) return;

    const load = async()=>{

      try{

        const g = await axios.get(`${API_URL}/api/groups/${gid}`);
        setGroup(g.data);

        const vote = await axios.get(`${API_URL}/api/groups/${gid}/voting-result`);
        setRanking(vote.data.ranking);

        setShowConfetti(true);

        Animated.spring(winnerScale,{
          toValue:1,
          useNativeDriver:true
        }).start();

        Animated.timing(revealAnim,{
          toValue:1,
          duration:600,
          useNativeDriver:true
        }).start();

      }catch(e){

        console.log(e);

      }finally{

        setLoading(false);

      }

    };

    load();

  },[gid]);


  const isOwner = group?.owner?._id === user?.id;

  const finalizePlan = async(planId:string)=>{

    try{

      setFinalizing(true);

      await axios.post(`${API_URL}/api/groups/${gid}/finalize`,{planId});

      router.replace(`/share/${gid}`);

    }catch{

      Alert.alert("ไม่สามารถเลือกแผนได้");

    }finally{

      setFinalizing(false);

    }

  };


  const toggleBreakdown = (id:string)=>{

    LayoutAnimation.easeInEaseOut();

    setExpanded(prev=>({
      ...prev,
      [id]:!prev[id]
    }));

  };


  const img = (uri?:string)=> uri ? {uri} : require("@/assets/images/default.png");


const renderCriteria = (criteria:any)=>{

  if(!criteria) return null;

  const items = [
    {label:"ความน่าสนใจ",value:criteria.suitability},
    {label:"ความคุ้มค่า",value:criteria.budget},
    {label:"ความสะดวกการเดินทาง",value:criteria.schedule},
    {label:"ความหลากหลายกิจกรรม",value:criteria.variety}
  ];

    return (
      <View className="mt-3 space-y-2">
        {items.map(i => (
          <View key={i.label}>
            <View className="flex-row justify-between mb-1">
              <Text className="font-medium font-sans text-gray-600">
                {i.label}
              </Text>

              <Text className="font-semibold font-sans">
                {i.value}/5
              </Text>
            </View>

            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <View
                className="h-2 bg-orange-400"
                style={{ width: `${Math.min((i.value / 5) * 100,100)}%` }}
              />
            </View>
          </View>
        ))}
      </View>
    )
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large"/>
      </View>
    )
  }

  const winner = ranking[0];
  const others = ranking.slice(1);

  return(
    <ScrollView className="flex-1 bg-gray-50 px-5 pt-12">
      {showConfetti && (
        <ConfettiCannon count={80} origin={{x:180,y:0}} fadeOut/>
      )}

      {/* HEADER */}
      <View className="flex-row items-center mb-6">
        <Pressable onPress={()=>router.back()} className="mr-3">
          <Ionicons name="chevron-back" size={26}/>
        </Pressable>

        <Text className="text-lg font-semibold font-sans">
          ผลโหวตแผนการเดินทาง
        </Text>
      </View>


      {/* WINNER */}
      {winner && (
        <Animated.View
          style={{transform:[{scale:winnerScale}]}}
          className="bg-white rounded-3xl overflow-hidden mb-6 shadow-xl"
        >

          <Image
            source={img(winner.plan?.previewImage)}
            className="w-full h-56"
          />
          <View className="absolute top-4 right-4 bg-yellow-400 p-3 rounded-full">
            <Ionicons name="trophy" size={26} color="white"/>
          </View>


          <View className="p-5">
            <Text className="text-xl font-semibold font-sans mb-1">
              {winner.plan?.trip_title}
            </Text>

            <Text className="text-gray-500 font-medium font-sans mb-3">
              เจ้าของแผน: {winner.submitter?.first_name ?? "-"}
            </Text>

            <View className="flex-row items-center justify-between mt-3">

              {/* SCORE */}
              <View className="flex-row items-center">
                <Ionicons name="star" size={20} color="#F59E0B"
                />
                <Text className="ml-2 text-lg font-semibold font-sans text-orange-500">
                  {winner.avgScore} / 5
                </Text>
              </View>

              {/* DETAIL BUTTON */}
              <Pressable
                onPress={() => toggleBreakdown(winner.planId)}
                className="flex-row items-center"
              >
                <Text className="font-medium font-sans mr-1">
                  ดูรายละเอียด
                </Text>
                <Ionicons name={expanded[winner.planId] ? "chevron-up" : "chevron-down"} size={16} />
              </Pressable>
            </View>

            {expanded[winner.planId] && renderCriteria(winner.criteria)}
          </View>
        </Animated.View>
      )}

      {/* OTHER RANK */}
      {others.map((r,index)=>{
        const rank = index + 2;

        return (
          <Animated.View
            key={r.planId}
            style={{
              opacity:revealAnim,
              transform:[{
                translateY:revealAnim.interpolate({
                  inputRange:[0,1],
                  outputRange:[20,0]
                })
              }]
            }}
            className="bg-white rounded-2xl mb-4 p-3 shadow-sm"
          >

            <Pressable
              onPress={()=>toggleBreakdown(r.planId)}
              className="flex-row items-center"
            >
              <Image
                source={img(r.plan?.previewImage)}
                className="w-24 h-20 rounded-xl"
              />
              <View className="flex-1 ml-3">
                <Text className="font-semibold font-sans">
                  #{rank} {r.plan?.trip_title}
                </Text>

                <Text className="text-gray-500 text-xs font-medium font-sans">
                  คะแนนเฉลี่ย {r.avgScore}/5
                </Text>
              </View>

              <Ionicons
                name={expanded[r.planId]?"chevron-up":"chevron-down"}
                size={20}
              />
            </Pressable>

            {expanded[r.planId] && renderCriteria(r.criteria)}
          </Animated.View>
        )
      })}

      {/* FINALIZE */}
      {winner && isOwner && (
        <Pressable
          onPress={()=>finalizePlan(winner.planId)}
          className="bg-orange-500 py-4 rounded-full items-center mt-6"
        >

          {finalizing
            ? <ActivityIndicator color="white"/>
            : <Text className="text-white font-semibold font-sans">
                ใช้อันดับ 1 เป็นแผนหลัก
              </Text>
          }
        </Pressable>
      )}
    </ScrollView>
  );
}