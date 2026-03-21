// File: src/components/sections/Hero.jsx
import { useEffect, useRef, useState } from "react";
import { HERO_IMAGES } from "../../data/mockData";

const PANEL_CONFIG = [
  {
    style: {
      transform: "rotateY(32deg) rotateX(4deg) scale(0.78) translateX(10px)",
      zIndex: 1,
      opacity: 0.75,
    },
    width: "w-[13%]",
    heightClass: "h-[220px] md:h-[300px] lg:h-[340px]",
  },
  {
    style: {
      transform: "rotateY(16deg) rotateX(2deg) scale(0.88) translateX(4px)",
      zIndex: 2,
      opacity: 0.88,
    },
    width: "w-[16%]",
    heightClass: "h-[260px] md:h-[340px] lg:h-[390px]",
  },
  {
    style: {
      transform: "rotateY(0deg) rotateX(0deg) scale(1)",
      zIndex: 3,
      opacity: 1,
    },
    width: "w-[22%]",
    heightClass: "h-[310px] md:h-[400px] lg:h-[450px]",
  },
  {
    style: {
      transform: "rotateY(-16deg) rotateX(2deg) scale(0.88) translateX(-4px)",
      zIndex: 2,
      opacity: 0.88,
    },
    width: "w-[16%]",
    heightClass: "h-[260px] md:h-[340px] lg:h-[390px]",
  },
  {
    style: {
      transform: "rotateY(-32deg) rotateX(4deg) scale(0.78) translateX(-10px)",
      zIndex: 1,
      opacity: 0.75,
    },
    width: "w-[13%]",
    heightClass: "h-[220px] md:h-[300px] lg:h-[340px]",
  },
];

function PanelLabel({ text }) {
  return (
    <div className="absolute bottom-3 left-3 right-3">
      <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-[10px] font-sans font-medium px-2 py-0.5 rounded-full border border-white/30 truncate max-w-full">
        {text}
      </span>
    </div>
  );
}

function ArtPanel({ image, config, index }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={[
        "relative shrink-0 rounded-lg overflow-hidden cursor-pointer",
        "transition-all duration-500 ease-out",
        "hover:brightness-110 hover:z-10",
        config.width,
        config.heightClass,
      ].join(" ")}
      style={{
        ...config.style,
        transformOrigin: "bottom center",
        transitionDelay: `${index * 60}ms`,
      }}
    >
      {!loaded && (
        <div className="absolute inset-0 bg-[#5a2a20] animate-pulse" />
      )}
      <img
        src={image.src}
        alt={image.alt}
        onLoad={() => setLoaded(true)}
        className={[
          "w-full h-full object-cover transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0",
        ].join(" ")}
        draggable={false}
      />
      <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.35)] rounded-lg pointer-events-none" />
      {index === 0 && (
        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/30 to-transparent pointer-events-none" />
      )}
      {index === 4 && (
        <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/30 to-transparent pointer-events-none" />
      )}
      {index === 2 && <PanelLabel text={image.alt} />}
    </div>
  );
}

export default function Hero() {
  const heroRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <section ref={heroRef} className="relative w-full overflow-hidden bg-white">

      {/* ── Text block — ONLY these strings changed ────────── */}
      <div
        className={[
          "text-center px-6 pt-10 pb-8 transition-all duration-700 ease-out",
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        ].join(" ")}
      >
        {/* ✦ CHANGED: headline */}
        <h1 className="font-display font-bold text-brand-charcoal text-balance leading-tight tracking-tight text-4xl sm:text-5xl lg:text-[56px] xl:text-[62px]">
          Host and Join
          <br />
          Exceptional Live Auctions
        </h1>

        {/* ✦ CHANGED: subtitle */}
        <p
          className={[
            "mt-4 font-sans text-brand-muted text-sm sm:text-[15px] max-w-sm mx-auto leading-relaxed",
            "transition-all duration-700 delay-150 ease-out",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          ].join(" ")}
        >
          Discover and bid on extraordinary lots from
          <br className="hidden sm:block" /> the world's most prestigious auction hosts.
        </p>
      </div>

      {/* ── Panoramic curved gallery — untouched ───────────── */}
      <div
        className="relative w-full"
        style={{ perspective: "1100px", perspectiveOrigin: "50% 30%" }}
      >
        <div
          className="absolute inset-x-0 bottom-0 bg-brand-rust"
          style={{ top: "12%", clipPath: "ellipse(58% 100% at 50% 100%)" }}
        />
        <div className="absolute inset-x-0 bottom-0 bg-brand-rust" style={{ height: "38%" }} />
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none mix-blend-multiply opacity-20"
          style={{
            height: "100%",
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
            backgroundSize: "200px 200px",
          }}
        />
        <div
          className="absolute inset-x-0 pointer-events-none"
          style={{
            top: "10%",
            height: "60px",
            background: "linear-gradient(to bottom, transparent, rgba(80,20,10,0.18))",
          }}
        />
        <div
          className={[
            "relative flex items-end justify-center gap-3 md:gap-4 lg:gap-5",
            "px-4 pb-0 pt-6",
            "transition-all duration-1000 ease-out",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
          ].join(" ")}
          style={{ transitionDelay: "250ms" }}
        >
          {HERO_IMAGES.map((img, i) => (
            <ArtPanel key={img.id} image={img} config={PANEL_CONFIG[i]} index={i} />
          ))}
        </div>
        <div
          className="relative w-full h-10 bg-brand-rust"
          style={{ background: "linear-gradient(to bottom, #7C3A2D, #6b3126)" }}
        />
      </div>
    </section>
  );
}