const {
  createForecastRun,
  findForecastRunByKey,
} = require(
  "../runs/forecastRun.repository"
);

const {
  calculateObjectChecksum,
} = require(
  "../../../shared/hash/calculateObjectChecksum"
);

const ENGINE_VERSION =
  "forecast-run-issuance-v1.0";

const toIso = (
  value
) =>
  new Date(
    value
  ).toISOString();

const buildForecastRunKey = ({
  datasetId,
  datasetChecksum,
  sourceAnalysisRunId,
  modelId,
  modelVersion,
  modelChecksum,
  protocolId,
  protocolVersion,
  protocolChecksum,
  target,
  modelTimeframe,
  issuedAt,
  inputCutoffAt,
  horizons,
}) =>
  calculateObjectChecksum({
    datasetId,

    datasetChecksum,

    sourceAnalysisRunId,

    modelId,

    modelVersion,

    modelChecksum,

    protocolId,

    protocolVersion,

    protocolChecksum,

    target,

    modelTimeframe,

    issuedAt:
      toIso(
        issuedAt
      ),

    inputCutoffAt:
      toIso(
        inputCutoffAt
      ),

    horizons,
  });

const assertExistingRunMatches = ({
  existing,
  horizons,
  runConfig,
}) => {
  const existingHorizonsChecksum =
    calculateObjectChecksum(
      existing.horizons
    );

  const requestedHorizonsChecksum =
    calculateObjectChecksum(
      horizons
    );

  if (
    existingHorizonsChecksum !==
    requestedHorizonsChecksum
  ) {
    throw new Error(
      "FORECAST_RUN_HORIZONS_CONFLICT"
    );
  }

  const existingConfigChecksum =
    calculateObjectChecksum(
      existing.runConfig
    );

  const requestedConfigChecksum =
    calculateObjectChecksum(
      runConfig
    );

  if (
    existingConfigChecksum !==
    requestedConfigChecksum
  ) {
    throw new Error(
      "FORECAST_RUN_CONFIG_CONFLICT"
    );
  }
};

const issueForecastRun =
  async ({
    dataset,
    sourceAnalysisRunId = null,
    modelDefinition,
    protocolDefinition,
    target,
    modelTimeframe,
    issuedAt,
    inputCutoffAt,
    horizons,
    runConfig,
  }, options = {}) => {
    if (
      !dataset ||
      !dataset.id ||
      !dataset.checksum
    ) {
      throw new Error(
        "FORECAST_RUN_DATASET_REQUIRED"
      );
    }

    if (
      !modelDefinition ||
      typeof modelDefinition !==
        "object" ||
      Array.isArray(
        modelDefinition
      )
    ) {
      throw new Error(
        "FORECAST_RUN_MODEL_DEFINITION_REQUIRED"
      );
    }

    if (
      !protocolDefinition ||
      typeof protocolDefinition !==
        "object" ||
      Array.isArray(
        protocolDefinition
      )
    ) {
      throw new Error(
        "FORECAST_RUN_PROTOCOL_DEFINITION_REQUIRED"
      );
    }

    if (
      !Array.isArray(
        horizons
      ) ||
      horizons.length ===
        0
    ) {
      throw new Error(
        "FORECAST_RUN_HORIZONS_REQUIRED"
      );
    }

    if (
      !runConfig ||
      typeof runConfig !==
        "object" ||
      Array.isArray(
        runConfig
      )
    ) {
      throw new Error(
        "FORECAST_RUN_CONFIG_REQUIRED"
      );
    }

    const modelChecksum =
      calculateObjectChecksum(
        modelDefinition
      );

    const protocolChecksum =
      calculateObjectChecksum(
        protocolDefinition
      );

    const runKey =
      buildForecastRunKey({
        datasetId:
          dataset.id,

        datasetChecksum:
          dataset.checksum,

        sourceAnalysisRunId,

        modelId:
          modelDefinition.id,

        modelVersion:
          modelDefinition.version,

        modelChecksum,

        protocolId:
          protocolDefinition.id,

        protocolVersion:
          protocolDefinition.version,

        protocolChecksum,

        target,

        modelTimeframe,

        issuedAt,

        inputCutoffAt,

        horizons,
      });

    const existing =
      await findForecastRunByKey(
        runKey,
        options
      );

    if (existing) {
      assertExistingRunMatches({
        existing,

        horizons,

        runConfig,
      });

      return {
        created:
          false,

        engineVersion:
          ENGINE_VERSION,

        modelChecksum,

        protocolChecksum,

        forecastRun:
          existing,
      };
    }

    const forecastRun =
      await createForecastRun(
        {
          runKey,

          datasetId:
            dataset.id,

          sourceAnalysisRunId,

          datasetChecksum:
            dataset.checksum,

          modelId:
            modelDefinition.id,

          modelVersion:
            modelDefinition.version,

          modelChecksum,

          protocolId:
            protocolDefinition.id,

          protocolVersion:
            protocolDefinition.version,

          protocolChecksum,

          target,

          modelTimeframe,

          issuedAt:
            new Date(
              issuedAt
            ),

          inputCutoffAt:
            new Date(
              inputCutoffAt
            ),

          horizons,

          runConfig,
        },
        options
      );

    return {
      created:
        true,

      engineVersion:
        ENGINE_VERSION,

      modelChecksum,

      protocolChecksum,

      forecastRun,
    };
  };

module.exports = {
  ENGINE_VERSION,
  buildForecastRunKey,
  issueForecastRun,
};