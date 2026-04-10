import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/axios";

function normalizeId(value) {
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

export default function SubmissionReviewPanel({ auctionId, socket }) {
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [loadingBySubmissionId, setLoadingBySubmissionId] = useState({});
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchPendingSubmissions = async () => {
      if (!auctionId) {
        return;
      }

      setIsLoadingInitial(true);

      try {
        const response = await axiosInstance.get(`/submissions/${auctionId}`);
        const payload = response?.data?.data || [];
        const list = Array.isArray(payload) ? payload : [];

        if (isMounted) {
          setPendingSubmissions(
            list.map((entry) => ({
              ...entry,
              submissionId: normalizeId(entry?._id || entry?.submissionId),
              status: entry?.status || "pending",
            })),
          );
        }
      } catch (error) {
        if (isMounted) {
          const message =
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            "Unable to load pending submissions right now.";
          toast.error(message);
        }
      } finally {
        if (isMounted) {
          setIsLoadingInitial(false);
        }
      }
    };

    fetchPendingSubmissions();

    return () => {
      isMounted = false;
    };
  }, [auctionId]);

  useEffect(() => {
    if (!socket || !auctionId) {
      return;
    }

    const handleSubmissionCreated = (payload) => {
      if (String(payload?.auctionId || "") !== String(auctionId)) {
        return;
      }

      const submissionId = normalizeId(payload?.submissionId);
      if (!submissionId) {
        return;
      }

      setPendingSubmissions((previousState) => {
        const alreadyExists = previousState.some(
          (entry) =>
            String(normalizeId(entry?.submissionId || entry?._id)) ===
            String(submissionId),
        );

        if (alreadyExists) {
          return previousState;
        }

        return [
          ...previousState,
          {
            submissionId,
            status: "pending",
          },
        ];
      });

      toast("New item submission arrived.");
    };

    const handleSubmissionApproved = (payload) => {
      if (String(payload?.auctionId || "") !== String(auctionId)) {
        return;
      }

      const submissionId = normalizeId(payload?.submissionId);
      if (!submissionId) {
        return;
      }

      setPendingSubmissions((previousState) =>
        previousState.filter(
          (entry) =>
            String(normalizeId(entry?.submissionId || entry?._id)) !==
            String(submissionId),
        ),
      );

      setLoadingBySubmissionId((previousState) => {
        const nextState = { ...previousState };
        delete nextState[submissionId];
        return nextState;
      });
    };

    const handleSubmissionRejected = (payload) => {
      if (String(payload?.auctionId || "") !== String(auctionId)) {
        return;
      }

      const submissionId = normalizeId(payload?.submissionId);
      if (!submissionId) {
        return;
      }

      setPendingSubmissions((previousState) =>
        previousState.filter(
          (entry) =>
            String(normalizeId(entry?.submissionId || entry?._id)) !==
            String(submissionId),
        ),
      );

      setLoadingBySubmissionId((previousState) => {
        const nextState = { ...previousState };
        delete nextState[submissionId];
        return nextState;
      });
    };

    socket.on("SUBMISSION_CREATED", handleSubmissionCreated);
    socket.on("SUBMISSION_APPROVED", handleSubmissionApproved);
    socket.on("SUBMISSION_REJECTED", handleSubmissionRejected);

    return () => {
      socket.off("SUBMISSION_CREATED", handleSubmissionCreated);
      socket.off("SUBMISSION_APPROVED", handleSubmissionApproved);
      socket.off("SUBMISSION_REJECTED", handleSubmissionRejected);
    };
  }, [auctionId, socket]);

  const handleReviewSubmission = async (submissionId, action) => {
    if (!submissionId) {
      toast.error("Submission id is missing.");
      return;
    }

    setLoadingBySubmissionId((previousState) => ({
      ...previousState,
      [submissionId]: action,
    }));

    try {
      await axiosInstance.patch(`/submissions/${submissionId}/${action}`);

      setPendingSubmissions((previousState) =>
        previousState.filter(
          (entry) =>
            String(normalizeId(entry?.submissionId || entry?._id)) !==
            String(submissionId),
        ),
      );

      toast.success(
        action === "approve"
          ? "Submission approved — item created."
          : "Submission rejected.",
      );
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        `Unable to ${action} this submission right now.`;

      toast.error(message);
    } finally {
      setLoadingBySubmissionId((previousState) => {
        const nextState = { ...previousState };
        delete nextState[submissionId];
        return nextState;
      });
    }
  };

  if (isLoadingInitial) {
    return (
      <div className="rounded-2xl border border-brand-border bg-brand-light/40 p-4 text-sm text-brand-muted">
        Loading pending submissions...
      </div>
    );
  }

  if (pendingSubmissions.length === 0) {
    return (
      <div className="rounded-2xl border border-brand-border bg-brand-light/40 p-4 text-sm text-brand-muted">
        No pending submissions yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pendingSubmissions.map((submission, index) => {
        const submissionId = normalizeId(
          submission?.submissionId || submission?._id,
        );
        const loadingAction = loadingBySubmissionId[submissionId];
        const isLoading = Boolean(loadingAction);

        return (
          <article
            key={submissionId || `submission-${index}`}
            className="rounded-2xl border border-brand-border bg-white p-4"
          >
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs font-sans text-brand-muted">
                    Submission ID
                  </p>
                  <p className="text-sm font-sans font-medium text-brand-charcoal break-all">
                    {submissionId || "Unavailable"}
                  </p>
                </div>

                <span className="inline-flex w-fit items-center rounded-full border border-brand-border bg-brand-light/50 px-3 py-1 text-[11px] sm:text-xs font-sans text-brand-charcoal capitalize">
                  {submission?.status || "pending"}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleReviewSubmission(submissionId, "approve")
                  }
                  disabled={isLoading}
                  className="inline-flex items-center justify-center rounded-full bg-brand-charcoal text-white border border-brand-charcoal px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-brand-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingAction === "approve" ? "Approving..." : "Approve"}
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewSubmission(submissionId, "reject")}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center rounded-full bg-white text-brand-charcoal border border-brand-charcoal px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-brand-light transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingAction === "reject" ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
