// File: src/components/ui/InsightCard.jsx
// Renamed from NewsCard.jsx
// Changes: aria/alt text context only — zero Tailwind changes.

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";

/* ── Small thumbnail card (left column) ── */
export function InsightCardSmall({ article }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <a
      href="#"
      className="group flex gap-3 items-start py-3 border-b border-white/8 last:border-b-0 hover:opacity-80 transition-opacity duration-200"
    >
      <div className="relative shrink-0 w-[72px] h-[56px] rounded-lg overflow-hidden bg-white/10">
        {!loaded && (
          <div className="absolute inset-0 bg-white/5 animate-pulse rounded-lg" />
        )}
        <img
          src={article.src}
          alt={article.title}
          onLoad={() => setLoaded(true)}
          className={[
            "w-full h-full object-cover transition-all duration-500",
            "group-hover:scale-105",
            loaded ? "opacity-100" : "opacity-0",
          ].join(" ")}
          draggable={false}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-sans text-white/40 uppercase tracking-wider mb-0.5 truncate">
          {article.category}
        </p>
        <p className="text-[12px] font-sans font-medium text-white/90 leading-snug line-clamp-2">
          {article.title}
        </p>
        <p className="text-[10px] font-sans text-white/35 mt-1">{article.author}</p>
      </div>
    </a>
  );
}

/* ── Large hero card (center column) ── */
export function InsightCardHero({ article }) {
  const [loaded, setLoaded] = useState(false);

  return (
    
      <a href="#"
      className="group relative flex flex-col h-full rounded-2xl overflow-hidden cursor-pointer"
    >
      <div className="relative flex-1 min-h-[340px] bg-white/10">
        {!loaded && (
          <div className="absolute inset-0 bg-white/5 animate-pulse" />
        )}
        <img
          src={article.src}
          alt={article.title}
          onLoad={() => setLoaded(true)}
          className={[
            "absolute inset-0 w-full h-full object-cover transition-all duration-700",
            "group-hover:scale-103",
            loaded ? "opacity-100" : "opacity-0",
          ].join(" ")}
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>

      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="text-[10px] font-sans text-white/50 uppercase tracking-wider mb-2">
          {article.category}
        </p>
        <h3 className="font-display text-white text-[18px] sm:text-[20px] font-semibold leading-snug line-clamp-3">
          {article.title}
        </h3>
        <p className="text-[11px] font-sans text-white/50 mt-2">{article.author}</p>
        <span className="inline-flex items-center gap-1 mt-3 text-[11px] font-sans text-white/70 group-hover:text-white transition-colors">
          Read more <ArrowUpRight size={13} />
        </span>
      </div>
    </a>
  );
}

/* ── Text-only list item (right column) ── */
export function InsightCardText({ article }) {
  return (
    
      <a href="#"
      className="group flex flex-col gap-0.5 py-3 border-b border-white/8 last:border-b-0 hover:opacity-80 transition-opacity duration-200"
    >
      <p className="text-[9px] font-sans text-white/35 uppercase tracking-wider">
        {article.category}
      </p>
      <p className="text-[12px] font-sans font-medium text-white/90 leading-snug line-clamp-2 group-hover:text-white transition-colors">
        {article.title}
      </p>
      <p className="text-[10px] font-sans text-white/35">{article.author}</p>
    </a>
  );
}