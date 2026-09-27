const isFiniteNumber = (
  value
) =>
  typeof value ===
    "number" &&
  Number.isFinite(value);

const calculateDrawdown = ({
  startingCapital,
  equityCurve,
}) => {
  if (
    !isFiniteNumber(
      startingCapital
    ) ||
    startingCapital <= 0
  ) {
    throw new Error(
      "INVALID_STARTING_CAPITAL"
    );
  }

  if (
    !Array.isArray(
      equityCurve
    )
  ) {
    throw new Error(
      "INVALID_EQUITY_CURVE"
    );
  }

  let maxDrawdown =
    0;

  let maxDrawdownAmount =
    0;

  let peakEquity =
    startingCapital;

  let peakIndex =
    null;

  let troughIndex =
    null;

  let currentPeakIndex =
    null;

  for (
    let index = 0;
    index <
    equityCurve.length;
    index += 1
  ) {
    const point =
      equityCurve[
        index
      ];

    const equity =
      point.equityAfter;

    if (
      !isFiniteNumber(
        equity
      )
    ) {
      throw new Error(
        `INVALID_EQUITY_POINT:${index}`
      );
    }

    if (
      equity >
      peakEquity
    ) {
      peakEquity =
        equity;

      currentPeakIndex =
        index;
    }

    const drawdownAmount =
      equity -
      peakEquity;

    const drawdown =
      peakEquity > 0
        ? drawdownAmount /
          peakEquity
        : 0;

    if (
      drawdown <
      maxDrawdown
    ) {
      maxDrawdown =
        drawdown;

      maxDrawdownAmount =
        drawdownAmount;

      peakIndex =
        currentPeakIndex;

      troughIndex =
        index;
    }
  }

  return {
    maxDrawdown,

    maxDrawdownAmount,

    peakIndex,

    troughIndex,
  };
};

module.exports = {
  calculateDrawdown,
};