import { useEffect, useMemo, useState } from "react";

function normalizeEntityId(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    if (typeof value?._id === "string") {
      return value._id;
    }

    if (value?._id) {
      return String(value._id);
    }

    if (typeof value?.id === "string") {
      return value.id;
    }

    if (value?.id) {
      return String(value.id);
    }
  }

  return String(value);
}

function parseEndTime(timeValue) {
  if (!timeValue) {
    return null;
  }

  const parsed = new Date(timeValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default function useFinalCallTimer({ socket, activeItemId }) {
  const [isFinalCall, setIsFinalCall] = useState(false);
  const [finalCallEndTime, setFinalCallEndTime] = useState(null);
  const [remainingMs, setRemainingMs] = useState(0);

  const normalizedActiveItemId = useMemo(
    () => normalizeEntityId(activeItemId),
    [activeItemId],
  );

  useEffect(() => {
    if (!socket) {
      return;
    }

    const resetTimer = () => {
      setIsFinalCall(false);
      setFinalCallEndTime(null);
      setRemainingMs(0);
    };

    const hydrateFinalCall = (endTimeValue) => {
      const parsedEndTime = parseEndTime(endTimeValue);

      if (!parsedEndTime) {
        resetTimer();
        return;
      }

      setIsFinalCall(true);
      setFinalCallEndTime(parsedEndTime);
      setRemainingMs(Math.max(0, parsedEndTime.getTime() - Date.now()));
    };

    const handleFinalCallStarted = (payload) => {
      const payloadItemId = normalizeEntityId(payload?.itemId);

      if (!payloadItemId || payloadItemId !== normalizedActiveItemId) {
        return;
      }

      hydrateFinalCall(payload?.finalCallEndTime);
    };

    const handleFinalCallExtended = (payload) => {
      const payloadItemId = normalizeEntityId(payload?.itemId);

      if (!payloadItemId || payloadItemId !== normalizedActiveItemId) {
        return;
      }

      hydrateFinalCall(payload?.newEndTime || payload?.finalCallEndTime);
    };

    const handleItemSold = () => {
      resetTimer();
    };

    const handleItemTransition = () => {
      resetTimer();
    };

    const handleReconnectSync = (payload) => {
      const syncItemId = normalizeEntityId(
        payload?.activeItem?._id || payload?.activeItem?.id,
      );

      if (!normalizedActiveItemId || syncItemId !== normalizedActiveItemId) {
        resetTimer();
        return;
      }

      if (payload?.isFinalCall) {
        hydrateFinalCall(payload?.finalCallEndTime);
        return;
      }

      resetTimer();
    };

    socket.on("FINAL_CALL_STARTED", handleFinalCallStarted);
    socket.on("FINAL_CALL_EXTENDED", handleFinalCallExtended);
    socket.on("ITEM_SOLD", handleItemSold);
    socket.on("ITEM_TRANSITION", handleItemTransition);
    socket.on("AUCTION_RECONNECT_SYNC", handleReconnectSync);

    return () => {
      socket.off("FINAL_CALL_STARTED", handleFinalCallStarted);
      socket.off("FINAL_CALL_EXTENDED", handleFinalCallExtended);
      socket.off("ITEM_SOLD", handleItemSold);
      socket.off("ITEM_TRANSITION", handleItemTransition);
      socket.off("AUCTION_RECONNECT_SYNC", handleReconnectSync);
    };
  }, [normalizedActiveItemId, socket]);

  useEffect(() => {
    if (!isFinalCall || !finalCallEndTime) {
      setRemainingMs(0);
      return;
    }

    const tick = () => {
      const nextRemainingMs = Math.max(
        0,
        finalCallEndTime.getTime() - Date.now(),
      );
      setRemainingMs(nextRemainingMs);

      if (nextRemainingMs === 0) {
        setIsFinalCall(false);
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 100);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [finalCallEndTime, isFinalCall]);

  useEffect(() => {
    if (!normalizedActiveItemId) {
      setIsFinalCall(false);
      setFinalCallEndTime(null);
      setRemainingMs(0);
    }
  }, [normalizedActiveItemId]);

  return {
    isFinalCall,
    remainingMs,
    finalCallEndTime,
  };
}
