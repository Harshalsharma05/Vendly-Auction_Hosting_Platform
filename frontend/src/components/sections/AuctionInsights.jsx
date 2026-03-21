// File: src/components/sections/AuctionInsights.jsx
// Renamed from EditorialNews.jsx
// Changes: section title "Editorial News" → "Auction Insights"
//          imports: NewsCard* → InsightCard*
// Zero Tailwind class changes.

import { NEWS_ARTICLES } from "../../data/mockData";
import {
  InsightCardSmall,
  InsightCardHero,
  InsightCardText,
} from "../ui/InsightCard";

export default function AuctionInsights() {
  const smallCards = NEWS_ARTICLES.filter((a) => a.size === "small");
  const heroCard   = NEWS_ARTICLES.find((a)  => a.size === "large");
  const textCards  = NEWS_ARTICLES.filter((a) => a.size === "text-only");
  const leftCards  = smallCards.slice(0, 4);

  return (
    <section className="w-full bg-[#0D0D0D] py-10 px-6 lg:px-10">

      {/* ── Section header — ✦ CHANGED title ───────────────── */}
      <div className="flex items-baseline justify-between mb-7">
        <h2 className="font-display font-bold text-white text-xl sm:text-2xl tracking-tight">
          Auction Insights
        </h2>
        <a
          href="#"
          className="text-[12px] font-sans text-white/40 hover:text-white/70 underline underline-offset-2 transition-colors whitespace-nowrap"
        >
          View All
        </a>
      </div>

      {/* ── Bento grid — untouched ──────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.6fr_1fr] gap-5 lg:gap-7 items-start">

        <div className="flex flex-col divide-y divide-white/0">
          {leftCards.map((article) => (
            <InsightCardSmall key={article.id} article={article} />
          ))}
        </div>

        <div className="relative rounded-2xl overflow-hidden" style={{ minHeight: "420px" }}>
          {heroCard && <InsightCardHero article={heroCard} />}
        </div>

        <div className="flex flex-col">
          {textCards.map((article) => (
            <InsightCardText key={article.id} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}