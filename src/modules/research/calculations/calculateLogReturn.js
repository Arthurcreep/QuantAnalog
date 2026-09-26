const calculateLogReturn = (
  previousPrice,
  currentPrice
) => {
  const previous =
    Number(previousPrice);

  const current =
    Number(currentPrice);

  if (
    !Number.isFinite(previous) ||
    !Number.isFinite(current) ||
    previous <= 0 ||
    current <= 0
  ) {
    return null;
  }

  return Math.log(
    current / previous
  );
};

module.exports = {
  calculateLogReturn,
};