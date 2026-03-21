// File: src/components/layout/Footer.jsx
// Changes: copyright "ArtPlace" → "Vendly"
//          bottom badge "♦ Artsy" → "♦ Vendly"
//          meta links updated to auction-platform context
// Zero Tailwind class changes.

import { Twitter, Instagram, Facebook, Youtube, Music2 } from "lucide-react";
import { FOOTER_LINKS } from "../../data/mockData";

const SOCIAL_ICONS = [
  { Icon: Twitter,   label: "Twitter"   },
  { Icon: Music2,    label: "TikTok"    },
  { Icon: Instagram, label: "Instagram" },
  { Icon: Facebook,  label: "Facebook"  },
  { Icon: Youtube,   label: "YouTube"   },
];

/* ✦ CHANGED: footer meta links */
const FOOTER_META = [
  "Legal",
  "Privacy Policy",
  "Accessibility",
  "Site Map",
  "Cookie Settings",
];

export default function Footer() {
  return (
    <footer className="w-full bg-[#0D0D0D] border-t border-white/8">

      {/* ── Link columns + social ────────────────────────────── */}
      <div className="px-6 lg:px-10 pt-12 pb-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 lg:gap-10">

          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading} className="flex flex-col gap-3">
              <h4 className="text-[11px] font-sans font-semibold text-white/90 uppercase tracking-widest">
                {heading}
              </h4>
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-[12px] font-sans text-white/45 hover:text-white/80 transition-colors duration-150 leading-snug"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="flex flex-col gap-3">
            <h4 className="text-[11px] font-sans font-semibold text-white/90 uppercase tracking-widest">
              Follow Us
            </h4>
            <div className="flex flex-wrap gap-2.5 mt-1">
              {SOCIAL_ICONS.map(({ Icon, label }) => (
                
                  <a key={label}
                  href="#"
                  aria-label={label}
                  className={[
                    "w-8 h-8 rounded-full border border-white/15",
                    "flex items-center justify-center",
                    "hover:bg-white/10 hover:border-white/30",
                    "transition-all duration-200",
                  ].join(" ")}
                >
                  <Icon size={14} className="text-white/60" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ──────────────────────────────────────── */}
      <div className="px-6 lg:px-10 py-5 border-t border-white/8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">

          {/* ✦ CHANGED: copyright */}
          <p className="text-[11px] font-sans text-white/30">
            © 2025 Vendly. All rights reserved.
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {FOOTER_META.map((item) => (
              
                <a key={item}
                href="#"
                className="text-[11px] font-sans text-white/30 hover:text-white/60 transition-colors duration-150 whitespace-nowrap"
              >
                {item}
              </a>
            ))}
          </div>

          {/* ✦ CHANGED: brand badge */}
          
            <a href="#"
            className="text-[11px] font-sans text-white/30 hover:text-white/60 transition-colors duration-150 flex items-center gap-1"
          >
            ♦ Vendly
          </a>
        </div>
      </div>
    </footer>
  );
}