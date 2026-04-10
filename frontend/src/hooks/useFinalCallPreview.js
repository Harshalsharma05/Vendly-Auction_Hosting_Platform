import { useEffect, useRef, useState } from "react";

export default function useFinalCallPreview({
  initialDurationMs = 30_000,
  extensionMs = 10_000,
  extensionBadgeMs = 2000,
  tickMs = 100,
} = {}) {
  const [finalCallPreview, setFinalCallPreview] = useState({
    active: false,
    remainingMs: 0,
    extended: false,
  });
  const previewExtendedTimeoutRef = useRef(null);

  useEffect(() => {
    if (!finalCallPreview.active) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setFinalCallPreview((previousState) => {
        if (!previousState.active) {
          return previousState;
        }

        const nextRemainingMs = Math.max(0, previousState.remainingMs - tickMs);

        return {
          ...previousState,
          active: nextRemainingMs > 0,
          remainingMs: nextRemainingMs,
          extended: nextRemainingMs > 0 ? previousState.extended : false,
        };
      });
    }, tickMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [finalCallPreview.active, tickMs]);

  useEffect(() => {
    return () => {
      if (previewExtendedTimeoutRef.current) {
        window.clearTimeout(previewExtendedTimeoutRef.current);
      }
    };
  }, []);

  const startFinalCallPreview = () => {
    setFinalCallPreview({
      active: true,
      remainingMs: initialDurationMs,
      extended: false,
    });
  };

  const extendFinalCallPreview = () => {
    setFinalCallPreview((previousState) => {
      if (!previousState.active) {
        return previousState;
      }

      return {
        ...previousState,
        remainingMs: previousState.remainingMs + extensionMs,
        extended: true,
      };
    });

    if (previewExtendedTimeoutRef.current) {
      window.clearTimeout(previewExtendedTimeoutRef.current);
    }

    previewExtendedTimeoutRef.current = window.setTimeout(() => {
      setFinalCallPreview((previousState) => ({
        ...previousState,
        extended: false,
      }));
    }, extensionBadgeMs);
  };

  const resetFinalCallPreview = () => {
    if (previewExtendedTimeoutRef.current) {
      window.clearTimeout(previewExtendedTimeoutRef.current);
    }

    setFinalCallPreview({
      active: false,
      remainingMs: 0,
      extended: false,
    });
  };

  return {
    finalCallPreview,
    startFinalCallPreview,
    extendFinalCallPreview,
    resetFinalCallPreview,
  };
}
