import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
  StatusBar,
  TextInput,
  Platform,
  Animated,
  PanResponder,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import DateTimePicker from "@react-native-community/datetimepicker";

import ActivityTab from "@/components/plan/ActivityTab";
import HotelTab, { Hotel } from "@/components/plan/HotelTab";
import BudgetTab from "@/components/plan/BudgetEditTab";
import { useEditPlanDraft } from "@/context/EditPlanContext";

const FALLBACK_LAT = "13.736717";
const FALLBACK_LNG = "100.523186";

const { width: SCREEN_W } = Dimensions.get("window");

const HEADER_H = 270;
const COLLAPSED_TOP = HEADER_H - 46;
const EXPANDED_TOP = 100;

const TABS: Array<"activity" | "hotel" | "budget"> = [
  "activity",
  "hotel",
  "budget",
];

const TAB_LABELS: Record<"activity" | "hotel" | "budget", string> = {
  activity: "แผนกิจกรรม",
  hotel: "ที่พัก",
  budget: "งบประมาณ",
};

const formatDateToYYYYMMDD = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const parseDateSafe = (value?: string) => {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const formatThaiDate = (value?: string) => {
  if (!value) return "-";
  const date = parseDateSafe(value);
  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTHB = (value: any) => {
  const num = Number(value || 0);
  return `฿${num.toLocaleString("th-TH")}`;
};

const toNumber = (value: any) => {
  if (value === null || value === undefined || value === "") return 0;
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const toFloatOrUndefined = (value: any) => {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const buildDefaultDailyBudget = (date = "") => ({
  date,
  transportation: 0,
  accommodation: 0,
  food: 0,
  others: 0,
  total: 0,
});

const buildEmptyDay = (date = "") => ({
  date,
  activities: [],
});

const getInclusiveDates = (start?: string, end?: string) => {
  const startDate = parseDateSafe(start);
  const endDate = parseDateSafe(end);

  const safeStart =
    startDate.getTime() <= endDate.getTime() ? startDate : endDate;
  const safeEnd =
    startDate.getTime() <= endDate.getTime() ? endDate : startDate;

  const dates: string[] = [];
  const cursor = new Date(safeStart);

  while (cursor.getTime() <= safeEnd.getTime()) {
    dates.push(formatDateToYYYYMMDD(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
};

const normalizeBudgetData = (raw: any) => {
  const itinerary = raw?.daily_itinerary || [];
  const incomingDaily = raw?.daily_budget || [];

  const daily_budget = itinerary.map((day: any, idx: number) => {
    const src = incomingDaily[idx] || {};
    const transportation = toNumber(src.transportation);
    const accommodation = toNumber(src.accommodation);
    const food = toNumber(src.food);
    const others = toNumber(src.others);

    return {
      ...buildDefaultDailyBudget(day?.date || raw?.start_date || ""),
      ...src,
      date: day?.date || src?.date || raw?.start_date || "",
      transportation,
      accommodation,
      food,
      others,
      total: transportation + accommodation + food + others,
    };
  });

  const total_expense_breakdown = calculateBudgetSummary(daily_budget);

  return {
    daily_budget,
    total_expense_breakdown,
    total_budget: total_expense_breakdown.total,
  };
};

const normalizeHotelStars = (value: any) => {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num) || num < 0) return 0;
  if (num > 5) return 5;
  return num;
};

const calculatePrimaryHotelStars = (hotels: any[] = []) => {
  const firstHotel = Array.isArray(hotels) ? hotels[0] : null;
  return normalizeHotelStars(firstHotel?.stars);
};

const calculateBudgetSummary = (dailyBudget: any[] = []) => {
  return (dailyBudget || []).reduce(
    (acc: any, day: any) => {
      const transportation = toNumber(day?.transportation);
      const accommodation = toNumber(day?.accommodation);
      const food = toNumber(day?.food);
      const others = toNumber(day?.others);

      acc.transportation += transportation;
      acc.accommodation += accommodation;
      acc.food += food;
      acc.others += others;
      acc.total = acc.transportation + acc.accommodation + acc.food + acc.others;

      return acc;
    },
    {
      transportation: 0,
      accommodation: 0,
      food: 0,
      others: 0,
      total: 0,
    }
  );
};

const calculateTotalPlaces = (dailyItinerary: any[] = []) => {
  return (dailyItinerary || []).reduce((sum: number, day: any) => {
    const activities = Array.isArray(day?.activities) ? day.activities : [];
    return sum + activities.length;
  }, 0);
};

const syncPlanDaysWithDateRange = (prev: any) => {
  if (!prev) return prev;

  const dates = getInclusiveDates(prev.start_date, prev.end_date);

  const prevDailyItinerary = Array.isArray(prev.daily_itinerary)
    ? prev.daily_itinerary
    : [];
  const prevDailyBudget = Array.isArray(prev.daily_budget) ? prev.daily_budget : [];

  const nextDailyItinerary = dates.map((date, idx) => {
    const oldDay = prevDailyItinerary[idx];
    return oldDay
      ? {
          ...oldDay,
          date,
          activities: Array.isArray(oldDay.activities) ? oldDay.activities : [],
        }
      : buildEmptyDay(date);
  });

  const nextDailyBudget = dates.map((date, idx) => {
    const oldBudget = prevDailyBudget[idx];
    const transportation = toNumber(oldBudget?.transportation);
    const accommodation = toNumber(oldBudget?.accommodation);
    const food = toNumber(oldBudget?.food);
    const others = toNumber(oldBudget?.others);

    return {
      ...buildDefaultDailyBudget(date),
      ...(oldBudget || {}),
      date,
      transportation,
      accommodation,
      food,
      others,
      total: transportation + accommodation + food + others,
    };
  });

  const total_expense_breakdown = calculateBudgetSummary(nextDailyBudget);

  return {
    ...prev,
    daily_itinerary: nextDailyItinerary,
    daily_budget: nextDailyBudget,
    total_expense_breakdown,
    total_budget: total_expense_breakdown.total,
  };
};

const normalizeActivityFromAddedPayload = (parsed: any) => {
  const entryFee = parsed?.entry_fee && typeof parsed.entry_fee === "object"
    ? {
        thai: toNumber(parsed.entry_fee?.thai),
        foreigner: toNumber(parsed.entry_fee?.foreigner),
      }
    : { thai: 0, foreigner: 0 };

  return {
    place_id: parsed?.place_id || "",
    place_name: String(parsed?.place_name || "").trim(),
    address: String(parsed?.address || "").trim(),
    lat: toFloatOrUndefined(parsed?.lat),
    lng: toFloatOrUndefined(parsed?.lng),
    image: String(parsed?.image || "").trim(),
    entry_fee: entryFee,
    open_time: String(parsed?.open_time || "-").trim() || "-",
    close_time: String(parsed?.close_time || "-").trim() || "-",
    time: String(parsed?.time || "06:00").trim() || "06:00",
    rating: Number.isFinite(Number(parsed?.rating)) ? Number(parsed.rating) : 0,
    review_count: toNumber(parsed?.review_count),
    category: String(parsed?.category || "").trim(),
    source: String(parsed?.source || "").trim(),
    google_maps_url: String(parsed?.google_maps_url || "").trim(),
    activity: String(parsed?.activity || "").trim(),
    _localId: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  };
};

export default function EditTripScreen() {
  const router = useRouter();
  const { id, added, addedHotel } = useLocalSearchParams<any>();
  const API_URL = Constants.expoConfig?.extra?.API_URL;
  const { getDraft, setDraft, clearDraft } = useEditPlanDraft();

  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<"activity" | "hotel" | "budget">(
    "activity"
  );
  const [activeDay, setActiveDay] = useState(0);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateField, setDateField] = useState<"start_date" | "end_date" | null>(
    null
  );
  const [infoExpanded, setInfoExpanded] = useState(false);

  const hasFetched = useRef(false);

  const sheetTop = useRef(new Animated.Value(COLLAPSED_TOP)).current;
  const lastSheetTop = useRef(COLLAPSED_TOP);

  const tabAnim = useRef(new Animated.Value(0)).current;
  const infoAnim = useRef(new Animated.Value(0)).current;

  const tabContainerHorizontalPadding = 4;
  const tabOuterWidth = SCREEN_W - 32;
  const tabInnerWidth = tabOuterWidth - tabContainerHorizontalPadding * 2;
  const tabWidth = tabInnerWidth / 3;

  useEffect(() => {
    const targetIndex = TABS.indexOf(activeTab);
    Animated.spring(tabAnim, {
      toValue: targetIndex,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
      mass: 0.8,
    }).start();
  }, [activeTab, tabAnim]);

  useEffect(() => {
    Animated.timing(infoAnim, {
      toValue: infoExpanded ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [infoExpanded, infoAnim]);

  useEffect(() => {
    if (!id || !plan) return;
    setDraft(String(id), plan);
  }, [id, plan, setDraft]);

  useEffect(() => {
    if (!id || hasFetched.current) return;
    hasFetched.current = true;

    const existingDraft = getDraft(String(id));
    if (existingDraft) {
      setPlan(existingDraft);
      setLoading(false);
      return;
    }

    const fetchPlan = async () => {
      try {
        const res = await axios.get<any>(`${API_URL}/api/plan/${id}`);
        const budgetState = normalizeBudgetData(res.data);

        const syncedPlan = syncPlanDaysWithDateRange({
          ...res.data,
          ...budgetState,
          trip_title: res.data.trip_title ?? "",
          start_date: res.data.start_date ?? formatDateToYYYYMMDD(new Date()),
          end_date: res.data.end_date ?? formatDateToYYYYMMDD(new Date()),
          daily_itinerary: (res.data.daily_itinerary || []).map(
            (day: any, dayIdx: number) => ({
              ...day,
              activities: (day.activities || []).map((a: any, idx: number) => ({
                ...a,
                entry_fee:
                  a?.entry_fee && typeof a.entry_fee === "object"
                    ? {
                        thai: toNumber(a.entry_fee?.thai),
                        foreigner: toNumber(a.entry_fee?.foreigner),
                      }
                    : { thai: 0, foreigner: 0 },
                lat: toFloatOrUndefined(a?.lat),
                lng: toFloatOrUndefined(a?.lng),
                rating: Number.isFinite(Number(a?.rating)) ? Number(a.rating) : 0,
                review_count: toNumber(a?.review_count),
                _localId: `${a.place_id || a.place_name}-${dayIdx}-${idx}-${Date.now()}`,
              })),
            })
          ),
          recommended_hotels: (res.data.recommended_hotels || []).slice(0, 1).map(
            (h: any, idx: number) => ({
              ...h,
              _localId: `hotel-${idx}-${Date.now()}`,
            })
          ),
        });

        const safeHotels = (syncedPlan.recommended_hotels || []).map((hotel: any) => ({
          ...hotel,
          stars: normalizeHotelStars(hotel?.stars),
        }));

        const safe = {
          ...syncedPlan,
          recommended_hotels: safeHotels,
          total_places: calculateTotalPlaces(syncedPlan.daily_itinerary),
          hotel_stars: calculatePrimaryHotelStars(safeHotels),
        };

        setPlan(safe);
        setDraft(String(id), safe);
      } catch (e) {
        Alert.alert("โหลดแผนไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [id, API_URL, getDraft, setDraft]);

  useEffect(() => {
    if (!plan) return;

    const maxDay = Math.max((plan.daily_itinerary?.length || 1) - 1, 0);
    if (activeDay > maxDay) {
      setActiveDay(maxDay);
    }
  }, [plan?.daily_itinerary?.length, activeDay, plan]);

  useEffect(() => {
    if (!plan) return;

    const normalizedHotels = (plan.recommended_hotels || []).map((hotel: any) => ({
      ...hotel,
      stars: normalizeHotelStars(hotel?.stars),
    }));

    const nextHotelStars = calculatePrimaryHotelStars(normalizedHotels);

    const starsChanged =
      JSON.stringify(plan.recommended_hotels || []) !== JSON.stringify(normalizedHotels);

    if (!starsChanged && (plan.hotel_stars ?? 0) === nextHotelStars) return;

    setPlan((prev: any) => {
      if (!prev) return prev;

      const prevNormalizedHotels = (prev.recommended_hotels || []).map((hotel: any) => ({
        ...hotel,
        stars: normalizeHotelStars(hotel?.stars),
      }));

      const prevHotelStars = calculatePrimaryHotelStars(prevNormalizedHotels);

      const noHotelChange =
        JSON.stringify(prev.recommended_hotels || []) === JSON.stringify(prevNormalizedHotels);

      if (noHotelChange && (prev.hotel_stars ?? 0) === prevHotelStars) {
        return prev;
      }

      return {
        ...prev,
        recommended_hotels: prevNormalizedHotels,
        hotel_stars: prevHotelStars,
      };
    });
  }, [plan?.recommended_hotels, plan?.hotel_stars]);

  useEffect(() => {
    if (!added || !plan) return;

    try {
      const decoded = decodeURIComponent(added as string);
      const parsed = JSON.parse(decoded);
      const dayIndex = Number(parsed.dayIndex ?? 0);
      if (Number.isNaN(dayIndex)) return;

      setActiveTab("activity");
      setActiveDay(dayIndex);

      setPlan((prev: any) => {
        if (!prev) return prev;

        const nextDaily = [...(prev.daily_itinerary || [])];
        const day = nextDaily[dayIndex] ?? {
          date: prev.start_date,
          activities: [],
        };

        const normalizedActivity = normalizeActivityFromAddedPayload(parsed);

        const exists = (day.activities || []).some((a: any) => {
          if (normalizedActivity.place_id && a.place_id) {
            return String(a.place_id) === String(normalizedActivity.place_id);
          }

          return (
            String(a.place_name || "").trim().toLowerCase() ===
              String(normalizedActivity.place_name || "").trim().toLowerCase() &&
            String(a.time || "") === String(normalizedActivity.time || "")
          );
        });

        if (exists) return prev;

        const merged = [...(day.activities || []), normalizedActivity].sort(
          (a: any, b: any) =>
            String(a.time || "00:00").localeCompare(String(b.time || "00:00"))
        );

        nextDaily[dayIndex] = { ...day, activities: merged };

        return {
          ...prev,
          daily_itinerary: nextDaily,
          total_places: calculateTotalPlaces(nextDaily),
        };
      });

      router.setParams({ added: undefined } as any);
    } catch (e) {
      console.log("added parse error", e);
    }
  }, [added, plan, router]);

  useEffect(() => {
    if (!plan) return;

    const nextTotalPlaces = calculateTotalPlaces(plan.daily_itinerary || []);
    if ((plan.total_places ?? 0) === nextTotalPlaces) return;

    setPlan((prev: any) => {
      if (!prev) return prev;

      const recalculated = calculateTotalPlaces(prev.daily_itinerary || []);
      if ((prev.total_places ?? 0) === recalculated) return prev;

      return {
        ...prev,
        total_places: recalculated,
      };
    });
  }, [plan?.daily_itinerary, plan?.total_places]);

  useEffect(() => {
    if (!addedHotel || !plan) return;

    try {
      const decoded = decodeURIComponent(addedHotel as string);
      const parsed = JSON.parse(decoded) as Hotel;

      setActiveTab("hotel");

      setPlan((prev: any) => {
        if (!prev) return prev;

        const newHotel = {
          ...parsed,
          _localId: parsed._localId || `hotel-${Date.now()}`,
          price_per_night: Number(parsed.price_per_night ?? 0),
          stars: normalizeHotelStars(parsed.stars),
        };

        const nextHotels = [newHotel];

        return {
          ...prev,
          recommended_hotels: nextHotels,
          hotel_stars: calculatePrimaryHotelStars(nextHotels),
        };
      });

      router.setParams({ addedHotel: undefined } as any);
    } catch (e) {
      console.log("addedHotel parse error", e);
    }
  }, [addedHotel, plan, router]);

  const hotels: Hotel[] = (plan?.recommended_hotels ?? []).slice(0, 1);

  const removeHotel = (localId: string) => {
    setPlan((prev: any) => {
      const nextHotels = (prev?.recommended_hotels || []).filter(
        (h: any) => h._localId !== localId
      );

      return {
        ...prev,
        recommended_hotels: nextHotels,
        hotel_stars: calculatePrimaryHotelStars(nextHotels),
      };
    });
  };

  const getCenterLatLng = () => {
    const h0 = plan?.recommended_hotels?.[0];
    if (h0?.lat && h0?.lng) return { lat: String(h0.lat), lng: String(h0.lng) };

    const a0 = plan?.daily_itinerary?.[0]?.activities?.[0];
    if (a0?.lat && a0?.lng) return { lat: String(a0.lat), lng: String(a0.lng) };

    return { lat: FALLBACK_LAT, lng: FALLBACK_LNG };
  };

  const onPressAddLocation = () => {
    const { lat, lng } = getCenterLatLng();
    router.push({
      pathname: `/trip/${plan._id}/addLocation`,
      params: {
        dayIndex: String(activeDay),
        province: plan.provinceName,
        provinceLat: lat,
        provinceLng: lng,
      },
    });
  };

  const onPressAddHotel = () => {
    const { lat, lng } = getCenterLatLng();
    router.push({
      pathname: `/trip/${plan._id}/addHotel`,
      params: {
        province: plan.provinceName,
        provinceLat: lat,
        provinceLng: lng,
        startDate: plan.start_date,
        endDate: plan.end_date,
      },
    });
  };

  const updatePlanField = (key: string, value: any) => {
    setPlan((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const openDatePicker = (field: "start_date" | "end_date") => {
    setDateField(field);
    setShowDatePicker(true);
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (!selectedDate || !dateField) return;

    const formatted = formatDateToYYYYMMDD(selectedDate);

    setPlan((prev: any) => {
      if (!prev) return prev;

      const next = { ...prev, [dateField]: formatted };

      if (
        dateField === "start_date" &&
        new Date(next.end_date) < new Date(formatted)
      ) {
        next.end_date = formatted;
      }

      if (
        dateField === "end_date" &&
        new Date(formatted) < new Date(next.start_date)
      ) {
        next.start_date = formatted;
      }

      return syncPlanDaysWithDateRange(next);
    });
  };

  const snapSheetTo = (to: number) => {
    Animated.spring(sheetTop, {
      toValue: to,
      useNativeDriver: false,
      damping: 22,
      stiffness: 220,
      mass: 0.9,
    }).start(() => {
      lastSheetTop.current = to;
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
        onPanResponderMove: (_, g) => {
          const next = Math.min(
            COLLAPSED_TOP,
            Math.max(EXPANDED_TOP, lastSheetTop.current + g.dy)
          );
          sheetTop.setValue(next);
        },
        onPanResponderRelease: (_, g) => {
          const mid = (EXPANDED_TOP + COLLAPSED_TOP) / 2;
          if (g.vy < -0.4) return snapSheetTo(EXPANDED_TOP);
          if (g.vy > 0.4) return snapSheetTo(COLLAPSED_TOP);
          snapSheetTo(lastSheetTop.current < mid ? EXPANDED_TOP : COLLAPSED_TOP);
        },
      }),
    [sheetTop]
  );

  const savePlan = async () => {
    try {
      const title = String(plan?.trip_title ?? "").trim();
      const computedBudgetSummary = calculateBudgetSummary(plan?.daily_budget || []);
      const budgetNumber = computedBudgetSummary.total;

      if (!title) {
        Alert.alert("กรุณากรอกชื่อแผน");
        return;
      }

      if (!plan?.start_date || !plan?.end_date) {
        Alert.alert("กรุณาเลือกวันที่เดินทาง");
        return;
      }

      if (new Date(plan.end_date) < new Date(plan.start_date)) {
        Alert.alert("วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่ม");
        return;
      }

      if (Number.isNaN(budgetNumber) || budgetNumber < 0) {
        Alert.alert("งบประมาณรวมไม่ถูกต้อง");
        return;
      }

      setSaving(true);

      const normalizedHotelsForSave = (plan?.recommended_hotels || [])
        .slice(0, 1)
        .map((hotel: any) => ({
          ...hotel,
          stars: normalizeHotelStars(hotel?.stars),
        }));

      const computedHotelStars = calculatePrimaryHotelStars(normalizedHotelsForSave);
      const computedTotalPlaces = calculateTotalPlaces(plan?.daily_itinerary || []);

      const cleaned = {
        ...plan,
        trip_title: title,
        total_budget: budgetNumber,
        total_places: computedTotalPlaces,
        hotel_stars: computedHotelStars,
        total_expense_breakdown: computedBudgetSummary,
        daily_budget: (plan.daily_budget || []).map((d: any) => {
          const transportation = toNumber(d?.transportation);
          const accommodation = toNumber(d?.accommodation);
          const food = toNumber(d?.food);
          const others = toNumber(d?.others);

          return {
            ...d,
            transportation,
            accommodation,
            food,
            others,
            total: transportation + accommodation + food + others,
          };
        }),
        daily_itinerary: (plan.daily_itinerary || []).map((d: any) => ({
          ...d,
          activities: (d.activities || []).map(({ _localId, ...rest }: any) => ({
            ...rest,
            lat: toFloatOrUndefined(rest?.lat),
            lng: toFloatOrUndefined(rest?.lng),
            rating: Number.isFinite(Number(rest?.rating)) ? Number(rest.rating) : 0,
            review_count: toNumber(rest?.review_count),
            entry_fee:
              rest?.entry_fee && typeof rest.entry_fee === "object"
                ? {
                    thai: toNumber(rest.entry_fee?.thai),
                    foreigner: toNumber(rest.entry_fee?.foreigner),
                  }
                : { thai: 0, foreigner: 0 },
          })),
        })),
        recommended_hotels: normalizedHotelsForSave.map(
          ({ _localId, ...rest }: any) => rest
        ),
      };

      await axios.put(`${API_URL}/api/plan/${id}`, cleaned);
      clearDraft(String(id));
      Alert.alert("บันทึกสำเร็จ");
      router.replace(`/trip/${id}`);
    } catch (e) {
      Alert.alert("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !plan) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  const computedBudget = calculateBudgetSummary(plan?.daily_budget || []);
  const displayTotalBudget = computedBudget.total;
  const indicatorTranslateX = tabAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, tabWidth, tabWidth * 2],
  });

  const chevronRotate = infoAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <GestureHandlerRootView className="flex-1 bg-white">
      <StatusBar barStyle="light-content" />

      <View className="flex-1 bg-white">
        <View className="relative w-full bg-black" style={{ height: HEADER_H }}>
          <Image
            source={{ uri: plan.previewImage }}
            className="h-full w-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black/30" />

          <View className="absolute top-14 left-4 right-4 z-30 flex-row items-center justify-between">
            <Pressable
              onPress={() => {
                clearDraft(String(id));
                router.replace(`/trip/${id}`);
              }}
              className="h-11 w-11 items-center justify-center rounded-full bg-white/25"
            >
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </Pressable>

            <Text className="text-xl font-semibold text-white/90">แก้ไขแผน</Text>

            <View className="w-11" />
          </View>
        </View>

        <Animated.View
          className="absolute left-0 right-0 overflow-hidden rounded-t-[30px] bg-white shadow-xl"
          style={{
            top: sheetTop,
            bottom: 0,
          }}
        >
          <View
            {...panResponder.panHandlers}
            className="items-center pt-3 pb-2"
          >
            <View className="h-1.5 w-12 rounded-full bg-gray-300" />
          </View>

          <View className="flex-1 px-4 pt-2 pb-4">
            <View className="mb-4 overflow-hidden rounded-3xl border border-gray-200 bg-white">
              <Pressable
                onPress={() => setInfoExpanded((prev) => !prev)}
                className="px-4 py-4"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="mb-1 text-sm font-sans text-gray-400">
                      ข้อมูลแผน
                    </Text>
                    <Text
                      numberOfLines={1}
                      className="text-lg font-semibold text-gray-900"
                    >
                      {plan.trip_title || "ยังไม่ได้ตั้งชื่อแผน"}
                    </Text>

                    <Text className="text-base font-medium text-gray-600">
                      {formatThaiDate(plan.start_date)} - {formatThaiDate(plan.end_date)}
                    </Text>
                    <Text className="mt-1 text-base font-medium text-gray-600">
                      งบประมาณรวม {formatTHB(displayTotalBudget)}
                    </Text>
                  </View>

                  <Animated.View
                    style={{ transform: [{ rotate: chevronRotate }] }}
                    className="h-9 w-9 items-center justify-center rounded-full bg-gray-100"
                  >
                    <Ionicons name="chevron-down" size={18} color="#4b5563" />
                  </Animated.View>
                </View>
              </Pressable>

              {infoExpanded && (
                <View className="border-t border-gray-100 px-4 pt-4 pb-4">
                  <View className="mb-4">
                    <Text className="mb-2 text-base font-medium text-gray-700">
                      ชื่อแผน
                    </Text>
                    <TextInput
                      value={plan.trip_title}
                      onChangeText={(text) => updatePlanField("trip_title", text)}
                      placeholder="กรอกชื่อแผนการเดินทาง"
                      className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base font-medium text-gray-900"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  <View className="mb-4">
                    <Text className="mb-2 text-base font-medium text-gray-700">
                      วันที่เดินทาง
                    </Text>

                    <View className="flex-row">
                      <Pressable
                        onPress={() => openDatePicker("start_date")}
                        className="mr-2 flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3"
                      >
                        <Text className="mb-1 text-sm font-sans text-gray-500">
                          วันเริ่มต้น
                        </Text>
                        <Text className="text-base font-medium text-gray-900">
                          {formatThaiDate(plan.start_date)}
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => openDatePicker("end_date")}
                        className="ml-2 flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3"
                      >
                        <Text className="mb-1 text-sm font-sans text-gray-500">
                          วันสิ้นสุด
                        </Text>
                        <Text className="text-base font-medium text-gray-900">
                          {formatThaiDate(plan.end_date)}
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  <View>
                    <Text className="mb-2 text-base font-medium text-gray-700">
                      งบประมาณรวม
                    </Text>

                    <View className="flex-row items-center rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3">
                      <Ionicons name="wallet-outline" size={18} color="#6b7280" />
                      <Text className="flex-1 px-3 text-base font-medium text-gray-900">
                        {formatTHB(displayTotalBudget)}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            <View className="mb-4">
              <View className="relative flex-row rounded-full bg-gray-100 p-1">
                <Animated.View
                  style={{
                    width: tabWidth,
                    transform: [{ translateX: indicatorTranslateX }],
                  }}
                  className="absolute left-1 top-1 bottom-1 rounded-full bg-white shadow"
                />

                {TABS.map((tabKey) => {
                  const active = activeTab === tabKey;

                  return (
                    <Pressable
                      key={tabKey}
                      onPress={() => setActiveTab(tabKey)}
                      className="z-10 flex-1 items-center py-2"
                    >
                      <Text
                        className={`text-base ${
                          active
                            ? "font-semibold text-sky-700"
                            : "font-medium text-gray-500"
                        }`}
                      >
                        {TAB_LABELS[tabKey]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="min-h-0 flex-1">
              {activeTab === "activity" ? (
                <ActivityTab
                  plan={plan}
                  setPlan={setPlan}
                  activeDay={activeDay}
                  setActiveDay={setActiveDay}
                  onPressAddLocation={onPressAddLocation}
                />
              ) : activeTab === "hotel" ? (
                <HotelTab
                  hotels={hotels}
                  onRemove={removeHotel}
                  onAdd={onPressAddHotel}
                />
              ) : (
                <BudgetTab
                  plan={plan}
                  setPlan={setPlan}
                  activeDay={activeDay}
                  setActiveDay={setActiveDay}
                />
              )}
            </View>
          </View>
        </Animated.View>

        {showDatePicker && dateField && (
          <DateTimePicker
            value={parseDateSafe(plan?.[dateField])}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleDateChange}
          />
        )}

        <View className="absolute bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white px-6 py-4">
          <Pressable
            onPress={savePlan}
            disabled={saving}
            className={`items-center rounded-full py-4 ${
              saving ? "bg-gray-400" : "bg-orange-500"
            }`}
          >
            <Text className="text-lg font-semibold text-white">
              {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไขแผน"}
            </Text>
          </Pressable>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}
