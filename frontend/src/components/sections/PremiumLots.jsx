// File: src/components/sections/PremiumLots.jsx
// Renamed from FeaturedArt.jsx
// Changes: section title "Featured Art" → "Premium Lots"
//          import path ArtCard → ItemCard
// Zero Tailwind class changes.

import SectionHeader    from "../ui/SectionHeader";
import ItemCard         from "../ui/ItemCard";
import { FEATURED_ART } from "../../data/mockData";

export default function PremiumLots() {
  return (
    <section className="w-full px-6 lg:px-10 py-6 pb-12">
      <div className="w-full h-px bg-brand-border mb-8" />

      {/* ✦ CHANGED: title */}
      <SectionHeader title="Premium Lots" linkLabel="View All" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
        {FEATURED_ART.map((artwork) => (
          <ItemCard key={artwork.id} artwork={artwork} variant="featured" />
        ))}
      </div>
    </section>
  );
}