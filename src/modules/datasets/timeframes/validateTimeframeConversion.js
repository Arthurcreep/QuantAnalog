const {
  timeframeToMilliseconds,
} = require(
  "../calculations/timeframeToMilliseconds"
);

const {
  createAppError,
} = require(
  "../../../errors/appError"
);

const validateTimeframeConversion = ({
  sourceTimeframe,
  targetTimeframe,
}) => {
  const sourceMs =
    timeframeToMilliseconds(
      sourceTimeframe
    );

  const targetMs =
    timeframeToMilliseconds(
      targetTimeframe
    );

  if (!sourceMs || !targetMs) {
    throw createAppError({
      statusCode: 400,
      code: "UNSUPPORTED_TIMEFRAME",
      message:
        "Unsupported source or target timeframe",
    });
  }

  if (targetMs < sourceMs) {
    throw createAppError({
      statusCode: 400,
      code: "TIMEFRAME_UPSAMPLING_FORBIDDEN",
      message:
        `${sourceTimeframe} -> ${targetTimeframe} is forbidden`,
    });
  }

  if (targetMs % sourceMs !== 0) {
    throw createAppError({
      statusCode: 400,
      code: "INCOMPATIBLE_TIMEFRAMES",
      message:
        `${targetTimeframe} must be an exact multiple of ${sourceTimeframe}`,
    });
  }

  return {
    sourceTimeframe,
    targetTimeframe,
    sourceMs,
    targetMs,
    expectedSourceRows:
      targetMs / sourceMs,
  };
};

module.exports = {
  validateTimeframeConversion,
};