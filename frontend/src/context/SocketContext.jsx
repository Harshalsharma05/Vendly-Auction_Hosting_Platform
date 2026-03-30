import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

function getSocketUrl() {
  const socketUrl = import.meta.env.VITE_SOCKET_URL;
  if (socketUrl) {
    return socketUrl;
  }

  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return apiUrl.replace(/\/api\/?$/, "");
  }

  return "http://localhost:5000";
}

export function SocketProvider({ children }) {
  const { token, isAuthenticated, isAuthLoading, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!isAuthenticated || !token) {
      setIsSocketConnected(false);
      setSocket((previous) => {
        if (previous) {
          previous.removeAllListeners();
          previous.disconnect();
        }

        return null;
      });
      return;
    }

    const nextSocket = io(getSocketUrl(), {
      auth: { token },
      autoConnect: true,
      transports: ["websocket", "polling"],
    });

    const handleConnect = () => {
      setIsSocketConnected(true);

      // Join the personal user room so MY_BID_WON / MY_BID_UPDATE can be received
      const userId = user?._id || user?.id;
      if (userId) {
        nextSocket.emit("JOIN_USER_ROOM", { userId });
      }
    };

    const handleDisconnect = () => {
      setIsSocketConnected(false);
    };

    nextSocket.on("connect", handleConnect);
    nextSocket.on("disconnect", handleDisconnect);

    setSocket(nextSocket);

    return () => {
      nextSocket.off("connect", handleConnect);
      nextSocket.off("disconnect", handleDisconnect);
      nextSocket.removeAllListeners();
      nextSocket.disconnect();
      setIsSocketConnected(false);
      setSocket(null);
    };
  }, [isAuthLoading, isAuthenticated, token]);

  const value = useMemo(
    () => ({
      socket,
      isSocketConnected,
    }),
    [isSocketConnected, socket],
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider.");
  }

  return context;
}
