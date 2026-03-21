// File: src/components/sections/Newsletter.jsx
// Changes: headline → "Stay Connected with the Auction World"
//          subtitle → auction-domain copy
//          placeholder → "Enter your email for auction updates"
// Zero Tailwind class changes.

import { useState } from "react";
import { HERO_IMAGES } from "../../data/mockData";

const STRIP_CONFIG = [
  { transform: "rotateY(28deg) rotateX(3deg) scale(0.8) translateX(8px)",      opacity: 0.65, width: "13%" },
  { transform: "rotateY(13deg) rotateX(1.5deg) scale(0.89) translateX(3px)",   opacity: 0.82, width: "16%" },
  { transform: "rotateY(0deg)  rotateX(0deg)   scale(1)",                       opacity: 1,    width: "22%" },
  { transform: "rotateY(-13deg) rotateX(1.5deg) scale(0.89) translateX(-3px)", opacity: 0.82, width: "16%" },
  { transform: "rotateY(-28deg) rotateX(3deg) scale(0.8) translateX(-8px)",    opacity: 0.65, width: "13%" },
];

function GalleryStrip() {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ perspective: "900px", perspectiveOrigin: "50% 20%" }}
    >
      <div
        className="absolute inset-x-0 bottom-0 bg-[#5a2318]"
        style={{ top: "20%", clipPath: "ellipse(60% 100% at 50% 100%)" }}
      />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[#5a2318]" />

      <div className="relative flex items-end justify-center gap-2 sm:gap-3 px-4 pt-6">
        {HERO_IMAGES.map((img, i) => (
          <div
            key={img.id}
            className="relative shrink-0 rounded-lg overflow-hidden"
            style={{
              width:           STRIP_CONFIG[i].width,
              height:          "clamp(90px, 14vw, 180px)",
              transform:       STRIP_CONFIG[i].transform,
              opacity:         STRIP_CONFIG[i].opacity,
              transformOrigin: "bottom center",
            }}
          >
            <img
              src={img.src}
              alt={img.alt}
              className="w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.3)] rounded-lg pointer-events-none" />
          </div>
        ))}
      </div>

      <div className="relative h-6 bg-[#5a2318]" />
    </div>
  );
}

export default function Newsletter() {
  const [email,     setEmail]     = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!email.trim()) return;
    setSubmitted(true);
    setEmail("");
    setTimeout(() => setSubmitted(false), 3500);
  };

  return (
    <section className="w-full bg-[#0D0D0D] pt-16 pb-0 overflow-hidden">
      <div className="text-center px-6 pb-12">

        {/* ✦ CHANGED: headline */}
        <h2 className="font-display font-bold text-white text-3xl sm:text-4xl lg:text-[46px] leading-tight tracking-tight text-balance">
          Stay Connected
          <br />
          with the Auction World
        </h2>

        {/* ✦ CHANGED: subtitle */}
        <p className="mt-4 text-[14px] font-sans text-white/50 max-w-md mx-auto leading-relaxed">
          Sign up for exclusive auction alerts, host spotlights, and rare lot
          drops delivered straight to your inbox.
        </p>

        {/* Email input row — structure untouched */}
        <div className="mt-8 flex items-center max-w-md mx-auto rounded-full bg-white/10 border border-white/15 p-1.5 gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            /* ✦ CHANGED: placeholder */
            placeholder="Enter your email for auction updates"
            className={[
              "flex-1 min-w-0 bg-transparent px-4 py-2 text-[13px] font-sans",
              "text-white placeholder:text-white/35 outline-none",
            ].join(" ")}
          />
          <button
            onClick={handleSubmit}
            className={[
              "shrink-0 px-5 py-2 rounded-full text-[13px] font-sans font-medium",
              "transition-all duration-200",
              submitted
                ? "bg-green-500 text-white"
                : "bg-white text-brand-charcoal hover:bg-brand-light",
            ].join(" ")}
          >
            {submitted ? "Subscribed ✓" : "Subscribe"}
          </button>
        </div>
      </div>

      <GalleryStrip />
    </section>
  );
}