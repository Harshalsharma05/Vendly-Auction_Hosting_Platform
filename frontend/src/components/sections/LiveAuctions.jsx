// File: src/components/sections/LiveAuctions.jsx
// Renamed from ArtworkForSale.jsx
// Changes: section title "Artwork for Sale" → "Live Auctions"
//          import path ArtCard → ItemCard
//          import data key unchanged (ARTWORKS_FOR_SALE)
// Zero Tailwind class changes.

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SectionHeader        from "../ui/SectionHeader";
import ItemCard             from "../ui/ItemCard";
import { ARTWORKS_FOR_SALE } from "../../data/mockData";

export default function LiveAuctions() {
  const trackRef   = useRef(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(true);

  const updateArrows = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    return () => el.removeEventListener("scroll", updateArrows);
  }, []);

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
          {ARTWORKS_FOR_SALE.map((artwork) => (
            <ItemCard key={artwork.id} artwork={artwork} variant="sale" />
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