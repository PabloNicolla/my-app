import { SafeAreaView, Pressable } from "react-native";
import { router } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { StatusBar } from "expo-status-bar";

export default function FavoritesScreen() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center">
      <StatusBar style="auto" />

      <Pressable
        onPress={() => {
          router.replace("/");
        }}
      >
        <ThemedText>Click me</ThemedText>
      </Pressable>
    </SafeAreaView>
  );
}
