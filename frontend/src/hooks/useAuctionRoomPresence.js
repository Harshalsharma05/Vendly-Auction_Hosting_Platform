import { useEffect } from "react";
import toast from "react-hot-toast";

export default function useAuctionRoomPresence({
  socket,
  auctionId,
  isJoined,
  setIsJoined,
  setIsJoining,
  isHost,
  isSocketConnected,
}) {
  useEffect(() => {
    if (!socket || !auctionId) {
      return;
    }

    const handleAuctionJoined = (payload) => {
      const message = payload?.message || "A participant joined this auction.";

      toast(message, {
        duration: 2200,
        icon: "",
        style: {
          background: "#111827",
          color: "#f9fafb",
          border: "1px solid #1f2937",
        },
      });
    };

    socket.on("AUCTION_JOINED", handleAuctionJoined);

    const rejoinOnReconnect = () => {
      if (isJoined) {
        socket.emit("JOIN_AUCTION", auctionId);
      }
    };

    socket.on("connect", rejoinOnReconnect);

    return () => {
      if (isJoined) {
        socket.emit("LEAVE_AUCTION", auctionId);
      }
      socket.off("AUCTION_JOINED", handleAuctionJoined);
      socket.off("connect", rejoinOnReconnect);
    };
  }, [auctionId, isJoined, socket]);

  useEffect(() => {
    if (!socket || !auctionId) {
      return;
    }

    const handleBidCooldownActive = (payload) => {
      const message =
        payload?.message || "Bid cooldown is active. Please wait.";
      toast(message, { duration: 2200 });
    };

    socket.on("BID_COOLDOWN_ACTIVE", handleBidCooldownActive);

    return () => {
      socket.off("BID_COOLDOWN_ACTIVE", handleBidCooldownActive);
    };
  }, [auctionId, socket]);

  useEffect(() => {
    setIsJoined(false);
    setIsJoining(false);
  }, [auctionId, setIsJoined, setIsJoining]);

  useEffect(() => {
    if (!socket || !auctionId || !isHost) {
      return;
    }

    const joinAsHost = () => {
      socket.emit("JOIN_AUCTION", auctionId);
      console.log("Host auto-joined auction room:", auctionId);
    };

    if (isSocketConnected) {
      joinAsHost();
    }

    socket.on("connect", joinAsHost);

    return () => {
      socket.off("connect", joinAsHost);
      socket.emit("LEAVE_AUCTION", auctionId);
    };
  }, [auctionId, isHost, isSocketConnected, socket]);
}
