import React from "react";
import { Modal, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopNavBar from "../custom-nav-bar/top-nav-bar";
import { Colors } from "@/constants/Colors";
import { useSQLiteContext } from "expo-sqlite";
import { useWebSocket } from "@/providers/websocket-provider";
import { useSession } from "@/providers/session-provider";
import { useMessageSelected } from "@/providers/message-selected-provider";
import { deleteMessagesByIds, getMessagesByIds } from "@/db/statements";
import { ThemedView } from "../themed-view";
import { ThemedText } from "../themed-text";
import { TouchableRipple } from "react-native-paper";

const DeleteMessageModal = ({
  isVisible,
  onClose,
  confirmDeletion,
}: Readonly<{
  isVisible: boolean;
  onClose: () => void;
  confirmDeletion: () => void;
}>) => {
  const theme = useColorScheme() ?? "dark";
  const db = useSQLiteContext();
  const { getDbPrefix, user } = useSession();
  const { selectedMessages, clearSelected } = useMessageSelected();
  const { sendMessage } = useWebSocket();

  const dbPrefix = getDbPrefix();

  if (!dbPrefix) {
    throw new Error("[DELETE_MESSAGE_MODAL]: Error: invalid db prefix");
  }

  if (!user) {
    throw new Error("[DELETE_MESSAGE_MODAL]: ERROR: user most be logged in");
  }

  const deleteForMe = async () => {
    const messageIds = Array.from(selectedMessages);
    await deleteMessagesByIds(db, dbPrefix, messageIds);
    confirmDeletion();
    clearSelected();
    onClose();
  };
  const deleteForEveryone = async () => {
    const messageIds = Array.from(selectedMessages);
    const messages = await getMessagesByIds(db, dbPrefix, messageIds);

    if (!messages) {
      throw new Error(
        "[DELETE_MESSAGE_MODAL]: failed to delete messages for everyone",
      );
    }

    await deleteMessagesByIds(db, dbPrefix, messageIds);

    sendMessage({
      data: messages,
      type: "private_chat_batch",
      receiver_id: messages[0].receiverId,
    });

    confirmDeletion();
    clearSelected();
    onClose();
  };

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TopNavBar
        title="Edit message"
        customBack={() => {
          onClose();
        }}
      />

      <SafeAreaView
        style={{ backgroundColor: Colors[theme].text + "40" }}
        className="flex-1 items-center justify-center"
      >
        <View
          style={{ backgroundColor: Colors[theme].background }}
          className="w-[70%] rounded-xl p-4"
        >
          <View className="mb-4 p-2">
            <ThemedText>Delete Messages?</ThemedText>
          </View>

          <View className="items-end">
            <View className="overflow-hidden rounded-3xl">
              <TouchableRipple
                className="p-3"
                onPress={async () => {
                  await deleteForEveryone();
                }}
                rippleColor={
                  theme === "dark"
                    ? "rgba(255, 255, 255, .32)"
                    : "rgba(0, 0, 0, .15)"
                }
              >
                <ThemedText className="font-bold text-primary-light">
                  Delete for everyone
                </ThemedText>
              </TouchableRipple>
            </View>

            <View className="overflow-hidden rounded-3xl">
              <TouchableRipple
                className="p-3"
                onPress={async () => {
                  await deleteForMe();
                }}
                rippleColor={
                  theme === "dark"
                    ? "rgba(255, 255, 255, .32)"
                    : "rgba(0, 0, 0, .15)"
                }
              >
                <ThemedText className="font-bold text-primary-light">
                  Delete for me
                </ThemedText>
              </TouchableRipple>
            </View>

            <View className="overflow-hidden rounded-3xl">
              <TouchableRipple
                className="p-3"
                onPress={() => {
                  onClose();
                }}
                rippleColor={
                  theme === "dark"
                    ? "rgba(255, 255, 255, .32)"
                    : "rgba(0, 0, 0, .15)"
                }
              >
                <ThemedText className="font-bold text-primary-light">
                  Cancel
                </ThemedText>
              </TouchableRipple>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default DeleteMessageModal;
