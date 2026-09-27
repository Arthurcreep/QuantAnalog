const {
  buildFutureLogReturn,
} = require(
  "../targets/returns/buildFutureLogReturn"
);

const {
  buildFutureRealizedVolatility,
} = require(
  "../targets/volatility/buildFutureRealizedVolatility"
);

const buildContinuousTargetSeries =
  ({
    returnSeries,
    protocol,
    horizonBars,
    expectedIntervalMs,
  }) => {
    const targetName =
      protocol
        ?.target
        ?.name;

    if (
      targetName ===
      "FUTURE_LOG_RETURN"
    ) {
      return buildFutureLogReturn({
        series:
          returnSeries,

        horizonBars,

        expectedIntervalMs,
      });
    }

    if (
      targetName ===
      "FUTURE_REALIZED_VOLATILITY"
    ) {
      return buildFutureRealizedVolatility({
        series:
          returnSeries,

        horizonBars,

        expectedIntervalMs,
      });
    }

    throw new Error(
      `UNSUPPORTED_CONTINUOUS_TARGET:${targetName}`
    );
  };

module.exports = {
  buildContinuousTargetSeries,
};