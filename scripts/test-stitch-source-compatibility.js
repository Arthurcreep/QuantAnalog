const {
  validateStitchSources,
} = require(
  "../src/modules/datasets/stitching/validateStitchSources"
);

const baseDataset = {
  stage: "CLEAN",
  datasetType: "CANDLES",
  venue: "BYBIT",
  instrument: "BTCUSDT",
  marketType: "SPOT",
  sourceTimeframe: "1m",
  timezone: "UTC",
};

const run = () => {
  validateStitchSources([
    {
      ...baseDataset,
      id: "a",
    },
    {
      ...baseDataset,
      id: "b",
    },
  ]);

  let mismatchDetected = false;

  try {
    validateStitchSources([
      baseDataset,
      {
        ...baseDataset,
        instrument: "ETHUSDT",
      },
    ]);
  } catch (error) {
    mismatchDetected =
      error.code ===
      "INCOMPATIBLE_STITCH_SOURCES";

    console.log(
      error.code,
      error.details
    );
  }

  if (!mismatchDetected) {
    throw new Error(
      "Dataset mismatch was not detected"
    );
  }

  console.log(
    "Stitch source compatibility test passed"
  );
};

run();