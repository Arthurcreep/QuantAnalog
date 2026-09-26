const {
  validateTimeframeConversion,
} = require(
  "../src/modules/datasets/timeframes/validateTimeframeConversion"
);

const run = () => {
  const valid =
    validateTimeframeConversion({
      sourceTimeframe: "1m",
      targetTimeframe: "15m",
    });

  console.dir(valid);

  if (
    valid.expectedSourceRows !== 15
  ) {
    throw new Error(
      "Incorrect source row count"
    );
  }

  let upsamplingBlocked = false;

  try {
    validateTimeframeConversion({
      sourceTimeframe: "1h",
      targetTimeframe: "15m",
    });
  } catch (error) {
    upsamplingBlocked =
      error.code ===
      "TIMEFRAME_UPSAMPLING_FORBIDDEN";

    console.log(error.code);
  }

  if (!upsamplingBlocked) {
    throw new Error(
      "Upsampling was not blocked"
    );
  }

  console.log(
    "Timeframe conversion test passed"
  );
};

run();