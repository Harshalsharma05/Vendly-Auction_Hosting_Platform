export function createItemEditForm(item) {
  return {
    title: item?.title || "",
    description: item?.description || "",
    startingPrice: String(item?.startingPrice ?? ""),
    bidIncrement: String(item?.bidIncrement ?? 0),
    imageUrls: Array.isArray(item?.imageUrls) ? item.imageUrls.join(", ") : "",
  };
}

export function normalizeEntityId(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    if (typeof value?._id === "string") {
      return value._id;
    }

    if (value?._id) {
      return String(value._id);
    }

    if (typeof value?.id === "string") {
      return value.id;
    }

    if (value?.id) {
      return String(value.id);
    }
  }

  return String(value);
}

export function formatRoomTime(timeValue) {
  if (!timeValue) {
    return "To be announced";
  }

  const parsedDate = new Date(timeValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return "To be announced";
  }

  return parsedDate.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatCurrency(value) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return "$0";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(numeric);
}

export function mapItemsToCards(items, fallbackItemImage) {
  return items.map((item, index) => {
    const highestBid = item?.currentHighestBid || item?.startingPrice || 0;
    const status = (item?.status || "scheduled").toLowerCase();

    return {
      id: item?._id || item?.id || `item-${index}`,
      title: item?.title || "Untitled Item",
      artist: item?.description || "Live auction item",
      medium: `Increment: ${formatCurrency(item?.bidIncrement || 0)}`,
      price: formatCurrency(highestBid),
      sold: status === "sold",
      src:
        (Array.isArray(item?.imageUrls) && item.imageUrls[0]) ||
        item?.image ||
        fallbackItemImage,
    };
  });
}
