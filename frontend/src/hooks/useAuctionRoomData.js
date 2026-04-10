import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../lib/axios";

function buildStatusInputs(items) {
  return items.reduce((acc, item) => {
    const itemId = item?._id || item?.id;
    if (itemId) {
      acc[itemId] = (item?.status || "pending").toLowerCase();
    }
    return acc;
  }, {});
}

export default function useAuctionRoomData({ auctionId }) {
  const [auction, setAuction] = useState(null);
  const [items, setItems] = useState([]);
  const [isLoadingAuction, setIsLoadingAuction] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [isRefreshingItems, setIsRefreshingItems] = useState(false);
  const [statusInputsByItem, setStatusInputsByItem] = useState({});

  useEffect(() => {
    let isMounted = true;

    async function fetchAuctionDetails() {
      setIsLoadingAuction(true);
      setIsLoadingItems(true);

      try {
        const [auctionResponse, itemsResponse] = await Promise.all([
          axiosInstance.get(`/auctions/${auctionId}`),
          axiosInstance.get(`/items/auction/${auctionId}`),
        ]);

        const auctionPayload =
          auctionResponse?.data?.data || auctionResponse?.data || null;
        const itemsPayload =
          itemsResponse?.data?.data || itemsResponse?.data || [];
        const nextItems = Array.isArray(itemsPayload)
          ? itemsPayload
          : Array.isArray(itemsPayload?.items)
            ? itemsPayload.items
            : [];

        if (isMounted) {
          setAuction(auctionPayload);
          setItems(nextItems);
          setStatusInputsByItem(buildStatusInputs(nextItems));
        }
      } catch {
        if (isMounted) {
          toast.error("Unable to load this auction room right now.");
          setAuction(null);
          setItems([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingAuction(false);
          setIsLoadingItems(false);
        }
      }
    }

    if (auctionId) {
      fetchAuctionDetails();
    }

    return () => {
      isMounted = false;
    };
  }, [auctionId]);

  const refreshItemsOnly = useCallback(
    async ({ showToast = false } = {}) => {
      if (!auctionId) {
        return;
      }

      setIsRefreshingItems(true);

      try {
        const itemsResponse = await axiosInstance.get(
          `/items/auction/${auctionId}`,
        );
        const itemsPayload =
          itemsResponse?.data?.data || itemsResponse?.data || [];
        const nextItems = Array.isArray(itemsPayload)
          ? itemsPayload
          : Array.isArray(itemsPayload?.items)
            ? itemsPayload.items
            : [];

        setItems(nextItems);
        setStatusInputsByItem(buildStatusInputs(nextItems));

        if (showToast) {
          toast.success("Items refreshed.");
        }
      } catch {
        toast.error("Unable to refresh items right now.");
      } finally {
        setIsRefreshingItems(false);
      }
    },
    [auctionId],
  );

  return {
    auction,
    setAuction,
    items,
    setItems,
    isLoadingAuction,
    isLoadingItems,
    isRefreshingItems,
    statusInputsByItem,
    setStatusInputsByItem,
    refreshItemsOnly,
  };
}
