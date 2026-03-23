// File: src/components/sections/LiveAuctions.jsx
// Renamed from ArtworkForSale.jsx
// Changes: section title "Artwork for Sale" → "Live Auctions"
//          import path ArtCard → ItemCard
//          import data key unchanged (ARTWORKS_FOR_SALE)
// Zero Tailwind class changes.

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import SectionHeader from "../ui/SectionHeader";
import ItemCard from "../ui/ItemCard";
import { ARTWORKS_FOR_SALE } from "../../data/mockData";
import axiosInstance from "../../lib/axios";

const FALLBACK_AUCTION_IMAGE =
  "https://images.unsplash.com/photo-1579546929662-711aa81148cf?w=400&q=80";

function formatStartTime(startTime) {
  if (!startTime) {
    return "Start time to be announced";
  }

  const parsedDate = new Date(startTime);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Start time to be announced";
  }

  return `Starts ${parsedDate.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function mapAuctionsToCards(auctions) {
  return auctions.map((auction, index) => {
    const status = (auction?.status || "scheduled").toLowerCase();
    return {
      id: auction?._id || auction?.id || `auction-${index}`,
      title: auction?.title || "Untitled Auction",
      artist: formatStartTime(auction?.startTime),
      medium: `Status: ${status.charAt(0).toUpperCase()}${status.slice(1)}`,
      price: status === "live" ? "Live Now" : "Opening Soon",
      sold: status === "ended",
      src: auction?.coverImage || auction?.image || FALLBACK_AUCTION_IMAGE,
    };
  });
}

function AuctionCardSkeleton({ keyId }) {
  return (
    <article
      key={keyId}
      className="group relative shrink-0 w-46.25 sm:w-50 md:w-53.75 flex flex-col"
    >
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-brand-light animate-pulse" />
      <div className="pt-2.5 pb-1 flex flex-col gap-2">
        <div className="h-4 w-4/5 rounded bg-brand-light animate-pulse" />
        <div className="h-3 w-3/5 rounded bg-brand-light animate-pulse" />
        <div className="h-8 w-full rounded bg-brand-light animate-pulse mt-1.5" />
      </div>
    </article>
  );
}

export default function LiveAuctions() {
  const navigate = useNavigate();
  const trackRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const [auctionCards, setAuctionCards] = useState(ARTWORKS_FOR_SALE);
  const [isLoading, setIsLoading] = useState(true);

  const updateArrows = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchAuctions() {
      setIsLoading(true);

      try {
        const response = await axiosInstance.get("/auctions");
        const payload = response?.data?.data;
        const auctions = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.auctions)
            ? payload.auctions
            : [];

        if (isMounted && auctions.length > 0) {
          setAuctionCards(mapAuctionsToCards(auctions));
        }
      } catch {
        if (isMounted) {
          setAuctionCards(ARTWORKS_FOR_SALE);
          toast.error(
            "Unable to fetch live auctions. Showing curated listings.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchAuctions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    return () => el.removeEventListener("scroll", updateArrows);
  }, [auctionCards, isLoading]);

  const scroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 440, behavior: "smooth" });
  };

  return (
    <section className="w-full px-6 lg:px-10 py-10">
      {/* ✦ CHANGED: title */}
      <SectionHeader title="Live Auctions" linkLabel="View All" />

      <div className="relative">
        <button
          onClick={() => scroll(-1)}
          aria-label="Scroll left"
          className={[
            "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10",
            "w-8 h-8 rounded-full bg-white border border-brand-border shadow-md",
            "flex items-center justify-center transition-all duration-200",
            canLeft
              ? "opacity-100 hover:bg-brand-light cursor-pointer"
              : "opacity-0 pointer-events-none",
          ].join(" ")}
        >
          <ChevronLeft size={16} className="text-brand-charcoal" />
        </button>

        <div
          ref={trackRef}
          className={[
            "flex gap-4 overflow-x-auto pb-2 scroll-smooth",
            "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
          ].join(" ")}
        >
          {isLoading &&
            Array.from({ length: 5 }).map((_, index) => (
              <AuctionCardSkeleton
                key={`auction-skeleton-${index}`}
                keyId={`auction-skeleton-${index}`}
              />
            ))}

          {!isLoading &&
            auctionCards.map((artwork) => (
              <ItemCard
                key={artwork.id}
                artwork={artwork}
                variant="sale"
                onOpen={() => navigate(`/auction/${artwork.id}`)}
              />
            ))}
        </div>

        <button
          onClick={() => scroll(1)}
          aria-label="Scroll right"
          className={[
            "absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10",
            "w-8 h-8 rounded-full bg-white border border-brand-border shadow-md",
            "flex items-center justify-center transition-all duration-200",
            canRight
              ? "opacity-100 hover:bg-brand-light cursor-pointer"
              : "opacity-0 pointer-events-none",
          ].join(" ")}
        >
          <ChevronRight size={16} className="text-brand-charcoal" />
        </button>
      </div>
    </section>
  );
}
