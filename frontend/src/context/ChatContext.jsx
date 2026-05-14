import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useAuth } from "./AuthContext";
import { io } from "socket.io-client";
import API_URL from "../config";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();

  const [socket, setSocket] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [notification, setNotification] = useState([]);

  const activeChatRef = useRef(null);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    setActiveChat(null);
    setNotification([]);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const newSocket = io(API_URL);

    setSocket(newSocket);

    newSocket.on("receiveMessage", (data) => {
      if (activeChatRef.current?._id !== data.chatId) {
        setNotification((prev) => [...prev, data]);
      }
    });

    return () => {
      newSocket.close();
    };
  }, [user]);

  // Join chat
  const joinChat = (chatId) => {
    if (socket) {
      socket.emit("joinChat", chatId);
    }
  };

  // Send message
  const sendMessage = (
    chatId,
    text,
    messageId,
    createdAt = new Date(),
    image = null
  ) => {
    if (socket && user) {
      const messageData = {
        chatId,
        sender: user._id,
        text,
        image,
        createdAt,
        _id: messageId,
      };

      socket.emit("sendMessage", messageData);

      return messageData;
    }

    return null;
  };

  return (
    <ChatContext.Provider
      value={{
        socket,
        activeChat,
        setActiveChat,
        joinChat,
        sendMessage,
        notification,
        setNotification,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);