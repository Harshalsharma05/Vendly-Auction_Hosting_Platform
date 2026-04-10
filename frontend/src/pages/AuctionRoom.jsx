import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import SectionHeader from "../components/ui/SectionHeader";
import ItemCard from "../components/ui/ItemCard";
import RoomHeaderSkeleton from "../components/auction/RoomHeaderSkeleton";
import ItemSkeleton from "../components/auction/ItemSkeleton";
import AuctionRoomHeader from "../components/auction/AuctionRoomHeader";
import AuctionJoinPanel from "../components/auction/AuctionJoinPanel";
import AuctionHostControlPanel from "../components/auction/AuctionHostControlPanel";
import AuctionAddItemForm from "../components/auction/AuctionAddItemForm";
import AuctionItemControlsPanel from "../components/auction/AuctionItemControlsPanel";
import AuctionSubmitItemPanel from "../components/auction/AuctionSubmitItemPanel";
import axiosInstance from "../lib/axios";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import useFinalCallTimer from "../hooks/useFinalCallTimer";
import useFinalCallPreview from "../hooks/useFinalCallPreview";
import usePendingSubmissionIds from "../hooks/usePendingSubmissionIds";
import useAuctionRoomData from "../hooks/useAuctionRoomData";
import useAuctionRoomSocketEvents from "../hooks/useAuctionRoomSocketEvents";
import useAuctionRoomPresence from "../hooks/useAuctionRoomPresence";
import useAuctionRoomItemActions from "../hooks/useAuctionRoomItemActions";
import FinalCallBanner from "../components/ui/FinalCallBanner";
import useBidCooldown from "../hooks/useBidCooldown";
import {
  createItemEditForm,
  formatCurrency,
  mapItemsToCards,
  normalizeEntityId,
} from "../utils/auctionRoom.utils";

const FALLBACK_AUCTION_IMAGE =
  "https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=1400&q=80";
const FALLBACK_ITEM_IMAGE =
  "https://images.unsplash.com/photo-1579546929662-711aa81148cf?w=600&q=80";
const ITEM_STATUS_OPTIONS = ["pending", "live", "sold", "unsold"];
const ENABLE_FINAL_CALL_PREVIEW = import.meta.env.DEV;
const INITIAL_ADD_ITEM_FORM = {
  title: "",
  description: "",
  startingPrice: "",
  bidIncrement: "0",
  imageUrls: "",
};

