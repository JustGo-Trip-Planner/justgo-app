import { useRouter, useLocalSearchParams } from "expo-router";
import { usePlan } from "@/context/PlanContext";

import PlanPreference from "@/components/preference/PlanPreference";
import { interestGroups } from "@/constants/interestData";

export default function PreferenceScreen() {
  const router = useRouter();
  const { province } = useLocalSearchParams<{ province?: string }>();
  const { plan, setPlan } = usePlan();

  return (
    <PlanPreference
      step="STEP 3"
      title="คุณชอบเที่ยวแบบไหน"
      subtitle="เลือกสไตล์ที่ตรงกับคุณ"
      groups={interestGroups}
      profileKey="interests"
      onNext={(selected) => {
        setPlan({
          ...plan,
          interests: selected,
        });

        router.push({
          pathname: "/plan/activity",
          params: { province },
        });
      }}
    />
  );
}