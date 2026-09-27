const {
  findDatasetById,
} = require(
  "../../datasets/repositories/dataset.repository"
);

const {
  createForecast,
  findForecastByKey,
} = require(
  "../forecasts/forecast.repository"
);

const {
  validateForecastIssue,
} = require(
  "../validation/validateForecastIssue"
);

const {
  createAppError,
} = require(
  "../../../errors/appError"
);

const {
  calculateObjectChecksum,
} = require(
  "../../../shared/hash/calculateObjectChecksum"
);

const ENGINE_VERSION =
  "forecast-issuance-v1.2";

const toIso = (
  value
) =>
  new Date(
    value
  ).toISOString();

const normalizeSourceAnalysisRunId = (
  value
) =>
  value ??
  null;

/*
 * Forecast identity used before
 * lineage/config-aware issuance.
 *
 * Keep this only for compatibility
 * with already persisted Forecasts.
 */
const buildLegacyForecastKey = ({
  datasetId,
  datasetChecksum,
  modelId,
  modelVersion,
  modelChecksum,
  target,
  modelTimeframe,
  horizon,
  issuedAt,
  inputCutoffAt,
  targetWindowStartAt,
  targetWindowEndAt,
}) =>
  calculateObjectChecksum({
    datasetId,

    datasetChecksum,

    modelId,

    modelVersion,

    modelChecksum,

    target,

    modelTimeframe,

    horizon,

    issuedAt:
      toIso(
        issuedAt
      ),

    inputCutoffAt:
      toIso(
        inputCutoffAt
      ),

    targetWindowStartAt:
      toIso(
        targetWindowStartAt
      ),

    targetWindowEndAt:
      toIso(
        targetWindowEndAt
      ),
  });

/*
 * Current Forecast identity.
 *
 * sourceAnalysisRunId:
 *   separates lineage.
 *
 * modelConfigChecksum:
 *   separates frozen protocol/config
 *   variants of the same model.
 *
 * prediction is deliberately NOT
 * part of identity because it is the
 * deterministic output that we want
 * to verify for conflicts.
 */
const buildForecastKey = ({
  datasetId,
  datasetChecksum,
  sourceAnalysisRunId =
    null,
  modelId,
  modelVersion,
  modelChecksum,
  modelConfigChecksum,
  target,
  modelTimeframe,
  horizon,
  issuedAt,
  inputCutoffAt,
  targetWindowStartAt,
  targetWindowEndAt,
}) =>
  calculateObjectChecksum({
    datasetId,

    datasetChecksum,

    sourceAnalysisRunId:
      normalizeSourceAnalysisRunId(
        sourceAnalysisRunId
      ),

    modelId,

    modelVersion,

    modelChecksum,

    modelConfigChecksum,

    target,

    modelTimeframe,

    horizon,

    issuedAt:
      toIso(
        issuedAt
      ),

    inputCutoffAt:
      toIso(
        inputCutoffAt
      ),

    targetWindowStartAt:
      toIso(
        targetWindowStartAt
      ),

    targetWindowEndAt:
      toIso(
        targetWindowEndAt
      ),
  });

const hasSameLineage = ({
  existing,
  sourceAnalysisRunId,
}) =>
  normalizeSourceAnalysisRunId(
    existing
      .sourceAnalysisRunId
  ) ===
  normalizeSourceAnalysisRunId(
    sourceAnalysisRunId
  );

const hasSameModelConfig = ({
  existing,
  modelConfigChecksum,
}) =>
  calculateObjectChecksum(
    existing.modelConfig
  ) ===
  modelConfigChecksum;

const assertPredictionMatches = ({
  existing,
  prediction,
}) => {
  const existingPredictionChecksum =
    calculateObjectChecksum(
      existing.prediction
    );

  const requestedPredictionChecksum =
    calculateObjectChecksum(
      prediction
    );

  if (
    existingPredictionChecksum !==
    requestedPredictionChecksum
  ) {
    throw new Error(
      "FORECAST_KEY_PREDICTION_CONFLICT"
    );
  }
};

const assertCurrentForecastMatches = ({
  existing,
  sourceAnalysisRunId,
  modelConfigChecksum,
  prediction,
}) => {
  if (
    !hasSameLineage({
      existing,

      sourceAnalysisRunId,
    })
  ) {
    throw new Error(
      "FORECAST_KEY_SOURCE_ANALYSIS_RUN_CONFLICT"
    );
  }

  if (
    !hasSameModelConfig({
      existing,

      modelConfigChecksum,
    })
  ) {
    throw new Error(
      "FORECAST_KEY_MODEL_CONFIG_CONFLICT"
    );
  }

  assertPredictionMatches({
    existing,

    prediction,
  });
};

