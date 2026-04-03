import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";

const INITIAL_FORM = {
  title: "",
  description: "",
  startTime: "",
  endTime: "",
  startingPrice: "",
  bidIncrement: "",
  status: "draft",
};

function FormField({ label, hint, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-sm font-sans text-brand-charcoal font-medium">
          {label}
        </label>
        {hint && (
          <span className="text-[11px] font-sans text-brand-muted">{hint}</span>
        )}
      </div>
      {children}
      {error && (
        <p className="text-[11px] font-sans text-red-500 mt-0.5">{error}</p>
      )}
    </div>
  );
}

const INPUT_CLASS = [
  "w-full rounded-2xl border border-brand-border bg-white px-4 py-3",
  "text-sm font-sans text-brand-charcoal placeholder:text-brand-muted/70",
  "outline-none focus:ring-2 focus:ring-brand-rust/20 focus:border-brand-rust/40",
  "transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed",
].join(" ");

function validate(form) {
  const errors = {};

  if (!form.title.trim()) {
    errors.title = "Title is required.";
  } else if (form.title.trim().length < 3) {
    errors.title = "Title must be at least 3 characters.";
  }

  if (!form.description.trim()) {
    errors.description = "Description is required.";
  }

  if (!form.startTime) {
    errors.startTime = "Start time is required.";
  }

  if (!form.endTime) {
    errors.endTime = "End time is required.";
  }

  if (form.startTime && form.endTime && form.endTime <= form.startTime) {
    errors.endTime = "End time must be after start time.";
  }

  if (form.startingPrice === "" || Number(form.startingPrice) < 0) {
    errors.startingPrice = "Starting price must be 0 or more.";
  }

  if (form.bidIncrement === "" || Number(form.bidIncrement) < 0) {
    errors.bidIncrement = "Bid increment must be 0 or more.";
  }

  return errors;
}

