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
  Dimensions,
  Alert
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
  _id: string
  first_name?: string
  avatar?: string
}

type FinalizedPlan = {
  _id: string
  trip_title: string
  previewImage?: string
  total_budget: number
}

type Group = {
  _id: string
  name: string
  owner: Owner
  members?: Member[]
  createdAt: string
  finalizedPlanId?: FinalizedPlan | null
  history?: any[]
}

type SubmittedItem = {
  _id: string
  userId:{
    _id:string
    first_name?:string
    avatar?:string
  }
  planId:{
    _id:string
    trip_title:string
    start_date:string
    end_date:string
    total_budget:number
    previewImage?:string
  }
}

type VotingProgress = {
  eligibleCount:number
  completedVoters:number
  myVotedPlanIds:string[]
}

type VotingStateResponse = {
  submissions:SubmittedItem[]
  progress:VotingProgress
  group?:{
    votingClosed?:boolean
  }
}

export default function GroupDetailScreen(){

  const { id } = useLocalSearchParams<{ id:string }>()
  const router = useRouter()
  const { user } = useAuth()

  const API_URL = Constants.expoConfig?.extra?.API_URL

  const [group, setGroup] = useState<Group|null>(null)
  const [membersState, setMembersState] = useState<Member[]>([])
  const [submitted, setSubmitted] = useState<SubmittedItem[]>([])

  const [loading, setLoading] = useState(false)

  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState("")
  const [votingFinished, setVotingFinished] = useState(false)

  const [myVotes, setMyVotes] = useState<string[]>([])
  const [tab, setTab] = useState<"info"|"vote">("info")

  const slideAnim = useRef(new Animated.Value(0)).current
  const switchTab = (next: "info"|"vote") => {
    setTab(next)
    Animated.spring(slideAnim,{
      toValue: next=== "info" ? 0 : 1,
      useNativeDriver: false
    }).start()
  }

  useFocusEffect(
    useCallback(() => {
      if(id) loadData()
    },[id])
  )

  const loadData = async () => {
    try {
      setLoading(true)

      const groupRes = await axios.get<Group>(`${API_URL}/api/groups/${id}`)
      const groupData = groupRes.data

      setGroup(groupData)
      setMembersState(groupData.members ?? [])

      const voteRes = await axios.get<VotingStateResponse>(`${API_URL}/api/groups/${id}/voting-state`)
      const voteData = voteRes.data
      const submissions = voteData.submissions ?? []
      const progress = voteData.progress ?? {
        eligibleCount:0,
        completedVoters:0,
        myVotedPlanIds:[]
      }

      setSubmitted(submissions)
      setMyVotes(progress.myVotedPlanIds ?? [])

      const percent =
        progress.eligibleCount === 0 ? 0 : progress.completedVoters / progress.eligibleCount
      setProgress(percent)

      setProgressText(`${progress.completedVoters} / ${progress.eligibleCount} คน โหวตครบแล้ว`)
      setVotingFinished(voteData.group?.votingClosed ||progress.completedVoters === progress.eligibleCount)
    } catch (err) {
      console.log("load group error",err)
    } finally {
      setLoading(false)
    }
  }

  const moveTripToHistory = async () => {
    if (!group?.finalizedPlanId) return
    Alert.alert(
      "ย้ายทริปไป History",
      "ต้องการย้ายทริปนี้ไปยังประวัติการเดินทางหรือไม่",
      [
        { text:"ยกเลิก", style:"cancel" },
        {
          text:"ย้าย",
          style:"destructive",
          onPress: async () => {
            try {
              await axios.post(`${API_URL}/api/groups/${group._id}/archive`)
              await loadData()
            } catch {
              Alert.alert("ไม่สามารถย้ายทริปได้")
            }
          }
        }
      ]
    )
  }

  function formatMonthYear(dateString?: string) {
    if (!dateString) return "-"

    const d = new Date(dateString)

    return d.toLocaleDateString("th-TH", {
      month: "long",
      year: "numeric"
    })
  }

  if (loading || !group) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large"/>
      </View>
    )
  }

  const isOwner = String(group.owner._id) === String(user?.id)
  const indicatorTranslate = slideAnim.interpolate({
    inputRange:[0,1],
    outputRange:[0,width/2-40]
  })

  return (
    <ImageBackground
      source={require("@/assets/backgrounds/bg.png")}
      resizeMode="cover"
      className="flex-1"
    >
      <View className="flex-1 pt-14 px-5">

        {/* HEADER */}
        <View className="mb-4 h-12 justify-center">
          <Pressable
            onPress={() => router.back()}
            hitSlop={15}
            className="absolute left-0 z-10 w-12 h-12 items-center justify-center bg-white rounded-full"
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

          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-semibold font-sans text-gray-800 flex-1">
              {group.name}
            </Text>

            {/* ACTION ICONS */}
            <View className="flex-row items-center ml-3">
              <Pressable
                onPress={() => router.push(`/share/history/${group._id}`)}
                className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 mr-2"
              >
                <Ionicons name="archive-outline" size={22} color="#374151" />
              </Pressable>

              {isOwner && (
                <Pressable
                  onPress={() => router.push(`/share/edit/${group._id}`)}
                  className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
                >
                  <Ionicons name="create-outline" size={24} color="#374151" />
                </Pressable>
              )}
            </View>
          </View>

          {/* META INFO */}
          <View className="flex-row items-center mt-3">
            <Ionicons name="people-outline" size={18} color="#6B7280"/>
            <Text className="ml-1 text-sm font-medium font-sans text-gray-600">
              {(group.members?.length ?? 0) + 1} คน
            </Text>

            <View className="mx-2 w-1 h-1 bg-gray-400 rounded-full" />

            <Ionicons name="calendar-outline" size={18} color="#6B7280"/>
            <Text className="ml-1 text-sm font-medium font-sans text-gray-600">
              สร้างกลุ่มเมื่อ {formatMonthYear(group.createdAt)}
            </Text>
          </View>

          {/* TAB */}
          <View className="mt-6">
            <View className="flex-row bg-gray-100 rounded-full p-1">
              <Animated.View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  width: "50%",
                  height: "115%",
                  backgroundColor: "#E36F36",
                  borderRadius: 999,
                  transform: [{translateX:indicatorTranslate}]
                }}
              />

              <Pressable
                onPress={() => switchTab("info")}
                className="flex-1 py-2 items-center"
              >
                <Text
                  className={`font-semibold ${
                    tab === "info" ? "text-white" : "text-gray-500"
                  }`}
                >
                  ข้อมูลกลุ่ม
                </Text>
              </Pressable>

              <Pressable
                onPress={() => switchTab("vote")}
                className="flex-1 py-2 items-center"
              >
                <Text
                  className={`font-semibold ${
                    tab === "vote" ? "text-white" : "text-gray-500"
                  }`}
                >
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

          {/* INFO TAB */}
          {tab === "info" && (
            <View className="bg-white rounded-3xl p-5">
              {group.finalizedPlanId && (
                <View className="mb-6 bg-orange-50 border border-orange-200 rounded-2xl p-4">

                  {/* HEADER */}
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <Ionicons name="map" size={18} color="#ea580c" />
                      <Text className="ml-2 font-semibold font-sans text-orange-700">
                        แผนหลักของกลุ่ม
                      </Text>
                    </View>

                    {/* ACTION */}
                    {isOwner &&(
                      <Pressable
                        onPress={moveTripToHistory}
                        className="flex-row items-center bg-white px-3 py-1.5 rounded-full border border-orange-200"
                      >
                        <Ionicons name="archive-outline" size={14} color="#ea580c" />
                        <Text className="ml-1 text-xs font-medium font-sans text-orange-700">
                          ย้ายไป History
                        </Text>
                      </Pressable>
                    )}
                  </View>

                  {/* PLAN CARD */}
                  <Pressable
                    onPress={() =>
                      router.push(`/trip/${group.finalizedPlanId?._id}`)
                    }
                    className="flex-row items-center"
                  >
                    <Image
                      source={
                        group.finalizedPlanId.previewImage
                          ? { uri: group.finalizedPlanId.previewImage }
                          : require("@/assets/images/default.png")
                      }
                      className="w-20 h-16 rounded-xl"
                    />

                    <View className="ml-3 flex-1">
                      <Text className="font-semibold font-sans text-gray-800">
                        {group.finalizedPlanId.trip_title}
                      </Text>
                      <Text className="text-xs text-gray-500 font-medium font-sans">
                        งบประมาณ ฿{group.finalizedPlanId.total_budget?.toLocaleString()}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                  </Pressable>

                </View>
              )}

              <GroupMembersSection
                groupId={group._id}
                owner={group.owner}
                members={membersState}
                isOwner={isOwner}
                onMembersChange={setMembersState}
              />

            </View>
          )}



          {/* VOTE TAB */}
          {tab === "vote" && (
            <View className="bg-white rounded-3xl p-5">
              <Text className="font-semibold text-xl mb-2">
                ความคืบหน้าการโหวต
              </Text>
              <View className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <View
                  style={{width:`${progress*100}%`}}
                  className="h-3 bg-sky-700"
                />
              </View>

              <Text className="text-xs font-sans text-gray-500 mt-2 mb-4">
                {progressText}
              </Text>

              {votingFinished &&(
                <View className="bg-green-50 border border-green-200 p-3 rounded-xl mb-4">
                  <Text className="text-green-700 font-medium">
                    การโหวตเสร็จสิ้นแล้ว
                  </Text>
                </View>
              )}

              {submitted.map((row)=>(
                <SubmittedPlanCard
                  key={row._id}
                  plan={row.planId}
                  user={row.userId}
                  voted={myVotes.includes(row.planId._id)}
                  onPressVote={() => {
                    if (myVotes.includes(row.planId._id)) return
                    router.push(`/share/vote?groupId=${group._id}&planId=${row.planId._id}`)
                  }}
                  onPressView={() =>router.push(`/trip/${row.planId._id}?viewOnly=true`)
                  }
                />
              ))}

              {!votingFinished && (
                <Pressable
                  onPress={() => router.push(`/share/select-plan?groupId=${group._id}`)}
                  className="mt-3 bg-orange-500 py-3 rounded-2xl items-center"
                >
                  <Text className="text-white font-semibold">
                    นำแผนของฉันเข้าสู่การโหวตแผน
                  </Text>
                </Pressable>
              )}

              {votingFinished && (
                <Pressable
                  onPress={() => router.push(`/share/result/${group._id}`)}
                  className="mt-3 bg-green-600 py-3 rounded-2xl items-center"
                >
                  <Text className="text-white font-semibold">
                    ดูสรุปผลโหวต
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </ImageBackground>
  )
}