export default function AuctionRoom() {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const { socket, isSocketConnected } = useSocket();
  const { user: currentUser } = useAuth();

  const {
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
  } = useAuctionRoomData({ auctionId });
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [bidInputs, setBidInputs] = useState({});
  const [isPlacingBidByItem, setIsPlacingBidByItem] = useState({});
  const [isUpdatingStatusByItem, setIsUpdatingStatusByItem] = useState({});
  const [isStartingAuction, setIsStartingAuction] = useState(false);
  const [isAdvancingItem, setIsAdvancingItem] = useState(false);
  const [isEndingAuction, setIsEndingAuction] = useState(false);
  const [isAddItemFormOpen, setIsAddItemFormOpen] = useState(false);
  const [isSubmitFormOpen, setIsSubmitFormOpen] = useState(false);
  const [isSubmissionReviewOpen, setIsSubmissionReviewOpen] = useState(false);
  const [addItemForm, setAddItemForm] = useState(INITIAL_ADD_ITEM_FORM);
  const [isSubmittingNewItem, setIsSubmittingNewItem] = useState(false);
  const [editItemFormById, setEditItemFormById] = useState({});
  const [isEditFormOpenById, setIsEditFormOpenById] = useState({});
  const [isUpdatingItemById, setIsUpdatingItemById] = useState({});
  const [isDeleteConfirmOpenById, setIsDeleteConfirmOpenById] = useState({});
  const [isDeletingItemById, setIsDeletingItemById] = useState({});
  const [soldFlashByItem, setSoldFlashByItem] = useState({});
  const [isFinalCallExtended, setIsFinalCallExtended] = useState(false);
  const {
    finalCallPreview,
    startFinalCallPreview,
    extendFinalCallPreview,
    resetFinalCallPreview,
  } = useFinalCallPreview();

  const statusLabel = useMemo(() => {
    const status = (auction?.status || "scheduled").toLowerCase();
    return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
  }, [auction?.status]);

  const normalizedAuctionStatus = (
    auction?.status || "scheduled"
  ).toLowerCase();
  const canJoinLiveAuction = normalizedAuctionStatus === "live";
  const finalCallDuration = Number(auction?.finalCallDuration ?? 0);
  const antiSnipingExtension = Number(auction?.antiSnipingExtension ?? 0);
  const bidCooldown = Number(auction?.bidCooldown ?? 0);
  const hasTimingRules =
    finalCallDuration > 0 || antiSnipingExtension > 0 || bidCooldown > 0;

  const hostId = normalizeEntityId(auction?.createdBy);
  const currentUserId = normalizeEntityId(currentUser?._id || currentUser?.id);
  const isHost =
    Boolean(hostId) && Boolean(currentUserId) && hostId === currentUserId;

  const pendingSubmissionIds = usePendingSubmissionIds({
    socket,
    auctionId,
    isHost,
  });

  const activeLiveItem = useMemo(
    () =>
      items.find((item) => (item?.status || "").toLowerCase() === "live") ||
      null,
    [items],
  );

  const { isFinalCall, remainingMs } = useFinalCallTimer({
    socket,
    activeItemId: activeLiveItem?._id,
  });

  const { isCoolingDown, remainingCooldownMs } = useBidCooldown({
    socket,
    cooldownSeconds: auction?.bidCooldown ?? 3,
  });

  const shouldShowFinalCallBanner = finalCallPreview.active || isFinalCall;
  const displayedRemainingMs = finalCallPreview.active
    ? finalCallPreview.remainingMs
    : remainingMs;
  const displayedExtended = finalCallPreview.active
    ? finalCallPreview.extended
    : isFinalCallExtended;

  useAuctionRoomSocketEvents({
    socket,
    auctionId,
    currentUserId,
    isHost,
    setItems,
    setAuction,
    setStatusInputsByItem,
    setSoldFlashByItem,
    setIsJoined,
    setIsFinalCallExtended,
  });

  useAuctionRoomPresence({
    socket,
    auctionId,
    isJoined,
    setIsJoined,
    setIsJoining,
    isHost,
    isSocketConnected,
  });

  const onBidInputChange = (itemId, rawValue) => {
    setBidInputs((previousInputs) => ({
      ...previousInputs,
      [itemId]: rawValue,
    }));
  };

  const handleToggleEditItemForm = (item) => {
    const itemId = item?._id || item?.id;
    if (!itemId) {
      return;
    }

    setIsEditFormOpenById((previousState) => {
      const nextIsOpen = !previousState[itemId];

      if (nextIsOpen) {
        setEditItemFormById((previousForms) => ({
          ...previousForms,
          [itemId]: createItemEditForm(item),
        }));
      }

      return {
        ...previousState,
        [itemId]: nextIsOpen,
      };
    });
  };

  const handleCloseEditItemForm = (itemId) => {
    setIsEditFormOpenById((previousState) => ({
      ...previousState,
      [itemId]: false,
    }));
  };

  const handleToggleDeleteItemConfirm = (itemId, nextValue) => {
    setIsDeleteConfirmOpenById((previousState) => ({
      ...previousState,
      [itemId]: Boolean(nextValue),
    }));
  };

  const {
    onStatusInputChange,
    onAddItemInputChange,
    onEditItemInputChange,
    handleAddItemSubmit,
    handleUpdateItemDetails,
    handleDeleteItem,
    handleUpdateItemStatus,
  } = useAuctionRoomItemActions({
    auctionId,
    addItemForm,
    setAddItemForm,
    setIsAddItemFormOpen,
    setIsSubmittingNewItem,
    editItemFormById,
    setEditItemFormById,
    setIsEditFormOpenById,
    setIsUpdatingItemById,
    setIsDeleteConfirmOpenById,
    setIsDeletingItemById,
    statusInputsByItem,
    setStatusInputsByItem,
    setItems,
    setIsUpdatingStatusByItem,
    itemStatusOptions: ITEM_STATUS_OPTIONS,
    initialAddItemForm: INITIAL_ADD_ITEM_FORM,
  });

  const handleJoin = async () => {
    if (!auctionId || isJoining || isJoined) {
      return;
    }

    if (!canJoinLiveAuction) {
      if (normalizedAuctionStatus === "scheduled") {
        toast("This auction is scheduled. Join opens when it goes live.", {
          duration: 2600,
        });
      } else {
        toast.error(`Cannot join while auction is ${normalizedAuctionStatus}.`);
      }
      return;
    }

    if (!socket || !isSocketConnected) {
      toast.error("Socket is not connected yet. Please try again.");
      return;
    }

    setIsJoining(true);

    try {
      await axiosInstance.post(`/participants/auction/${auctionId}/join`, {
        role: "participant",
      });
      socket.emit("JOIN_AUCTION", auctionId);
      setIsJoined(true);
      toast.success("You have entered the live room");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Unable to join the live room right now.";

      if (/already joined/i.test(message)) {
        socket.emit("JOIN_AUCTION", auctionId);
        setIsJoined(true);
        toast.success("You are already in this live room.");
        return;
      }

      toast.error(message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleBid = (item) => {
    const itemId = item?._id;
    const itemStatus = (item?.status || "pending").toLowerCase();

    if (isHost) {
      toast.error("Hosts cannot place bids in their own auction.");
      return;
    }

    if (!socket || !isSocketConnected) {
      toast.error("Connect to the live room before placing a bid.");
      return;
    }

    if (!isJoined) {
      toast.error("Join the live room before placing bids.");
      return;
    }

    if (itemStatus !== "live") {
      toast.error("This item is not live for bidding yet.");
      return;
    }

    if (!itemId || !auctionId) {
      toast.error("Unable to place this bid right now.");
      return;
    }

    const bidAmount = Number(bidInputs[itemId]);
    const minimumSuggestedBid =
      Number(item?.currentHighestBid || 0) + Number(item?.bidIncrement || 0);

    if (Number.isNaN(bidAmount) || bidAmount <= 0) {
      toast.error("Enter a valid bid amount.");
      return;
    }

    if (bidAmount < minimumSuggestedBid) {
      toast.error(`Minimum bid is ${formatCurrency(minimumSuggestedBid)}.`);
      return;
    }

    setIsPlacingBidByItem((previousState) => ({
      ...previousState,
      [itemId]: true,
    }));

    socket.emit(
      "PLACE_BID",
      { auctionId, itemId: item._id, bidAmount: Number(bidAmount) },
      (acknowledgement) => {
        setIsPlacingBidByItem((previousState) => ({
          ...previousState,
          [itemId]: false,
        }));

        if (acknowledgement?.success) {
          setBidInputs((previousInputs) => ({
            ...previousInputs,
            [itemId]: "",
          }));
        }
      },
    );
  };

  const handleStartAuction = () => {
    if (!socket || !isSocketConnected || !auctionId) {
      toast.error("Socket is not connected yet. Please try again.");
      return;
    }

    setIsStartingAuction(true);
    socket.emit("START_AUCTION", auctionId, (acknowledgement) => {
      setIsStartingAuction(false);

      if (acknowledgement?.success) {
        toast.success("Start command sent to live room.");
      }
    });
  };

  const handleNextItem = () => {
    if (!socket || !isSocketConnected || !auctionId) {
      toast.error("Socket is not connected yet. Please try again.");
      return;
    }

    if (!activeLiveItem?._id) {
      toast.error("No active live item is available to transition.");
      return;
    }

    setIsAdvancingItem(true);
    socket.emit(
      "NEXT_ITEM",
      { auctionId, currentItemId: activeLiveItem._id },
      (acknowledgement) => {
        setIsAdvancingItem(false);

        if (acknowledgement?.success) {
          toast.success("Next item command sent.");
        }
      },
    );
  };

  const handleEndAuction = () => {
    if (!socket || !isSocketConnected || !auctionId) {
      toast.error("Socket is not connected yet. Please try again.");
      return;
    }

    setIsEndingAuction(true);
    socket.emit("END_AUCTION", auctionId, (acknowledgement) => {
      setIsEndingAuction(false);

      if (acknowledgement?.success) {
        toast.success("End auction command sent.");
      }
    });
  };

  const mappedItems = useMemo(
    () => mapItemsToCards(items, FALLBACK_ITEM_IMAGE),
    [items],
  );

  return (
    <main className="pt-23 min-h-screen bg-white">
      <section className="px-6 lg:px-10 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4">
            <Link
              to="/"
              className="text-[12px] font-sans text-brand-muted hover:text-brand-charcoal underline underline-offset-2 transition-colors duration-150"
            >
              Back to Live Auctions
            </Link>
          </div>

          {isLoadingAuction ? (
            <RoomHeaderSkeleton />
          ) : (
            <AuctionRoomHeader
              auction={auction}
              statusLabel={statusLabel}
              isSocketConnected={isSocketConnected}
              hasTimingRules={hasTimingRules}
              finalCallDuration={finalCallDuration}
              antiSnipingExtension={antiSnipingExtension}
              bidCooldown={bidCooldown}
              fallbackAuctionImage={FALLBACK_AUCTION_IMAGE}
            />
          )}

          <AuctionJoinPanel
            isLoadingAuction={isLoadingAuction}
            isHost={isHost}
            canJoinLiveAuction={canJoinLiveAuction}
            normalizedAuctionStatus={normalizedAuctionStatus}
            auctionStartTime={auction?.startTime}
            isJoined={isJoined}
            isJoining={isJoining}
            isSocketConnected={isSocketConnected}
            onJoin={handleJoin}
            onGoLiveRoom={() => navigate(`/auction/${auctionId}/live-room`)}
          />

          <AuctionHostControlPanel
            isLoadingAuction={isLoadingAuction}
            isHost={isHost}
            auctionId={auctionId}
            socket={socket}
            normalizedAuctionStatus={normalizedAuctionStatus}
            isStartingAuction={isStartingAuction}
            isAdvancingItem={isAdvancingItem}
            isEndingAuction={isEndingAuction}
            onOpenViewPanel={() => navigate(`/auction/${auctionId}/host-view`)}
            onStartAuction={handleStartAuction}
            onNextItem={handleNextItem}
            onEndAuction={handleEndAuction}
            enableFinalCallPreview={ENABLE_FINAL_CALL_PREVIEW}
            finalCallPreview={finalCallPreview}
            onStartFinalCallPreview={startFinalCallPreview}
            onExtendFinalCallPreview={extendFinalCallPreview}
            onResetFinalCallPreview={resetFinalCallPreview}
            pendingSubmissionCount={pendingSubmissionIds.length}
            isSubmissionReviewOpen={isSubmissionReviewOpen}
            onToggleSubmissionReview={() =>
              setIsSubmissionReviewOpen((previousState) => !previousState)
            }
          />

          <section className="pt-10">
            <div className="flex items-center justify-between gap-3 mb-5">
              <SectionHeader
                title="Auction Items"
                linkLabel={`${mappedItems.length} listed`}
                href="#"
                className="mb-0 flex-1"
              />
              <div className="flex flex-wrap items-center justify-end gap-2">
                {isHost && (
                  <button
                    type="button"
                    onClick={() =>
                      setIsAddItemFormOpen((previousState) => !previousState)
                    }
                    disabled={isSubmittingNewItem}
                    className="inline-flex items-center justify-center rounded-full bg-brand-charcoal text-white border border-brand-charcoal px-4 py-2 text-xs sm:text-sm font-sans font-medium hover:bg-brand-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isAddItemFormOpen ? "Hide Form" : "Add Item"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => refreshItemsOnly({ showToast: true })}
                  disabled={isRefreshingItems}
                  className="inline-flex items-center justify-center rounded-full bg-white text-brand-charcoal border border-brand-border px-3 py-1.5 text-[11px] sm:text-xs font-sans font-medium hover:bg-brand-light transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isRefreshingItems ? "Refreshing..." : "Refresh Items"}
                </button>
              </div>
            </div>

            {shouldShowFinalCallBanner && (
              <div className="mb-5">
                <FinalCallBanner
                  isFinalCall={shouldShowFinalCallBanner}
                  remainingMs={displayedRemainingMs}
                  extended={displayedExtended}
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
              {isLoadingItems &&
                Array.from({ length: 6 }).map((_, index) => (
                  <ItemSkeleton keyId={`item-skeleton-${index}`} />
                ))}

              {!isLoadingItems &&
                mappedItems.length > 0 &&
                mappedItems.map((item, index) => {
                  const sourceItem = items[index] || {};
                  const sourceItemId =
                    sourceItem?._id || sourceItem?.id || item.id;
                  const itemEditForm =
                    editItemFormById[sourceItemId] ||
                    createItemEditForm(sourceItem);
                  const minimumSuggestedBid =
                    Number(sourceItem?.currentHighestBid || 0) +
                    Number(sourceItem?.bidIncrement || 0);
                  const currentHighestBid = Number(
                    sourceItem?.currentHighestBid || 0,
                  );
                  const highestBidder = sourceItem?.currentHighestBidder;
                  const highestBidderName =
                    typeof highestBidder === "string"
                      ? highestBidder
                      : highestBidder?.name || "No bids yet";
                  const bidCount = Number(sourceItem?.bidCount || 0);
                  const itemStatus = (
                    sourceItem?.status || "pending"
                  ).toLowerCase();
                  const isLiveItem = itemStatus === "live";
                  const cooldownSecondsLeft = Math.ceil(
                    remainingCooldownMs / 1000,
                  );
                  const isBidControlsDisabled =
                    isHost ||
                    !isJoined ||
                    !isLiveItem ||
                    isCoolingDown ||
                    Boolean(isPlacingBidByItem[sourceItemId]);
                  const selectedStatus =
                    statusInputsByItem[sourceItemId] || itemStatus;
                  const isStatusUpdateDisabled = Boolean(
                    isUpdatingStatusByItem[sourceItemId],
                  );
                  const isItemLocked = ["live", "sold"].includes(itemStatus);
                  const isEditFormOpen = Boolean(
                    isEditFormOpenById[sourceItemId],
                  );
                  const isUpdatingItem = Boolean(
                    isUpdatingItemById[sourceItemId],
                  );
                  const isDeleteConfirmOpen = Boolean(
                    isDeleteConfirmOpenById[sourceItemId],
                  );
                  const isDeletingItem = Boolean(
                    isDeletingItemById[sourceItemId],
                  );
                  const isSoldFlashing = Boolean(soldFlashByItem[sourceItemId]);

                  return (
                    <div key={item.id} className="flex flex-col gap-3">
                      <div
                        className={[
                          "relative rounded-2xl",
                          isLiveItem
                            ? "ring-2 ring-green-300 shadow-[0_0_0_1px_rgba(134,239,172,0.65)]"
                            : "",
                        ].join(" ")}
                      >
                        <ItemCard artwork={item} variant="featured" />

                        {isSoldFlashing && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-brand-charcoal/72">
                            <div className="rounded-full border border-white/30 bg-white/12 px-4 py-2 text-xs sm:text-sm font-sans font-medium text-white">
                              Sold
                            </div>
                          </div>
                        )}
                      </div>

                      {isLiveItem && (
                        <div className="-mt-1 inline-flex w-fit items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-[11px] sm:text-xs font-sans font-medium text-green-700">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                          </span>
                          Live Item
                        </div>
                      )}

                      <AuctionItemControlsPanel
                        item={item}
                        sourceItem={sourceItem}
                        sourceItemId={sourceItemId}
                        isHost={isHost}
                        isJoined={isJoined}
                        isLiveItem={isLiveItem}
                        isCoolingDown={isCoolingDown}
                        cooldownSecondsLeft={cooldownSecondsLeft}
                        isPlacingBid={Boolean(isPlacingBidByItem[sourceItemId])}
                        isBidControlsDisabled={isBidControlsDisabled}
                        bidInputValue={bidInputs[sourceItemId] ?? ""}
                        onBidInputChange={onBidInputChange}
                        onBid={handleBid}
                        currentHighestBid={currentHighestBid}
                        highestBidderName={highestBidderName}
                        bidCount={bidCount}
                        minimumSuggestedBid={minimumSuggestedBid}
                        itemStatus={itemStatus}
                        isItemLocked={isItemLocked}
                        isEditFormOpen={isEditFormOpen}
                        isUpdatingItem={isUpdatingItem}
                        isDeleteConfirmOpen={isDeleteConfirmOpen}
                        isDeletingItem={isDeletingItem}
                        itemEditForm={itemEditForm}
                        onToggleEditItemForm={handleToggleEditItemForm}
                        onToggleDeleteItemConfirm={
                          handleToggleDeleteItemConfirm
                        }
                        onDeleteItem={handleDeleteItem}
                        onEditItemInputChange={onEditItemInputChange}
                        onUpdateItemDetails={handleUpdateItemDetails}
                        onCloseEditItemForm={handleCloseEditItemForm}
                        selectedStatus={selectedStatus}
                        statusOptions={ITEM_STATUS_OPTIONS}
                        onStatusInputChange={onStatusInputChange}
                        isStatusUpdateDisabled={isStatusUpdateDisabled}
                        onUpdateItemStatus={handleUpdateItemStatus}
                      />
                    </div>
                  );
                })}

              {!isLoadingItems && mappedItems.length === 0 && (
                <div className="col-span-full rounded-2xl border border-brand-border bg-brand-light/40 p-6 text-sm text-brand-muted">
                  No items are listed for this auction yet.
                </div>
              )}
            </div>

            <AuctionAddItemForm
              isHost={isHost}
              isOpen={isAddItemFormOpen}
              addItemForm={addItemForm}
              isSubmittingNewItem={isSubmittingNewItem}
              onSubmit={handleAddItemSubmit}
              onInputChange={onAddItemInputChange}
              onCancel={() => {
                setAddItemForm(INITIAL_ADD_ITEM_FORM);
                setIsAddItemFormOpen(false);
              }}
            />

            <AuctionSubmitItemPanel
              isHost={isHost}
              normalizedAuctionStatus={normalizedAuctionStatus}
              isSubmitFormOpen={isSubmitFormOpen}
              onToggleSubmitForm={() =>
                setIsSubmitFormOpen((previousState) => !previousState)
              }
              auctionId={auctionId}
              onSubmitSuccess={() => setIsSubmitFormOpen(false)}
            />
          </section>
        </div>
      </section>
    </main>
  );
}
