// File: src/components/sections/Events.jsx
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import SectionHeader from "../ui/SectionHeader";
import { EVENTS } from "../../data/mockData";

function EventCard({ event }) {
  const [loaded, setLoaded] = useState(false);

  return (
    
      <a href="#"
      className="group relative block rounded-2xl overflow-hidden cursor-pointer"
      style={{ aspectRatio: "4/3" }}
    >
      {/* Skeleton */}
      {!loaded && (
        <div className="absolute inset-0 bg-brand-light animate-pulse" />
      )}

      {/* Image */}
      <img
        src={event.src}
        alt={event.title}
        onLoad={() => setLoaded(true)}
        className={[
          "absolute inset-0 w-full h-full object-cover transition-all duration-700",
          "group-hover:scale-105",
          loaded ? "opacity-100" : "opacity-0",
        ].join(" ")}
        draggable={false}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

      {/* Bottom text */}
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
        <p className="text-[11px] font-sans text-white/60 mb-1.5 tracking-wide">
          {event.date}
        </p>
        <div className="flex items-end justify-between gap-2">
          <h3 className="font-sans font-semibold text-white text-[14px] sm:text-[15px] leading-snug line-clamp-2 flex-1">
            {event.title}
          </h3>
          <span className="shrink-0 w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:bg-white/30 transition-colors">
            <ArrowUpRight size={13} className="text-white" />
          </span>
        </div>
      </div>
    </a>
  );
}

export default function Events() {
  return (
    <section className="w-full px-6 lg:px-10 py-10 bg-white">
      <div className="w-full h-px bg-brand-border mb-8" />
      <SectionHeader title="Events" linkLabel="View All" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {EVENTS.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}