// File: src/App.jsx — FINAL REFACTORED VERSION
import Navbar          from "./components/layout/Navbar";
import Footer          from "./components/layout/Footer";
import Hero            from "./components/sections/Hero";
import LiveAuctions    from "./components/sections/LiveAuctions";
import PremiumLots     from "./components/sections/PremiumLots";
import AuctionInsights from "./components/sections/AuctionInsights";
import TopHosts        from "./components/sections/TopHosts";
import UpcomingEvents  from "./components/sections/UpcomingEvents";
import Newsletter      from "./components/sections/Newsletter";

export default function App() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />

      <main className="pt-[92px]">
        {/* 1 · Hero — "Host and Join Exceptional Live Auctions" */}
        <Hero />

        {/* 2 · Live Auctions — horizontal bid scroll */}
        <LiveAuctions />

        {/* 3 · Premium Lots — 3-col grid */}
        <PremiumLots />

        {/* 4 · Auction Insights — dark bento grid */}
        <AuctionInsights />

        {/* 5 · Top Hosts on Vendly — horizontal scroll */}
        <TopHosts />

        {/* 6 · Upcoming Events — 3-col image grid */}
        <UpcomingEvents />

        {/* 7 · Newsletter — "Stay Connected with the Auction World" */}
        <Newsletter />
      </main>

      {/* 8 · Footer — Vendly branded */}
      <Footer />
    </div>
  );
}