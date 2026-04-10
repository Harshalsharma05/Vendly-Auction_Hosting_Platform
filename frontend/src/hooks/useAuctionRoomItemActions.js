import toast from "react-hot-toast";
import axiosInstance from "../lib/axios";
import { createItemEditForm } from "../utils/auctionRoom.utils";

export default function useAuctionRoomItemActions({
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
  itemStatusOptions,
  initialAddItemForm,
}) {
  const onStatusInputChange = (itemId, nextStatus) => {
    setStatusInputsByItem((previousState) => ({
      ...previousState,
      [itemId]: String(nextStatus || "pending").toLowerCase(),
    }));
  };

  const onAddItemInputChange = (field, value) => {
    setAddItemForm((previousState) => ({
      ...previousState,
      [field]: value,
    }));
  };

  const onEditItemInputChange = (itemId, field, value) => {
    setEditItemFormById((previousState) => ({
      ...previousState,
      [itemId]: {
        ...(previousState[itemId] || {}),
        [field]: value,
      },
    }));
  };

  const handleAddItemSubmit = async (event) => {
    event.preventDefault();

    if (!auctionId) {
      toast.error("Unable to add an item right now.");
      return;
    }

    const title = addItemForm.title.trim();
    const description = addItemForm.description.trim();
    const startingPrice = Number(addItemForm.startingPrice);
    const bidIncrement = Number(addItemForm.bidIncrement || 0);
    const imageUrls = addItemForm.imageUrls
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (!title) {
      toast.error("Item title is required.");
      return;
    }

    if (!description) {
      toast.error("Item description is required.");
      return;
    }

    if (Number.isNaN(startingPrice) || startingPrice < 0) {
      toast.error("Starting price must be 0 or more.");
      return;
    }

    if (Number.isNaN(bidIncrement) || bidIncrement < 0) {
      toast.error("Bid increment must be 0 or more.");
      return;
    }

    setIsSubmittingNewItem(true);

    try {
      const response = await axiosInstance.post(`/items/auction/${auctionId}`, {
        title,
        description,
        startingPrice,
        bidIncrement,
        imageUrls,
      });

      const createdItem = response?.data?.data || null;
      if (!createdItem) {
        throw new Error("Invalid server response");
      }

      setItems((previousItems) => [createdItem, ...previousItems]);
      setStatusInputsByItem((previousState) => ({
        ...previousState,
        [createdItem._id || createdItem.id]: (
          createdItem?.status || "pending"
        ).toLowerCase(),
      }));
      setAddItemForm(initialAddItemForm);
      setIsAddItemFormOpen(false);
      toast.success("Item added successfully.");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Unable to add this item right now.";
      toast.error(message);
    } finally {
      setIsSubmittingNewItem(false);
    }
  };

  const handleUpdateItemDetails = async (item) => {
    const itemId = item?._id || item?.id;
    if (!itemId) {
      toast.error("Unable to update this item right now.");
      return;
    }

    const formState = editItemFormById[itemId] || createItemEditForm(item);
    const title = formState.title.trim();
    const description = formState.description.trim();
    const startingPrice = Number(formState.startingPrice);
    const bidIncrement = Number(formState.bidIncrement || 0);
    const imageUrls = String(formState.imageUrls || "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (!title) {
      toast.error("Item title is required.");
      return;
    }

    if (!description) {
      toast.error("Item description is required.");
      return;
    }

    if (Number.isNaN(startingPrice) || startingPrice < 0) {
      toast.error("Starting price must be 0 or more.");
      return;
    }

    if (Number.isNaN(bidIncrement) || bidIncrement < 0) {
      toast.error("Bid increment must be 0 or more.");
      return;
    }

    setIsUpdatingItemById((previousState) => ({
      ...previousState,
      [itemId]: true,
    }));

    try {
      const response = await axiosInstance.patch(`/items/${itemId}`, {
        title,
        description,
        startingPrice,
        bidIncrement,
        imageUrls,
      });

      const updatedItem = response?.data?.data || null;
      if (!updatedItem) {
        throw new Error("Invalid server response");
      }

      setItems((previousItems) =>
        previousItems.map((entry) => {
          const entryId = entry?._id || entry?.id;
          return String(entryId) === String(itemId) ? updatedItem : entry;
        }),
      );
      setEditItemFormById((previousState) => ({
        ...previousState,
        [itemId]: createItemEditForm(updatedItem),
      }));
      setIsEditFormOpenById((previousState) => ({
        ...previousState,
        [itemId]: false,
      }));
      toast.success("Item updated successfully.");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Unable to update this item right now.";
      toast.error(message);
    } finally {
      setIsUpdatingItemById((previousState) => ({
        ...previousState,
        [itemId]: false,
      }));
    }
  };

  const handleDeleteItem = async (item) => {
    const itemId = item?._id || item?.id;
    if (!itemId) {
      toast.error("Unable to delete this item right now.");
      return;
    }

    setIsDeletingItemById((previousState) => ({
      ...previousState,
      [itemId]: true,
    }));

    try {
      await axiosInstance.delete(`/items/${itemId}`);

      setItems((previousItems) =>
        previousItems.filter((entry) => {
          const entryId = entry?._id || entry?.id;
          return String(entryId) !== String(itemId);
        }),
      );
      setStatusInputsByItem((previousState) => {
        const nextState = { ...previousState };
        delete nextState[itemId];
        return nextState;
      });
      setEditItemFormById((previousState) => {
        const nextState = { ...previousState };
        delete nextState[itemId];
        return nextState;
      });
      setIsEditFormOpenById((previousState) => ({
        ...previousState,
        [itemId]: false,
      }));
      setIsDeleteConfirmOpenById((previousState) => ({
        ...previousState,
        [itemId]: false,
      }));
      toast.success("Item deleted successfully.");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Unable to delete this item right now.";
      toast.error(message);
    } finally {
      setIsDeletingItemById((previousState) => ({
        ...previousState,
        [itemId]: false,
      }));
    }
  };

  const handleUpdateItemStatus = async (item) => {
    const itemId = item?._id || item?.id;
    if (!itemId) {
      toast.error("Unable to update this item status.");
      return;
    }

    const selectedStatus = String(
      statusInputsByItem[itemId] || item?.status || "pending",
    ).toLowerCase();

    if (!itemStatusOptions.includes(selectedStatus)) {
      toast.error("Please choose a valid item status.");
      return;
    }

    setIsUpdatingStatusByItem((previousState) => ({
      ...previousState,
      [itemId]: true,
    }));

    try {
      const response = await axiosInstance.patch(`/items/${itemId}/status`, {
        status: selectedStatus,
      });

      const updatedItem = response?.data?.data || null;
      if (!updatedItem) {
        throw new Error("Invalid server response");
      }

      setItems((previousItems) =>
        previousItems.map((entry) => {
          const entryId = entry?._id || entry?.id;

          if (String(entryId) === String(itemId)) {
            return {
              ...entry,
              ...updatedItem,
              status: (updatedItem?.status || selectedStatus).toLowerCase(),
            };
          }

          if (
            selectedStatus === "live" &&
            (entry?.status || "").toLowerCase() === "live"
          ) {
            return {
              ...entry,
              status: "pending",
            };
          }

          return entry;
        }),
      );

      setStatusInputsByItem((previousState) => ({
        ...previousState,
        [itemId]: (updatedItem?.status || selectedStatus).toLowerCase(),
      }));

      toast.success(`Item status updated to ${selectedStatus}.`);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Unable to update item status right now.";
      toast.error(message);
    } finally {
      setIsUpdatingStatusByItem((previousState) => ({
        ...previousState,
        [itemId]: false,
      }));
    }
  };

  return {
    onStatusInputChange,
    onAddItemInputChange,
    onEditItemInputChange,
    handleAddItemSubmit,
    handleUpdateItemDetails,
    handleDeleteItem,
    handleUpdateItemStatus,
  };
}
