import { useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/axios";

const INITIAL_FORM = {
  title: "",
  description: "",
  imageUrls: "",
  expectedPrice: "0",
};

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
  }

  if (!form.description.trim()) {
    errors.description = "Description is required.";
  }

  if (form.expectedPrice === "" || Number(form.expectedPrice) < 0) {
    errors.expectedPrice = "Expected price must be 0 or more.";
  }

  return errors;
}

function FormField({ label, error, hint, children }) {
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

export default function SubmitItemForm({ auctionId, onSuccess }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((previous) => ({
        ...previous,
        [field]: undefined,
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await axiosInstance.post(`/submissions/${auctionId}`, {
        title: form.title.trim(),
        description: form.description.trim(),
        imageUrls: form.imageUrls
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean),
        expectedPrice: Number(form.expectedPrice),
      });

      setForm(INITIAL_FORM);
      toast.success("Item submitted for review.");

      if (typeof onSuccess === "function") {
        onSuccess();
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Unable to submit item right now.";

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[28px] border border-brand-border bg-white p-6 sm:p-8"
    >
      <div className="flex flex-col gap-5">
        <div>
          <h3 className="font-display text-2xl text-brand-charcoal leading-tight">
            Submit an Item
          </h3>
          <p className="text-sm text-brand-muted mt-2">
            Share an item for host review before it gets added to the auction.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField label="Title" error={errors.title}>
            <input
              type="text"
              value={form.title}
              onChange={(event) => handleChange("title", event.target.value)}
              disabled={isSubmitting}
              placeholder="Vintage camera set"
              className={INPUT_CLASS}
            />
          </FormField>

          <FormField
            label="Expected Price"
            error={errors.expectedPrice}
            hint="0 or more"
          >
            <input
              type="number"
              min={0}
              step={1}
              value={form.expectedPrice}
              onChange={(event) =>
                handleChange("expectedPrice", event.target.value)
              }
              disabled={isSubmitting}
              className={INPUT_CLASS}
            />
          </FormField>
        </div>

        <FormField label="Description" error={errors.description}>
          <textarea
            value={form.description}
            onChange={(event) => handleChange("description", event.target.value)}
            disabled={isSubmitting}
            rows={4}
            placeholder="Add a short summary, condition, provenance, or any details the host should review."
            className={INPUT_CLASS}
          />
        </FormField>

        <FormField
          label="Image URLs"
          hint="Comma separated"
          error={errors.imageUrls}
        >
          <input
            type="text"
            value={form.imageUrls}
            onChange={(event) => handleChange("imageUrls", event.target.value)}
            disabled={isSubmitting}
            placeholder="https://image-1.jpg, https://image-2.jpg"
            className={INPUT_CLASS}
          />
        </FormField>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-full bg-brand-charcoal text-white border border-brand-charcoal px-5 py-2.5 text-sm font-sans font-medium hover:bg-brand-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Item"}
          </button>
        </div>
      </div>
    </form>
  );
}
