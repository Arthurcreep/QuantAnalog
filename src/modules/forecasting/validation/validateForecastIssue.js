const {
  timeframeToMilliseconds,
} = require(
  "../../datasets/calculations/timeframeToMilliseconds"
);

const parseTimestamp = ({
  value,
  field,
}) => {
  const timestamp =
    new Date(
      value
    ).getTime();

  if (
    !Number.isFinite(
      timestamp
    )
  ) {
    throw new Error(
      `INVALID_FORECAST_TIMESTAMP:${field}`
    );
  }

  return timestamp;
};

const validateNonEmptyString = ({
  value,
  field,
}) => {
  if (
    typeof value !==
      "string" ||
    value.trim().length ===
      0
  ) {
    throw new Error(
      `INVALID_FORECAST_${field}`
    );
  }
};

const validateForecastIssue = ({
  dataset,
  modelId,
  modelVersion,
  modelTimeframe,
  target,
  horizon,
  issuedAt,
  inputCutoffAt,
  targetWindowStartAt,
  targetWindowEndAt,
  modelConfig,
  prediction,
}) => {
  if (!dataset) {
    throw new Error(
      "FORECAST_DATASET_REQUIRED"
    );
  }

  if (
    dataset.stage !==
    "PREPARED"
  ) {
    throw new Error(
      "FORECAST_REQUIRES_PREPARED_DATASET"
    );
  }

  validateNonEmptyString({
    value:
      modelId,

    field:
      "MODEL_ID",
  });

  validateNonEmptyString({
    value:
      modelVersion,

    field:
      "MODEL_VERSION",
  });

  validateNonEmptyString({
    value:
      modelTimeframe,

    field:
      "MODEL_TIMEFRAME",
  });

  validateNonEmptyString({
    value:
      target,

    field:
      "TARGET",
  });

  validateNonEmptyString({
    value:
      horizon,

    field:
      "HORIZON",
  });

  if (
    dataset.sourceTimeframe !==
    modelTimeframe
  ) {
    throw new Error(
      "FORECAST_MODEL_TIMEFRAME_DATASET_MISMATCH"
    );
  }

  if (
    !modelConfig ||
    typeof modelConfig !==
      "object" ||
    Array.isArray(
      modelConfig
    )
  ) {
    throw new Error(
      "INVALID_FORECAST_MODEL_CONFIG"
    );
  }

  if (
    !prediction ||
    typeof prediction !==
      "object" ||
    Array.isArray(
      prediction
    )
  ) {
    throw new Error(
      "INVALID_FORECAST_PREDICTION"
    );
  }

  const timeframeMs =
    timeframeToMilliseconds(
      modelTimeframe
    );

  if (
    !Number.isFinite(
      timeframeMs
    ) ||
    timeframeMs <= 0
  ) {
    throw new Error(
      "UNSUPPORTED_FORECAST_MODEL_TIMEFRAME"
    );
  }

  const issuedAtMs =
    parseTimestamp({
      value:
        issuedAt,

      field:
        "ISSUED_AT",
    });

  const inputCutoffAtMs =
    parseTimestamp({
      value:
        inputCutoffAt,

      field:
        "INPUT_CUTOFF_AT",
    });

  const targetWindowStartAtMs =
    parseTimestamp({
      value:
        targetWindowStartAt,

      field:
        "TARGET_WINDOW_START_AT",
    });

  const targetWindowEndAtMs =
    parseTimestamp({
      value:
        targetWindowEndAt,

      field:
        "TARGET_WINDOW_END_AT",
    });

  if (
    inputCutoffAtMs >
    issuedAtMs
  ) {
    throw new Error(
      "FORECAST_INPUT_CUTOFF_AFTER_ISSUE_TIME"
    );
  }

  if (
    targetWindowStartAtMs <
    issuedAtMs
  ) {
    throw new Error(
      "FORECAST_TARGET_START_BEFORE_ISSUE_TIME"
    );
  }

  if (
    targetWindowEndAtMs <=
    targetWindowStartAtMs
  ) {
    throw new Error(
      "FORECAST_TARGET_WINDOW_INVALID"
    );
  }

  const datasetStartMs =
    parseTimestamp({
      value:
        dataset.startTime,

      field:
        "DATASET_START_TIME",
    });

  const datasetEndMs =
    parseTimestamp({
      value:
        dataset.endTime,

      field:
        "DATASET_END_TIME",
    });

  /*
   * Dataset timestamps identify the
   * beginning of candle buckets.
   *
   * A candle becomes observable only
   * after its interval has completed.
   */

  const datasetAvailableStartMs =
    datasetStartMs +
    timeframeMs;

  const datasetAvailableEndMs =
    datasetEndMs +
    timeframeMs;

  if (
    inputCutoffAtMs <
      datasetAvailableStartMs ||
    inputCutoffAtMs >
      datasetAvailableEndMs
  ) {
    throw new Error(
      "FORECAST_INPUT_CUTOFF_OUTSIDE_DATASET"
    );
  }

  return {
    timeframeMs,

    issuedAtMs,

    inputCutoffAtMs,

    targetWindowStartAtMs,

    targetWindowEndAtMs,

    datasetAvailableStartMs,

    datasetAvailableEndMs,
  };
};

module.exports = {
  validateForecastIssue,
};