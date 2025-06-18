import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      {/* <Stack initialRouteName="(auth)/login" screenOptions={{ headerShown: false }}> */}
      <Stack initialRouteName="(tabs)" screenOptions={{ headerShown: false }}>
        {/* Define other screens if needed */}
      </Stack>
    </SafeAreaProvider>
  );
}