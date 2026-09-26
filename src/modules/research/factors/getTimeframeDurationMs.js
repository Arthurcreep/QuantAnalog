const UNIT_MS = {
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

const getTimeframeDurationMs = (
  timeframe
) => {
  if (
    typeof timeframe !==
    "string"
  ) {
    throw new Error(
      "INVALID_TIMEFRAME"
    );
  }

  const match =
    timeframe.match(
      /^(\d+)(m|h|d)$/
    );

  if (!match) {
    throw new Error(
      `UNSUPPORTED_TIMEFRAME: ${timeframe}`
    );
  }

  const amount =
    Number(match[1]);

  const unit =
    match[2];

  if (
    !Number.isInteger(amount) ||
    amount <= 0
  ) {
    throw new Error(
      "INVALID_TIMEFRAME_AMOUNT"
    );
  }

  return (
    amount *
    UNIT_MS[unit]
  );
};

module.exports = {
  getTimeframeDurationMs,
};