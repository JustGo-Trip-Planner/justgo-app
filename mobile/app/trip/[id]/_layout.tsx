import { Stack } from "expo-router";
import { EditPlanProvider } from "@/context/EditPlanContext";

export default function TripDetailLayout() {
  return (
    <EditPlanProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="edit" />
        <Stack.Screen name="addLocation" />
        <Stack.Screen name="addHotel" />
      </Stack>
    </EditPlanProvider>
  );
}
