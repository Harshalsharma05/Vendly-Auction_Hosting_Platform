// File: src/data/mockData.js

/* ── Navigation ─────────────────────────────────────────── */
export const NAV_LINKS = [
  { label: "Live Auctions", href: "/live-auctions" },
  { label: "Hosts", href: "/hosts" },
  { label: "Categories", href: "/categories" },
  { label: "Lots", href: "/lots" },
  { label: "Watches", href: "/watches" },
  { label: "Classic Cars", href: "/classic-cars" },
  { label: "Real Estate", href: "/real-estate" },
  { label: "Events", href: "/events" },
  { label: "Bid Advisory", href: "/bid-advisory" },
  { label: "Private Rooms", href: "/private-rooms" },
];

/* ── Hero (panoramic room panels) ───────────────────────── */
export const HERO_IMAGES = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1523170335258-f87a2d6a1c32?w=400&q=80",
    alt: "Luxury Rolex Daytona",
    position: "left-far",
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=400&q=80",
    alt: "Vintage Porsche 911",
    position: "left-mid",
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=500&q=80",
    alt: "Luxury Penthouse Real Estate",
    position: "center",
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=400&q=80",
    alt: "Patek Philippe Nautilus",
    position: "right-mid",
  },
  {
    id: 5,
    src: "https://images.unsplash.com/photo-1617531653332-bd46c16f7d61?w=400&q=80",
    alt: "Ferrari Classic Collection",
    position: "right-far",
  },
];

/* ── Live Auctions (was: Artworks for Sale) ─────────────── */
export const ARTWORKS_FOR_SALE = [
  {
    id: 1,
    title: "Rolex Daytona Ref. 116500",
    artist: "Christies Watches",
    price: "$24,500",
    sold: false,
    medium: "Luxury Timepiece",
    src: "https://images.unsplash.com/photo-1523170335258-f87a2d6a1c32?w=400&q=80",
  },
  {
    id: 2,
    title: "1973 Porsche 911 Carrera RS",
    artist: "RM Sotheby's",
    price: "$385,000",
    sold: false,
    medium: "Classic Automobile",
    src: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=80",
  },
  {
    id: 3,
    title: "Monaco Waterfront Villa",
    artist: "Knight Frank Auctions",
    price: "$4,200,000",
    sold: false,
    medium: "Luxury Real Estate",
    src: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&q=80",
  },
  {
    id: 4,
    title: "Patek Philippe Nautilus 5711",
    artist: "Phillips Watches",
    price: "$118,000",
    sold: true,
    medium: "Luxury Timepiece",
    src: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=400&q=80",
  },
  {
    id: 5,
    title: "1962 Ferrari 250 GTO",
    artist: "Bonhams Auctions",
    price: "$9,800,000",
    sold: false,
    medium: "Classic Automobile",
    src: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&q=80",
  },
];

/* ── Premium Lots (was: Featured Art) ───────────────────── */
export const FEATURED_ART = [
  {
    id: 1,
    title: "AP Royal Oak 15500ST",
    artist: "Sotheby's Timepieces",
    src: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=600&q=80",
  },
  {
    id: 2,
    title: "Beverly Hills Compound",
    artist: "Concierge Auctions",
    src: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80",
  },
  {
    id: 3,
    title: "1967 Lamborghini Miura",
    artist: "Gooding & Company",
    src: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&q=80",
  },
];