const issueForecast =
  async ({
    datasetId,
    sourceAnalysisRunId = null,
    modelId,
    modelVersion,
    modelDefinition,
    modelConfig,
    target,
    modelTimeframe,
    horizon,
    issuedAt,
    inputCutoffAt,
    targetWindowStartAt,
    targetWindowEndAt,
    prediction,
  }, options = {}) => {
    const dataset =
      await findDatasetById(
        datasetId,
        options
      );

    if (!dataset) {
      throw createAppError({
        statusCode:
          404,

        code:
          "FORECAST_DATASET_NOT_FOUND",

        message:
          `Dataset ${datasetId} not found`,
      });
    }

    validateForecastIssue({
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
    });

    if (
      !modelDefinition ||
      typeof modelDefinition !==
        "object" ||
      Array.isArray(
        modelDefinition
      )
    ) {
      throw new Error(
        "FORECAST_MODEL_DEFINITION_REQUIRED"
      );
    }

    const normalizedSourceAnalysisRunId =
      normalizeSourceAnalysisRunId(
        sourceAnalysisRunId
      );

    const modelChecksum =
      calculateObjectChecksum(
        modelDefinition
      );

    const modelConfigChecksum =
      calculateObjectChecksum(
        modelConfig
      );

    /*
     * Current identity:
     *
     * dataset
     * + lineage
     * + model
     * + model config / protocol
     * + issue/target window
     */
    const forecastKey =
      buildForecastKey({
        datasetId:
          dataset.id,

        datasetChecksum:
          dataset.checksum,

        sourceAnalysisRunId:
          normalizedSourceAnalysisRunId,

        modelId,

        modelVersion,

        modelChecksum,

        modelConfigChecksum,

        target,

        modelTimeframe,

        horizon,

        issuedAt,

        inputCutoffAt,

        targetWindowStartAt,

        targetWindowEndAt,
      });

    const existing =
      await findForecastByKey(
        forecastKey,
        options
      );

    if (existing) {
      assertCurrentForecastMatches({
        existing,

        sourceAnalysisRunId:
          normalizedSourceAnalysisRunId,

        modelConfigChecksum,

        prediction,
      });

      return {
        created:
          false,

        engineVersion:
          ENGINE_VERSION,

        identityMode:
          "CURRENT",

        forecast:
          existing,
      };
    }

    /*
     * Try old v1.0 identity.
     *
     * Reuse it ONLY when:
     *
     * - lineage is identical;
     * - modelConfig is identical;
     * - prediction is identical.
     *
     * If lineage or config differs,
     * it represents a distinct immutable
     * Forecast under the new identity
     * and we create it below.
     */
    const legacyForecastKey =
      buildLegacyForecastKey({
        datasetId:
          dataset.id,

        datasetChecksum:
          dataset.checksum,

        modelId,

        modelVersion,

        modelChecksum,

        target,

        modelTimeframe,

        horizon,

        issuedAt,

        inputCutoffAt,

        targetWindowStartAt,

        targetWindowEndAt,
      });

    const legacyForecast =
      await findForecastByKey(
        legacyForecastKey,
        options
      );

    if (legacyForecast) {
      const sameLineage =
        hasSameLineage({
          existing:
            legacyForecast,

          sourceAnalysisRunId:
            normalizedSourceAnalysisRunId,
        });

      const sameModelConfig =
        hasSameModelConfig({
          existing:
            legacyForecast,

          modelConfigChecksum,
        });

      if (
        sameLineage &&
        sameModelConfig
      ) {
        assertPredictionMatches({
          existing:
            legacyForecast,

          prediction,
        });

        return {
          created:
            false,

          engineVersion:
            ENGINE_VERSION,

          identityMode:
            "LEGACY_COMPATIBLE",

          forecast:
            legacyForecast,
        };
      }
    }

    const forecast =
      await createForecast(
        {
          datasetId:
            dataset.id,

          sourceAnalysisRunId:
            normalizedSourceAnalysisRunId,

          forecastKey,

          modelId,

          modelVersion,

          modelChecksum,

          datasetChecksum:
            dataset.checksum,

          target,

          modelTimeframe,

          horizon,

          issuedAt:
            new Date(
              issuedAt
            ),

          inputCutoffAt:
            new Date(
              inputCutoffAt
            ),

          targetWindowStartAt:
            new Date(
              targetWindowStartAt
            ),

          targetWindowEndAt:
            new Date(
              targetWindowEndAt
            ),

          modelConfig,

          prediction,
        },
        options
      );

    let identityMode =
      "CURRENT";

    if (legacyForecast) {
      const sameLineage =
        hasSameLineage({
          existing:
            legacyForecast,

          sourceAnalysisRunId:
            normalizedSourceAnalysisRunId,
        });

      const sameModelConfig =
        hasSameModelConfig({
          existing:
            legacyForecast,

          modelConfigChecksum,
        });

      if (
        !sameLineage &&
        !sameModelConfig
      ) {
        identityMode =
          "LINEAGE_AND_CONFIG_SPLIT";
      } else if (
        !sameLineage
      ) {
        identityMode =
          "LINEAGE_SPLIT";
      } else {
        identityMode =
          "CONFIG_SPLIT";
      }
    }

    return {
      created:
        true,

      engineVersion:
        ENGINE_VERSION,

      identityMode,

      forecast,
    };
  };

module.exports = {
  ENGINE_VERSION,
  buildForecastKey,
  buildLegacyForecastKey,
  issueForecast,
};