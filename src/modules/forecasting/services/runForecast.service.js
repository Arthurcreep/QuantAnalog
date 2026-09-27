const {
  runGarchNormalMultiHorizonForecast,
} = require(
  "./runGarchNormalMultiHorizonForecast.service"
);

const {
  runArchNormalMultiHorizonForecast,
} = require(
  "./runArchNormalMultiHorizonForecast.service"
);

const {
  GARCH_NORMAL_MULTI_HORIZON_V1,
} = require(
  "../protocols/garchNormalMultiHorizonV1"
);

const {
  ARCH_NORMAL_MULTI_HORIZON_V1,
} = require(
  "../protocols/archNormalMultiHorizonV1"
);

const {
  createAppError,
} = require(
  "../../../errors/appError"
);

const MODEL_REGISTRY =
  Object.freeze([
    {
      modelId:
        "GARCH_NORMAL",

      modelVersion:
        "1.1.0",

      target:
        GARCH_NORMAL_MULTI_HORIZON_V1
          .target,

      modelTimeframe:
        GARCH_NORMAL_MULTI_HORIZON_V1
          .modelTimeframe,

      supportedHorizons:
        GARCH_NORMAL_MULTI_HORIZON_V1
          .supportedHorizons,

      run:
        runGarchNormalMultiHorizonForecast,
    },

    {
      modelId:
        "ARCH_NORMAL",

      modelVersion:
        "1.0.0",

      target:
        ARCH_NORMAL_MULTI_HORIZON_V1
          .target,

      modelTimeframe:
        ARCH_NORMAL_MULTI_HORIZON_V1
          .modelTimeframe,

      supportedHorizons:
        ARCH_NORMAL_MULTI_HORIZON_V1
          .supportedHorizons,

      run:
        runArchNormalMultiHorizonForecast,
    },
  ]);

const assertString = ({
  value,
  field,
}) => {
  if (
    typeof value !==
      "string" ||
    value.trim().length ===
      0
  ) {
    throw createAppError({
      statusCode:
        400,

      code:
        `INVALID_${field}`,

      message:
        `${field} is required`,
    });
  }
};

const findModelRegistration = ({
  modelId,
  modelVersion,
}) =>
  MODEL_REGISTRY.find(
    (item) =>
      item.modelId ===
        modelId &&
      item.modelVersion ===
        modelVersion
  ) ||
  null;

const validateHorizons = ({
  horizons,
  registration,
}) => {
  if (
    !Array.isArray(
      horizons
    ) ||
    horizons.length ===
      0
  ) {
    throw createAppError({
      statusCode:
        400,

      code:
        "INVALID_FORECAST_HORIZONS",

      message:
        "horizons must be a non-empty array",
    });
  }

  const uniqueHorizons =
    [
      ...new Set(
        horizons
      ),
    ];

  if (
    uniqueHorizons.length !==
    horizons.length
  ) {
    throw createAppError({
      statusCode:
        400,

      code:
        "DUPLICATE_FORECAST_HORIZON",

      message:
        "Forecast horizons must be unique",
    });
  }

  const supported =
    registration
      .supportedHorizons;

  const sameSet =
    uniqueHorizons.length ===
      supported.length &&
    supported.every(
      (horizon) =>
        uniqueHorizons.includes(
          horizon
        )
    );

  if (!sameSet) {
    throw createAppError({
      statusCode:
        400,

      code:
        "FORECAST_PROTOCOL_HORIZONS_MISMATCH",

      message:
        "Requested horizons do not match the frozen protocol",

      details: {
        modelId:
          registration
            .modelId,

        modelVersion:
          registration
            .modelVersion,

        supportedHorizons:
          supported,
      },
    });
  }
};

const runForecast =
  async ({
    datasetId,
    modelId,
    modelVersion,
    target,
    modelTimeframe,
    horizons,
    issuedAt,
    sourceAnalysisRunId =
      null,
  }) => {
    assertString({
      value:
        datasetId,

      field:
        "DATASET_ID",
    });

    assertString({
      value:
        modelId,

      field:
        "MODEL_ID",
    });

    assertString({
      value:
        modelVersion,

      field:
        "MODEL_VERSION",
    });

    assertString({
      value:
        target,

      field:
        "TARGET",
    });

    assertString({
      value:
        modelTimeframe,

      field:
        "MODEL_TIMEFRAME",
    });

    assertString({
      value:
        issuedAt,

      field:
        "ISSUED_AT",
    });

    const registration =
      findModelRegistration({
        modelId,
        modelVersion,
      });

    if (!registration) {
      throw createAppError({
        statusCode:
          400,

        code:
          "FORECAST_MODEL_NOT_REGISTERED",

        message:
          `Forecast model ${modelId}@${modelVersion} is not registered`,
      });
    }

    if (
      target !==
      registration.target
    ) {
      throw createAppError({
        statusCode:
          400,

        code:
          "FORECAST_TARGET_MODEL_MISMATCH",

        message:
          `${modelId}@${modelVersion} does not support target ${target}`,
      });
    }

    if (
      modelTimeframe !==
      registration
        .modelTimeframe
    ) {
      throw createAppError({
        statusCode:
          400,

        code:
          "FORECAST_TIMEFRAME_MODEL_MISMATCH",

        message:
          `${modelId}@${modelVersion} requires ${registration.modelTimeframe}`,
      });
    }

    validateHorizons({
      horizons,
      registration,
    });

    return registration.run({
      datasetId,
      issuedAt,
      sourceAnalysisRunId,
    });
  };

module.exports = {
  runForecast,
};