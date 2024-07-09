import {
  Pressable,
  View,
  TextInput,
  Image,
  useColorScheme,
} from "react-native";
import { useEffect, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import { useSession } from "@/providers/session-provider";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import PrimaryButton from "@/components/buttons/PrimaryButton";

export default function SignUpScreen() {
  const { login, isLoggedIn } = useSession();

  const theme = useColorScheme() ?? "light";

  const PasswordInputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    if (PasswordInputRef.current) {
      const timer = setTimeout(() => {
        PasswordInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <ThemedView className="flex-1">
      <StatusBar style="auto" />

      <SafeAreaView className="flex-1">
        <View className="relative flex-1 items-center justify-start">
          <View className="w-full flex-row items-center justify-between px-2">
            <View className="flex-row items-center">
              <Pressable
                onPress={() => {
                  router.back();
                }}
              >
                <MaterialIcons
                  name="arrow-back"
                  size={30}
                  color={theme === "light" ? "black" : "white"}
                />
              </Pressable>
              <Image
                source={require("@/assets/images/brand/Logo.png")}
                className="ml-4 h-[60] w-[60]"
              />
            </View>
            <View className="items-center">
              <Pressable
                onPress={() => {
                  router.replace("/sign-in");
                }}
              >
                <ThemedText className="text-lg font-bold">Log in</ThemedText>
              </Pressable>
            </View>
          </View>

          <View className="mt-[10%] w-[80%]">
            <ThemedText className="mb-5 text-3xl font-bold">
              Lets Get Started!
            </ThemedText>
            <ThemedText className="mb-10 text-lg text-text-light/70 dark:text-text-dark/70">
              Create your account
            </ThemedText>

            <View className="relative mb-5 h-[60] w-full rounded-xl border-2 border-black dark:border-white">
              <View className="ml-2 flex-1 justify-center">
                <ThemedText className="absolute left-0 top-0 text-xs text-text-light/50 dark:text-text-dark/70">
                  Email
                </ThemedText>
                <TextInput
                  className="text-lg text-text-light dark:text-text-dark"
                  keyboardType="email-address"
                ></TextInput>
              </View>
            </View>

            <View className="relative mb-5 h-[60] w-full rounded-xl border-2 border-black dark:border-white">
              <View className="ml-2 flex-1 justify-center">
                <ThemedText className="absolute left-0 top-0 text-xs text-text-light/50 dark:text-text-dark/70">
                  Password
                </ThemedText>
                <TextInput
                  ref={PasswordInputRef}
                  className="text-lg text-text-light dark:text-text-dark"
                  keyboardType="default"
                  placeholder="Password"
                ></TextInput>
              </View>
            </View>

            <PrimaryButton
              handlePress={() => {
                console.log(isLoggedIn, "before");
                login();
                console.log(isLoggedIn, "after");

                router.dismissAll();
                router.replace("/");
              }}
              title="CREATE ACCOUNT"
            />
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}
