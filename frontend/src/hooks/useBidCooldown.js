import { useEffect, useRef, useState } from "react";

export default function useBidCooldown({ socket, cooldownSeconds }) {
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const [remainingCooldownMs, setRemainingCooldownMs] = useState(0);
  const cooldownIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) {
        window.clearInterval(cooldownIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const clearCooldownInterval = () => {
      if (cooldownIntervalRef.current) {
        window.clearInterval(cooldownIntervalRef.current);
        cooldownIntervalRef.current = null;
      }
    };

    const resetCooldownDisplay = () => {
      clearCooldownInterval();
      setIsCoolingDown(false);
      setRemainingCooldownMs(0);
    };

    const startCooldown = () => {
      const durationMs = Math.max(0, Number(cooldownSeconds || 0) * 1000);

      clearCooldownInterval();

      if (durationMs === 0) {
        resetCooldownDisplay();
        return;
      }

      const endTime = Date.now() + durationMs;
      setIsCoolingDown(true);
      setRemainingCooldownMs(durationMs);

      cooldownIntervalRef.current = window.setInterval(() => {
        const nextRemainingMs = Math.max(0, endTime - Date.now());
        setRemainingCooldownMs(nextRemainingMs);

        if (nextRemainingMs === 0) {
          clearCooldownInterval();
          setIsCoolingDown(false);
        }
      }, 100);
    };

    const handleCooldownActive = () => {
      startCooldown();
    };

    const handleMyBidUpdate = () => {
      // Successful bid should start the local cooldown window immediately.
      startCooldown();
    };

    socket.on("BID_COOLDOWN_ACTIVE", handleCooldownActive);
    socket.on("MY_BID_UPDATE", handleMyBidUpdate);

    return () => {
      clearCooldownInterval();
      socket.off("BID_COOLDOWN_ACTIVE", handleCooldownActive);
      socket.off("MY_BID_UPDATE", handleMyBidUpdate);
    };
  }, [cooldownSeconds, socket]);

  return {
    isCoolingDown,
    remainingCooldownMs,
  };
}