export default function CreateAuctionPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isClient = isAuthenticated && user?.role === "client";

  function handleChange(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
    if (errors[field]) {
      setErrors((previous) => ({ ...previous, [field]: undefined }));
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please fix the errors before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        startingPrice: Number(form.startingPrice),
        bidIncrement: Number(form.bidIncrement),
        status: form.status,
      };

      const response = await axiosInstance.post("/auctions", payload);
      const created = response?.data?.auction || response?.data?.data || null;
      const auctionId = created?._id || created?.id;

      toast.success("Auction created successfully.");

      if (auctionId) {
        navigate(`/auction/${auctionId}`);
      } else {
        navigate("/my-auctions");
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Unable to create auction right now.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="pt-23 min-h-screen bg-white">
      <section className="px-6 lg:px-10 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="mb-5">
            <Link
              to="/my-auctions"
              className="text-[12px] font-sans text-brand-muted hover:text-brand-charcoal underline underline-offset-2 transition-colors duration-150"
            >
              Back to My Auctions
            </Link>
          </div>

          {/* ── Page header ── */}
          <div className="rounded-[28px] border border-brand-border bg-white p-6 sm:p-8">
            <h1 className="font-display text-3xl sm:text-4xl text-brand-charcoal leading-tight">
              Create Auction
            </h1>
            <p className="text-sm sm:text-base text-brand-muted mt-2 max-w-2xl">
              Set up your live auction room. You can add items after creation.
            </p>
          </div>

          {/* ── Access guard ── */}
          {!isAuthenticated && (
            <div className="mt-6 rounded-2xl border border-brand-border bg-brand-light/40 p-6 text-sm text-brand-muted">
              Please log in with a client account to create auctions.
            </div>
          )}

          {isAuthenticated && !isClient && (
            <div className="mt-6 rounded-2xl border border-brand-border bg-brand-light/40 p-6 text-sm text-brand-muted">
              Only client accounts can create auctions.{" "}
              <Link
                to="/auth?mode=register"
                className="text-brand-rust underline underline-offset-2"
              >
                Register as a client
              </Link>{" "}
              to get started.
            </div>
          )}

          {/* ── Form ── */}
          {isClient && (
            <form
              onSubmit={handleSubmit}
              className="mt-6 flex flex-col gap-5"
              noValidate
            >
              {/* Basic info */}
              <div className="rounded-[28px] border border-brand-border bg-white p-6 sm:p-8">
                <h2 className="font-display text-xl sm:text-2xl text-brand-charcoal mb-5">
                  Basic Information
                </h2>

                <div className="flex flex-col gap-5">
                  <FormField
                    label="Auction Title"
                    hint="Required"
                    error={errors.title}
                  >
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => handleChange("title", e.target.value)}
                      placeholder="e.g. Grand Horology Summit — Watches of the Century"
                      disabled={isSubmitting}
                      className={INPUT_CLASS}
                    />
                  </FormField>

                  <FormField
                    label="Description"
                    hint="Required"
                    error={errors.description}
                  >
                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        handleChange("description", e.target.value)
                      }
                      placeholder="Describe your auction room, what's on offer, and what participants can expect."
                      disabled={isSubmitting}
                      rows={4}
                      className={[
                        INPUT_CLASS,
                        "resize-none rounded-2xl leading-relaxed",
                      ].join(" ")}
                    />
                  </FormField>

                  <FormField label="Initial Status" error={errors.status}>
                    <select
                      value={form.status}
                      onChange={(e) => handleChange("status", e.target.value)}
                      disabled={isSubmitting}
                      className={INPUT_CLASS}
                    >
                      <option value="draft">Draft — save and configure later</option>
                      <option value="scheduled">Scheduled — publish immediately</option>
                    </select>
                  </FormField>
                </div>
              </div>

              {/* Timing */}
              <div className="rounded-[28px] border border-brand-border bg-white p-6 sm:p-8">
                <h2 className="font-display text-xl sm:text-2xl text-brand-charcoal mb-5">
                  Schedule
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField
                    label="Start Time"
                    hint="Required"
                    error={errors.startTime}
                  >
                    <input
                      type="datetime-local"
                      value={form.startTime}
                      onChange={(e) =>
                        handleChange("startTime", e.target.value)
                      }
                      disabled={isSubmitting}
                      className={INPUT_CLASS}
                    />
                  </FormField>

                  <FormField
                    label="End Time"
                    hint="Required"
                    error={errors.endTime}
                  >
                    <input
                      type="datetime-local"
                      value={form.endTime}
                      onChange={(e) => handleChange("endTime", e.target.value)}
                      disabled={isSubmitting}
                      className={INPUT_CLASS}
                    />
                  </FormField>
                </div>
              </div>

              {/* Pricing */}
              <div className="rounded-[28px] border border-brand-border bg-white p-6 sm:p-8">
                <h2 className="font-display text-xl sm:text-2xl text-brand-charcoal mb-1">
                  Pricing Defaults
                </h2>
                <p className="text-xs sm:text-sm text-brand-muted mb-5">
                  These apply to the auction room. Individual items can
                  override them.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField
                    label="Starting Price ($)"
                    hint="0 = no floor"
                    error={errors.startingPrice}
                  >
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={form.startingPrice}
                      onChange={(e) =>
                        handleChange("startingPrice", e.target.value)
                      }
                      placeholder="0"
                      disabled={isSubmitting}
                      className={INPUT_CLASS}
                    />
                  </FormField>

                  <FormField
                    label="Bid Increment ($)"
                    hint="0 = any amount"
                    error={errors.bidIncrement}
                  >
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={form.bidIncrement}
                      onChange={(e) =>
                        handleChange("bidIncrement", e.target.value)
                      }
                      placeholder="0"
                      disabled={isSubmitting}
                      className={INPUT_CLASS}
                    />
                  </FormField>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pb-4">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => navigate("/my-auctions")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={15} className="animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    "Create Auction"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}