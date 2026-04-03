const bidCooldownMap = new Map();

const getCooldownKey = (userId, auctionId) =>
  `${String(userId)}_${String(auctionId)}`;

export const canPlaceBid = (userId, auctionId, cooldownSeconds = 0) => {
  const key = getCooldownKey(userId, auctionId);
  const lastBidTime = bidCooldownMap.get(key);

  if (!lastBidTime) {
    return true;
  }

  const cooldownMs = Number(cooldownSeconds || 0) * 1000;
  if (cooldownMs <= 0) {
    return true;
  }

  const now = Date.now();
  return now - lastBidTime >= cooldownMs;
};

export const updateBidTime = (userId, auctionId) => {
  const key = getCooldownKey(userId, auctionId);
  bidCooldownMap.set(key, Date.now());
};

export const clearCooldown = (userId, auctionId) => {
  const key = getCooldownKey(userId, auctionId);
  bidCooldownMap.delete(key);
};
