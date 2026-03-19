import { useRouter, useLocalSearchParams } from "expo-router";
import { usePlan } from "@/context/PlanContext";

import PlanPreference from "@/components/preference/PlanPreference";
import { activityGroups } from "@/constants/activityData";

export default function ActivityScreen() {
  const router = useRouter();
  const { province } = useLocalSearchParams<{ province?: string }>();
  const { plan, setPlan } = usePlan();

  return (
    <PlanPreference
      step="STEP 4"
      title="อยากทำกิจกรรมอะไร"
      subtitle="เลือกกิจกรรมที่อยากทำ"
      groups={activityGroups}
      profileKey="activities"
      onNext={(selected) => {
        setPlan({
          ...plan,
          activities: selected,
        });

        router.push({
          pathname: "/plan/budget",
          params: { province },
        });
      }}
    />
  );
}