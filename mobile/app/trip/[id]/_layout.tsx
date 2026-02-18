import { Stack } from "expo-router";

export default function TripDetailLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="addLocation" />
      <Stack.Screen name="addHotel" />
    </Stack>
  );
}
