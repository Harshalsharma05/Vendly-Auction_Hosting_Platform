import Hero from "../components/sections/Hero";
import LiveAuctions from "../components/sections/LiveAuctions";
import PremiumLots from "../components/sections/PremiumLots";
import AuctionInsights from "../components/sections/AuctionInsights";
import TopHosts from "../components/sections/TopHosts";
import UpcomingEvents from "../components/sections/UpcomingEvents";
import Newsletter from "../components/sections/Newsletter";

export default function HomePage() {
  return (
    <main className="pt-[92px]">
      <Hero />
      <LiveAuctions />
      <PremiumLots />
      <AuctionInsights />
      <TopHosts />
      <UpcomingEvents />
      <Newsletter />
    </main>
  );
}
