import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import InfoPage from "./pages/InfoPage";
import AuctionRoom from "./pages/AuctionRoom";
import LiveRoomPage from "./pages/LiveRoomPage";
import AuctionItemPage from "./pages/AuctionItemPage";
import LiveAuctionsPage from "./pages/LiveAuctionsPage";
import MyAuctionsPage from "./pages/MyAuctionsPage";
import MyBidsPage from "./pages/MyBidsPage";
import CreateAuctionPage from "./pages/CreateAuctionPage";
import { NAV_PAGE_ROUTES, QUICK_LINK_ROUTES } from "./data/routePages";
import { SocketProvider } from "./context/SocketContext";

export default function App() {
  return (
    <SocketProvider>
      <div className="min-h-screen bg-white font-sans">
        <Navbar />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/live-now"
            element={<Navigate to="/live-auctions" replace />}
          />
          <Route path="/live-auctions" element={<LiveAuctionsPage />} />
          <Route path="/my-auctions" element={<MyAuctionsPage />} />
          <Route path="/my-bids" element={<MyBidsPage />} />
          <Route path="/create-auction" element={<CreateAuctionPage />} />
          <Route path="/auction/:auctionId" element={<AuctionRoom />} />
          <Route
            path="/auction/:auctionId/live-room"
            element={<LiveRoomPage />}
          />
          <Route
            path="/auction/:auctionId/host-view"
            element={<LiveRoomPage />}
          />
          <Route
            path="/auction/:auctionId/item/:itemId"
            element={<AuctionItemPage />}
          />
          {QUICK_LINK_ROUTES.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <InfoPage title={route.title} description={route.description} />
              }
            />
          ))}
          {NAV_PAGE_ROUTES.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <InfoPage title={route.title} description={route.description} />
              }
            />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Footer />
      </div>
    </SocketProvider>
  );
}
