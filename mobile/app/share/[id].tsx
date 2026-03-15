import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
  ImageBackground,
  Animated,
  Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import Constants from "expo-constants";
import axios from "axios";

import { useAuth } from "@/context/AuthContext";
import SubmittedPlanCard from "@/components/share/SubmittedPlanCard";
import GroupMembersSection,{ Member } from "@/components/share/GroupMember";

const { width } = Dimensions.get("window");

type Owner = {
  _id: string;
  first_name?: string;
  avatar?: string;
};

type FinalizedPlan = {
  _id: string;
  trip_title: string;
  previewImage?: string;
  total_budget: number;
};

type Group = {
  _id: string;
  name: string;
  owner: Owner;
  members?: Member[];
  createdAt: string;
  finalizedPlanId?: FinalizedPlan | null;
};

type SubmittedItem = {
  _id: string;
  userId: { _id: string; first_name?: string; avatar?: string };
  planId: {
    _id: string;
    trip_title: string;
    start_date: string;
    end_date: string;
    total_budget: number;
    previewImage?: string;
  };
};

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const API_URL = Constants.expoConfig?.extra?.API_URL;

  const [group,setGroup] = useState<Group|null>(null);
  const [membersState,setMembersState] = useState<Member[]>([]);
  const [submitted,setSubmitted] = useState<SubmittedItem[]>([]);
  const [loading,setLoading] = useState(false);

  const [progress,setProgress] = useState(0);
  const [progressText,setProgressText] = useState("");
  const [votingFinished,setVotingFinished] = useState(false);

  const [tab,setTab] = useState<"info" | "vote">("info");

  const slideAnim = useRef(new Animated.Value(0)).current;

  const switchTab = (next:"info" | "vote") => {
    setTab(next);

    Animated.spring(slideAnim, {
      toValue: next === "info" ? 0 : 1,
      useNativeDriver: false
    }).start();
  };

  useFocusEffect(
    useCallback(() => {
      if (id) loadData();
    },[id])
  );

  const loadData = async ()=>{
    try{
      setLoading(true);

      const groupRes = await axios.get<Group>(`${API_URL}/api/groups/${id}`);
      setGroup(groupRes.data);
      setMembersState(groupRes.data.members ?? []);

      const voteRes = await axios.get(`${API_URL}/api/groups/${id}/voting-state`);

      const { submissions, progress } = voteRes.data;

      setSubmitted(submissions ?? []);

      const percent =
        progress.eligibleCount === 0
          ? 0
          : progress.completedVoters / progress.eligibleCount;

      setProgress(percent);

      setProgressText(
        `${progress.completedVoters} / ${progress.eligibleCount} คนโหวตแล้ว`
      );

      setVotingFinished(
        progress.completedVoters === progress.eligibleCount
      );

    } catch (err) {
      console.log("load group error",err);
    } finally {
      setLoading(false);
    }
  };

  if(loading || !group){
    return(
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large"/>
      </View>
    )
  }

  const isOwner = String(group.owner._id) === String(user?.id);

  const indicatorTranslate = slideAnim.interpolate({
    inputRange:[0,1],
    outputRange:[0,width/2-40]
  });

  return(
    <ImageBackground
      source={require("@/assets/backgrounds/bg.png")}
      resizeMode="cover"
      className="flex-1"
    >
      <View className="flex-1 pt-14 px-5">
        
        {/* HEADER */}
        <View className="relative mb-4 h-12 justify-center">

          <Pressable
            onPress={()=>router.back()}
            className="absolute left-0 bg-white p-2 rounded-full"
          >
            <Ionicons name="chevron-back" size={24}/>
          </Pressable>

          <View className="items-center">
            <Image
              source={require("@/assets/icons/logo.png")}
              className="h-8"
              resizeMode="contain"
            />
          </View>
        </View>

        {/* GROUP TITLE */}
        <View className="bg-white/80 rounded-3xl px-6 py-6">
          <View className="flex-row justify-between items-center">

            <Text className="text-2xl font-semibold text-gray-800 font-sans">
              {group.name}
            </Text>

            {isOwner && (
              <Pressable
                onPress={()=>router.push(`/share/edit/${group._id}`)}
              >
                <Ionicons name="create-outline" size={22}/>
              </Pressable>
            )}

          </View>

          {/* TAB SWITCH */}
          <View className="mt-6">
            <View className="flex-row bg-gray-100 rounded-full p-1">

              <Animated.View
                style={{
                  position:"absolute",
                  width:"50%",
                  height:"100%",
                  backgroundColor:"white",
                  borderRadius:999,
                  transform:[{translateX:indicatorTranslate}]
                }}
              />

              <Pressable
                onPress={()=>switchTab("info")}
                className="flex-1 py-2 items-center"
              >
                <Text className="font-sans font-medium">
                  ข้อมูลกลุ่ม
                </Text>
              </Pressable>

              <Pressable
                onPress={()=>switchTab("vote")}
                className="flex-1 py-2 items-center"
              >
                <Text className="font-sans font-medium">
                  โหวตแผน
                </Text>
              </Pressable>

            </View>
          </View>
        </View>


        {/* CONTENT */}
        <ScrollView
          className="mt-4"
          contentContainerStyle={{paddingBottom:60}}
        >

          {/* GROUP INFO TAB */}
          {tab === "info" && (
            <View className="bg-white rounded-3xl p-5">
              <GroupMembersSection
                groupId={group._id}
                owner={group.owner}
                members={membersState}
                isOwner={isOwner}
                onMembersChange={setMembersState}
              />
            </View>
          )}

          {/* VOTING TAB */}
          {tab === "vote" && (
            <View className="bg-white rounded-3xl p-5">
              {/* PROGRESS */}
              <Text className="font-sans font-semibold text-lg mb-2">
                ความคืบหน้าการโหวต
              </Text>

              <View className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <View
                  style={{width:`${progress*100}%`}}
                  className="h-3 bg-blue-500"
                />
              </View>

              <Text className="text-xs text-gray-500 mt-1 mb-4 font-sans">
                {progressText}
              </Text>

              {votingFinished && (
                <View className="bg-green-50 border border-green-200 p-3 rounded-xl mb-4">
                  <Text className="text-green-700 font-sans font-medium">
                    การโหวตเสร็จสิ้นแล้ว
                  </Text>
                </View>
              )}

              {/* PLANS */}
              {submitted.map((row)=>(
                <SubmittedPlanCard
                  key={row._id}
                  plan={row.planId}
                  user={row.userId}
                  onPressVote={()=>router.push(`/share/vote?groupId=${group._id}&planId=${row.planId._id}`)}
                  onPressView={()=>router.push(`/trip/${row.planId._id}?viewOnly=true`)}
                />
              ))}

              {!votingFinished && (
                <Pressable
                  onPress={()=>router.push(`/share/select-plan?groupId=${group._id}`)}
                  className="mt-3 bg-orange-500 py-3 rounded-2xl items-center"
                >
                  <Text className="text-white font-semibold font-sans">
                    นำแผนของฉันเข้าสู่การโหวตแผน
                  </Text>
                </Pressable>
              )}

              {votingFinished && (
                <Pressable
                  onPress={()=>router.push(`/share/result/${group._id}`)}
                  className="mt-3 bg-green-600 py-3 rounded-2xl items-center"
                >
                  <Text className="text-white font-semibold font-sans">
                    ดูสรุปผลโหวต
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </ScrollView>

      </View>

    </ImageBackground>
  );
}