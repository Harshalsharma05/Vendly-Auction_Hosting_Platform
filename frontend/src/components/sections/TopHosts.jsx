// File: src/components/sections/TopHosts.jsx
// Renamed from TrendingArtists.jsx
// Changes: section title → "Top Hosts on Vendly"
//          "Follow"/"Following" pill labels unchanged (correct as-is)
//          aria-label on avatar img updated to context
// Zero Tailwind class changes.

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SectionHeader        from "../ui/SectionHeader";
import { TRENDING_ARTISTS } from "../../data/mockData";

function ArtistMosaic({ images }) {
  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-1 rounded-xl overflow-hidden aspect-square w-full">
      {images.slice(0, 4).map((src, i) => (
        <div key={i} className="relative overflow-hidden bg-brand-light">
          <img
            src={src}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            draggable={false}
          />
        </div>
      ))}
    </div>
  );
}

function HostCard({ artist }) {
  const [following,    setFollowing]    = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);

  return (
    <article className="group shrink-0 w-[220px] sm:w-[240px] flex flex-col gap-3 cursor-pointer">
      <ArtistMosaic images={artist.images} />

      <div className="flex items-center gap-2.5 px-0.5">
        <div className="relative shrink-0 w-9 h-9 rounded-full overflow-hidden bg-brand-light border-2 border-white shadow-sm">
          {!avatarLoaded && (
            <div className="absolute inset-0 bg-brand-border animate-pulse rounded-full" />
          )}
          <img
            src={artist.avatar}
            alt={`${artist.name} — Auction Host`}
            onLoad={() => setAvatarLoaded(true)}
            className={[
              "w-full h-full object-cover",
              avatarLoaded ? "opacity-100" : "opacity-0",
            ].join(" ")}
            draggable={false}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-sans font-semibold text-brand-charcoal leading-tight truncate">
            {artist.name}
          </p>
          <p className="text-[11px] font-sans text-brand-muted truncate">
            {artist.location}
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setFollowing((v) => !v);
          }}
          className={[
            "shrink-0 text-[11px] font-sans font-medium px-3 py-1 rounded-full border",
            "transition-all duration-200 whitespace-nowrap",
            following
              ? "bg-brand-charcoal text-white border-brand-charcoal"
              : "bg-white text-brand-charcoal border-brand-border hover:border-brand-charcoal",
          ].join(" ")}
        >
          {following ? "Following" : "Follow"}
        </button>
      </div>
    </article>
  );
}

export default function TopHosts() {
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
    trackRef.current?.scrollBy({ left: dir * 500, behavior: "smooth" });
  };

  return (
    <section className="w-full px-6 lg:px-10 py-10 bg-white">
      <div className="w-full h-px bg-brand-border mb-8" />

      {/* ✦ CHANGED: title */}
      <SectionHeader title="Top Hosts on Vendly" linkLabel="Offer All" />

      <div className="relative">
        <button
          onClick={() => scroll(-1)}
          aria-label="Scroll left"
          className={[
            "absolute left-0 top-[40%] -translate-y-1/2 -translate-x-4 z-10",
            "w-8 h-8 rounded-full bg-white border border-brand-border shadow-md",
            "flex items-center justify-center transition-all duration-200",
            canLeft ? "opacity-100 cursor-pointer hover:bg-brand-light" : "opacity-0 pointer-events-none",
          ].join(" ")}
        >
          <ChevronLeft size={16} className="text-brand-charcoal" />
        </button>

        <div
          ref={trackRef}
          className="flex gap-5 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {TRENDING_ARTISTS.map((artist) => (
            <HostCard key={artist.id} artist={artist} />
          ))}
        </div>

        <button
          onClick={() => scroll(1)}
          aria-label="Scroll right"
          className={[
            "absolute right-0 top-[40%] -translate-y-1/2 translate-x-4 z-10",
            "w-8 h-8 rounded-full bg-white border border-brand-border shadow-md",
            "flex items-center justify-center transition-all duration-200",
            canRight ? "opacity-100 cursor-pointer hover:bg-brand-light" : "opacity-0 pointer-events-none",
          ].join(" ")}
        >
          <ChevronRight size={16} className="text-brand-charcoal" />
        </button>
      </div>
    </section>
  );
}