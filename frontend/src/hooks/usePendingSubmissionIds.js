import { useEffect, useState } from "react";
import axiosInstance from "../lib/axios";
import { normalizeEntityId } from "../utils/auctionRoom.utils";

export default function usePendingSubmissionIds({ socket, auctionId, isHost }) {
  const [pendingSubmissionIds, setPendingSubmissionIds] = useState([]);

  useEffect(() => {
    if (!socket || !auctionId || !isHost) {
      return;
    }

    let isMounted = true;

    const fetchPendingSubmissionIds = async () => {
      try {
        const response = await axiosInstance.get(`/submissions/${auctionId}`);
        const payload = response?.data?.data || [];
        const list = Array.isArray(payload) ? payload : [];

        if (isMounted) {
          setPendingSubmissionIds(
            list
              .map((entry) =>
                normalizeEntityId(entry?._id || entry?.submissionId),
              )
              .filter(Boolean),
          );
        }
      } catch {
        // Keep socket-driven updates active even if initial hydrate fails.
      }
    };

    fetchPendingSubmissionIds();

    const handleSubmissionCreated = (payload) => {
      if (String(payload?.auctionId || "") !== String(auctionId)) {
        return;
      }

      const submissionId = normalizeEntityId(payload?.submissionId);
      if (!submissionId) {
        return;
      }

      setPendingSubmissionIds((previousState) => {
        if (previousState.includes(submissionId)) {
          return previousState;
        }

        return [...previousState, submissionId];
      });
    };

    const handleSubmissionReviewed = (payload) => {
      if (String(payload?.auctionId || "") !== String(auctionId)) {
        return;
      }

      const submissionId = normalizeEntityId(payload?.submissionId);
      if (!submissionId) {
        return;
      }

      setPendingSubmissionIds((previousState) =>
        previousState.filter((entry) => String(entry) !== String(submissionId)),
      );
    };

    socket.on("SUBMISSION_CREATED", handleSubmissionCreated);
    socket.on("SUBMISSION_APPROVED", handleSubmissionReviewed);
    socket.on("SUBMISSION_REJECTED", handleSubmissionReviewed);

    return () => {
      isMounted = false;
      socket.off("SUBMISSION_CREATED", handleSubmissionCreated);
      socket.off("SUBMISSION_APPROVED", handleSubmissionReviewed);
      socket.off("SUBMISSION_REJECTED", handleSubmissionReviewed);
    };
  }, [auctionId, isHost, socket]);

  return pendingSubmissionIds;
}