/* ── Auction Insights (was: Editorial News) ─────────────── */
export const NEWS_ARTICLES = [
  {
    id: 1,
    category: "Market Intelligence",
    title: "How Online Bidding Is Reshaping the Auction Landscape.",
    author: "By Lynn Kerry",
    src: "https://images.unsplash.com/photo-1523170335258-f87a2d6a1c32?w=400&q=80",
    size: "small",
  },
  {
    id: 2,
    category: "Watch Market",
    title: "The Rise of Independent Watchmakers: A New Era of Value.",
    author: "By Leo Getty",
    src: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=400&q=80",
    size: "small",
  },
  {
    id: 3,
    category: "Bidder's Guide",
    title: "Navigating Reserve Prices: Insider Buyer Tips.",
    author: "By Isabella Chang",
    src: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&q=80",
    size: "small",
  },
  {
    id: 4,
    category: "Classic Cars",
    title: "The Evolution of the Collector Car Market Post-2020.",
    author: "By Ana Moreno",
    src: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=80",
    size: "small",
  },
  {
    id: 5,
    category: "Spotlight",
    title: "Spotlight on Emerging Auction Hosts: Ones to Watch in 2025.",
    author: "By Noah Bennett",
    src: "https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=800&q=80",
    size: "large",
  },
  {
    id: 6,
    category: "For Bidders",
    title: "5 Tips for Winning Your First Luxury Auction.",
    author: "By Olivia Roe",
    src: null,
    size: "text-only",
  },
  {
    id: 7,
    category: "Host Spotlight",
    title: "Behind the Gavel: An Interview with Host James Wu.",
    author: "By Ben Ramos",
    src: null,
    size: "text-only",
  },
  {
    id: 8,
    category: "Auction Trends",
    title: "Iconic Auction Records That Changed the Market.",
    author: "By Alexander Houle",
    src: null,
    size: "text-only",
  },
  {
    id: 9,
    category: "Real Estate",
    title: "Luxury Property Auctions: A Timeless Investment Form.",
    author: "By Emma Laurent",
    src: null,
    size: "text-only",
  },
  {
    id: 10,
    category: "Platform News",
    title: "Top 10 Live Auction Rooms to Join This Year.",
    author: "By Isaac Patel",
    src: null,
    size: "text-only",
  },
  {
    id: 11,
    category: "Collector's Guide",
    title: "What Makes a Lot Valuable? A Bidder's Deep Dive.",
    author: "By Elisa Ford",
    src: null,
    size: "text-only",
  },
];

/* ── Top Hosts (was: Trending Artists) ──────────────────── */
export const TRENDING_ARTISTS = [
  {
    id: 1,
    name: "Marcus Vega",
    location: "Geneva, Switzerland",
    followers: "Follow",
    images: [
      "https://images.unsplash.com/photo-1523170335258-f87a2d6a1c32?w=200&q=80",
      "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=200&q=80",
      "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=200&q=80",
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=200&q=80",
    ],
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&q=80",
  },
  {
    id: 2,
    name: "Harper Ashford",
    location: "London, UK",
    followers: "Follow",
    images: [
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200&q=80",
      "https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=200&q=80",
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=200&q=80",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=200&q=80",
    ],
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80",
  },
  {
    id: 3,
    name: "Kai Nakamura",
    location: "Tokyo, Japan",
    followers: "Follow",
    images: [
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=200&q=80",
      "https://images.unsplash.com/photo-1523170335258-f87a2d6a1c32?w=200&q=80",
      "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=200&q=80",
    ],
    avatar:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&q=80",
  },
  {
    id: 4,
    name: "Zoë Devereaux",
    location: "Monaco, France",
    followers: "Follow",
    images: [
      "https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=200&q=80",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=200&q=80",
      "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=200&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200&q=80",
    ],
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&q=80",
  },
];

/* ── Upcoming Events (was: Events) ─────────────────────── */
export const EVENTS = [
  {
    id: 1,
    title: "Grand Horology Summit: Watches of the Century",
    date: "June 10–15, 2025",
    src: "https://images.unsplash.com/photo-1523170335258-f87a2d6a1c32?w=600&q=80",
  },
  {
    id: 2,
    title: "Pebble Beach Motorsport & Classic Car Auction",
    date: "May 20–July 5, 2025",
    src: "https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=600&q=80",
  },
  {
    id: 3,
    title: "Ultra-Luxury Real Estate Live Bidding Experience",
    date: "March 5, 2025",
    src: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80",
  },
];

/* ── Footer Links ─────────────────────────────────────────── */
export const FOOTER_LINKS = {
  Company: ["About Vendly", "Careers", "Press", "Contact", "Legal"],
  Resources: [
    "Vendly for Hosts",
    "Vendly for Bidders",
    "Vendly for Dealers",
    "Blog",
    "The Bidder's Primer",
  ],
  Partnership: [
    "Vendly for Auction Houses",
    "Vendly for Dealerships",
    "Vendly for Brokers",
    "Vendly for Institutions",
    "Partner Program",
  ],
};
