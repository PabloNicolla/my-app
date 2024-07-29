import TopNavBarChat from "@/components/custom-nav-bar/top-nav-bar-chat";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  Condition,
  Contact,
  Message,
  MessageStatus,
  MessageType,
  PrivateChat,
  ReceiverType,
} from "@/db/schemaTypes";
import {
  getAllMessagesByChatIdWithPagination,
  getFirstMessage,
  getFirstPrivateChat,
  insertMessage,
  insertPrivateChat,
  resetPrivateChatNotificationCount,
  updatePrivateChatById,
} from "@/db/statements";
import { SessionUser, useSession } from "@/providers/session-provider";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { addDatabaseChangeListener, useSQLiteContext } from "expo-sqlite";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { TouchableRipple, TouchableRippleProps } from "react-native-paper";
import { useWebSocket } from "@/providers/websocket-provider";
import React from "react";
import { useMessageSelection } from "@/providers/message-selection-provider";
import { Colors } from "@/constants/Colors";

type MessageItemType = Message & {
  isSelected?: boolean;
};

export default function ChatScreen() {
  const [chat, setChat] = useState<PrivateChat | null>(null);
  const [messages, setMessages] = useState<MessageItemType[]>([]);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [requestMoreMsg, setRequestMoreMsg] = useState(false);
  const PAGE_LIMIT = 50;

  const { id: chatId, contactId, canCreateChatIfNull } = useLocalSearchParams();
  const theme = useColorScheme();
  const db = useSQLiteContext();
  const { user } = useSession();

  if (!user) {
    throw Error("[CHAT_SCREEN]: ERROR: user most be logged in");
  }

  if (!contactId) {
    console.log("[CHAT_SCREEN]: ERROR: missing contactId");
  }

  const clearSelectedMessages = () => {
    setMessages((prevMessages) => {
      const newMessages = prevMessages.map((message) => {
        message.isSelected = false;
        return message;
      });
      return [...newMessages];
    });
  };

  const deleteSelectedMessages = () => {
    setMessages((prevMessages) => {
      const newMessages = prevMessages.filter((message) => {
        return !message.isSelected;
      });
      return [...newMessages];
    });
  };

  useEffect(() => {
    return () => {
      resetPrivateChatNotificationCount(db, String(chatId));
    };
  }, []);

  useEffect(() => {
    async function loadMessages() {
      setRequestMoreMsg(false);
      if (loadingMore) return;

      setLoadingMore(true);
      const newMessages = await getAllMessagesByChatIdWithPagination(
        db,
        String(chatId),
        ReceiverType.PRIVATE_CHAT,
        PAGE_LIMIT,
        page * PAGE_LIMIT,
        true,
      );
      if (newMessages) {
        setMessages((prevMessages) => [...prevMessages, ...newMessages]);
        setPage((prevPage) => prevPage + 1);
      }
      setLoadingMore(false);
    }
    loadMessages();
  }, [chatId, db, requestMoreMsg]);

  useEffect(() => {
    console.log("[CHAT_SCREEN]: GET CHAT BY ID: %d", String(chatId));
    async function getChat() {
      const chat = await getFirstPrivateChat(db, String(chatId));
      if (!chat) {
        console.log("[CHAT_SCREEN]: TopNavBarChat ERROR: invalid chatId");
      }
      setChat(chat ?? null);
    }
    getChat();
    resetPrivateChatNotificationCount(db, String(chatId));
  }, []);

  useEffect(() => {
    const listener = addDatabaseChangeListener(async (event) => {
      if (event.tableName !== "message") {
        return;
      }
      const new_message = await getFirstMessage(db, event.rowId);
      if (!new_message || new_message?.chatId !== String(chatId)) {
        return;
      }

      if (new_message.condition === Condition.NORMAL) {
        setMessages((prevMessages) => [new_message, ...prevMessages]);
      } else {
        setMessages((prevMessages) =>
          prevMessages.map((message) =>
            message.id === new_message.id ? new_message : message,
          ),
        );
      }
    });

    return () => listener.remove();
  }, [db, chatId]);

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    return <MessageItem item={item} user={user} />;
  };
  console.log("---------------------------------------");
  return (
    <ThemedView className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        className=""
        keyboardVerticalOffset={0}
      >
        <SafeAreaView className="flex-1">
          <TopNavBarChat
            contactId={String(contactId)}
            clearSelectedMessages={() => {
              clearSelectedMessages();
            }}
            deleteSelectedMessages={deleteSelectedMessages}
          />
          <View className="flex-1">
            <FlatList
              data={messages}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              indicatorStyle={theme === "dark" ? "white" : "black"}
              showsHorizontalScrollIndicator={true}
              inverted={true}
              initialNumToRender={PAGE_LIMIT}
              maxToRenderPerBatch={PAGE_LIMIT}
              windowSize={11}
              nestedScrollEnabled={true}
              onEndReachedThreshold={0.5}
              onEndReached={() => {
                if (!loadingMore) {
                  setRequestMoreMsg(true);
                }
              }}
            />
          </View>
          <HeaderComponent
            chat={chat}
            canCreateChatIfNull={String(canCreateChatIfNull)}
            contactId={String(contactId)}
            setChat={(chat: PrivateChat | null) => {
              setChat(chat);
            }}
          />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const MessageItem = React.memo(function MessageItem({
  item,
  user,
}: {
  item: MessageItemType;
  user: SessionUser;
}) {
  const theme = useColorScheme() ?? "dark";
  const [isSelected, setIsSelected] = useState(item.isSelected);
  const { isSelectionActive, selectModeHandler } = useMessageSelection();

  useEffect(() => {
    setIsSelected(item.isSelected);
  }, [item.isSelected]);

  console.log("MMM", item.id, item.isSelected);

  return (
    <TouchableRipple
      onPress={() => {
        console.log("pressed");
        if (isSelectionActive) {
          item.isSelected = selectModeHandler(item.id, !item.isSelected);
          setIsSelected(item.isSelected);
        }
      }}
      onLongPress={() => {
        console.log("long");
        item.isSelected = selectModeHandler(item.id, !item.isSelected);
        setIsSelected(item.isSelected);
      }}
      rippleColor={
        theme === "dark" ? "rgba(255, 255, 255, .32)" : "rgba(0, 0, 0, .15)"
      }
      className={`mb-4 ${item.senderId === user.id ? "items-end" : "items-start"}`}
      style={{
        backgroundColor: isSelected
          ? Colors[theme].primary + "40"
          : "#00000000",
      }}
    >
      <View
        className={`max-w-[80%] items-start rounded-md bg-gray-500/40 p-2 ${
          item.senderId === user.id
            ? "items-end bg-blue-500/40"
            : "items-start bg-gray-500/40"
        }`}
      >
        <ThemedText>
          {item.condition === Condition.DELETED
            ? "[message was deleted]"
            : item.value}{" "}
          {item.id}
        </ThemedText>
      </View>
    </TouchableRipple>
  );
});

const HeaderComponent = ({
  chat,
  canCreateChatIfNull,
  contactId,
  setChat,
}: {
  chat: PrivateChat | null;
  canCreateChatIfNull: string;
  contactId: Contact["id"];
  setChat: (chat: PrivateChat | null) => void;
}) => {
  const theme = useColorScheme() ?? "dark";
  const [messageValue, setMessageValue] = useState("");
  const { sendMessage } = useWebSocket();
  const db = useSQLiteContext();

  const handleSendMessage = async (messageValue: string) => {
    if (canCreateChatIfNull === "yes" && !chat) {
      await insertPrivateChat(db, { id: contactId, contactId });
      chat = (await getFirstPrivateChat(db, contactId)) ?? null;
      setChat(chat);
    }

    if (chat) {
      const message: Message = {
        id: -1,
        chatId: chat.id,
        condition: Condition.NORMAL,
        receiverId: chat.contactId,
        senderId: "999",
        receiverType: ReceiverType.PRIVATE_CHAT,
        senderReferenceId: -1,
        status: MessageStatus.PENDING,
        timestamp: Date.now(),
        type: MessageType.TEXT,
        value: messageValue,
      };
      const ret = await insertMessage(db, message);

      if (!ret) {
        throw Error("[CHAT_SCREEN]: ERROR: failed to insert new message in DB");
      }

      message.id = ret.lastInsertRowId;
      message.senderReferenceId = ret.lastInsertRowId;

      sendMessage({ message, type: "PRIVATE_CHAT" });

      await updatePrivateChatById(db, {
        contactId: message.receiverId,
        id: message.chatId,
        lastMessageId: ret.lastInsertRowId,
        lastMessageTimestamp: message.timestamp,
        lastMessageValue: message.value,
      });
    } else {
      console.log("[CHAT_SCREEN]: ERROR: chat is null");
    }
  };

  return (
    <View className="flex-row">
      <View className="mx-2 mb-2 justify-end overflow-hidden rounded-full">
        <TouchableRipple
          className="rounded-full bg-primary-light/50 p-3 dark:bg-primary-light"
          onPress={() => {
            console.log("pressed");
            handleSendMessage(messageValue);
            setMessageValue("");
          }}
          rippleColor={
            theme === "dark" ? "rgba(255, 255, 255, .32)" : "rgba(0, 0, 0, .15)"
          }
        >
          <Ionicons
            size={18}
            name={`${messageValue ? "send" : "mic"}`}
            color={theme === "dark" ? "white" : "black"}
          />
        </TouchableRipple>
      </View>
      <View className="mb-2 mr-2 flex-1 flex-row rounded-lg bg-background-dark/10 dark:bg-background-light/20">
        {!messageValue && (
          <View className="w-10 items-center justify-end overflow-hidden rounded-full">
            <TouchableRipple
              className="p-2"
              onPress={() => {}}
              rippleColor={
                theme === "dark"
                  ? "rgba(255, 255, 255, .32)"
                  : "rgba(0, 0, 0, .15)"
              }
            >
              <Ionicons
                size={25}
                name="camera-outline"
                color={theme === "dark" ? "white" : "black"}
              />
            </TouchableRipple>
          </View>
        )}
        <View className="w-10 items-center justify-end overflow-hidden rounded-full">
          <TouchableRipple
            className="p-2"
            onPress={() => {}}
            rippleColor={
              theme === "dark"
                ? "rgba(255, 255, 255, .32)"
                : "rgba(0, 0, 0, .15)"
            }
          >
            <Ionicons
              size={25}
              name="attach"
              color={theme === "dark" ? "white" : "black"}
            />
          </TouchableRipple>
        </View>
        <View className="max-h-40 flex-1 justify-center">
          <View className="justify-center px-2">
            <TextInput
              className="text-lg text-black dark:text-white"
              value={messageValue}
              onChangeText={(text) => {
                setMessageValue(text);
              }}
              multiline={true}
              scrollEnabled={true}
            ></TextInput>
          </View>
        </View>
        <View className="w-10 items-center justify-end overflow-hidden rounded-full">
          <TouchableRipple
            className="p-2"
            onPress={() => {
              console.log("pressed");
            }}
            rippleColor={
              theme === "dark"
                ? "rgba(255, 255, 255, .32)"
                : "rgba(0, 0, 0, .15)"
            }
          >
            <Ionicons
              size={25}
              name="happy-outline"
              color={theme === "dark" ? "white" : "black"}
            />
          </TouchableRipple>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
