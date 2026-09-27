const {
  findDatasetById,
  findDatasetsByInstrumentContext,
} = require(
  "../../datasets/repositories/dataset.repository"
);

const {
  DATASET_STAGES,
  QUALITY_STATUSES,
} = require(
  "../../datasets/dataset.constants"
);

const {
  timeframeToMilliseconds,
} = require(
  "../../datasets/calculations/timeframeToMilliseconds"
);

const {
  createAppError,
} = require(
  "../../../errors/appError"
);

const ENGINE_VERSION =
  "forecast-actual-dataset-resolver-v1.0";

const ALLOWED_QUALITY_STATUSES = [
  QUALITY_STATUSES.PASS,
  QUALITY_STATUSES
    .ACCEPTABLE_WITH_WARNINGS,
];

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
      `INVALID_ACTUAL_DATASET_${field}`
    );
  }

  return timestamp;
};

const resolveActualDataset =
  async ({
    forecast,
  }, options = {}) => {
    if (!forecast) {
      throw new Error(
        "FORECAST_REQUIRED_FOR_ACTUAL_DATASET_RESOLUTION"
      );
    }

    const sourceDataset =
      await findDatasetById(
        forecast.datasetId,
        options
      );

    if (!sourceDataset) {
      throw createAppError({
        statusCode:
          404,

        code:
          "FORECAST_SOURCE_DATASET_NOT_FOUND",

        message:
          `Dataset ${forecast.datasetId} not found`,
      });
    }

    if (
      sourceDataset.checksum !==
      forecast.datasetChecksum
    ) {
      throw new Error(
        "FORECAST_SOURCE_DATASET_CHECKSUM_MISMATCH"
      );
    }

    const timeframeMs =
      timeframeToMilliseconds(
        forecast.modelTimeframe
      );

    if (
      !Number.isFinite(
        timeframeMs
      ) ||
      timeframeMs <= 0
    ) {
      throw new Error(
        "UNSUPPORTED_ACTUAL_DATASET_TIMEFRAME"
      );
    }

    const targetStartMs =
      parseTimestamp({
        value:
          forecast
            .targetWindowStartAt,

        field:
          "TARGET_START",
      });

    const targetEndMs =
      parseTimestamp({
        value:
          forecast
            .targetWindowEndAt,

        field:
          "TARGET_END",
      });

    if (
      targetEndMs <=
      targetStartMs
    ) {
      throw new Error(
        "INVALID_ACTUAL_DATASET_TARGET_WINDOW"
      );
    }

    /*
     * Candle timestamp = bucket start.
     *
     * To construct the first return at
     * targetWindowStartAt, we need the
     * previous candle too.
     */
    const requiredStartMs =
      targetStartMs -
      timeframeMs;

    /*
     * Exclusive target end.
     *
     * Last required return:
     * targetEnd - timeframe.
     */
    const requiredEndMs =
      targetEndMs -
      timeframeMs;

    const candidates =
      await findDatasetsByInstrumentContext(
        {
          venue:
            sourceDataset.venue,

          instrument:
            sourceDataset.instrument,

          marketType:
            sourceDataset.marketType,

          datasetType:
            sourceDataset.datasetType,

          stages: [
            DATASET_STAGES.PREPARED,
          ],

          qualityStatuses:
            ALLOWED_QUALITY_STATUSES,
        },
        options
      );

    const compatible =
      candidates.filter(
        (candidate) => {
          if (
            candidate
              .sourceTimeframe !==
            forecast.modelTimeframe
          ) {
            return false;
          }

          if (
            candidate.timezone !==
            sourceDataset.timezone
          ) {
            return false;
          }

          if (
            !candidate.startTime ||
            !candidate.endTime
          ) {
            return false;
          }

          const candidateStartMs =
            new Date(
              candidate.startTime
            ).getTime();

          const candidateEndMs =
            new Date(
              candidate.endTime
            ).getTime();

          if (
            !Number.isFinite(
              candidateStartMs
            ) ||
            !Number.isFinite(
              candidateEndMs
            )
          ) {
            return false;
          }

          return (
            candidateStartMs <=
              requiredStartMs &&
            candidateEndMs >=
              requiredEndMs
          );
        }
      );

    const actualDataset =
      compatible[0] ||
      null;

    return {
      engineVersion:
        ENGINE_VERSION,

      resolved:
        Boolean(
          actualDataset
        ),

      sourceDataset,

      actualDataset,

      coverage: {
        requiredStartAt:
          new Date(
            requiredStartMs
          ).toISOString(),

        requiredEndAt:
          new Date(
            requiredEndMs
          ).toISOString(),

        targetWindowStartAt:
          new Date(
            targetStartMs
          ).toISOString(),

        targetWindowEndAt:
          new Date(
            targetEndMs
          ).toISOString(),
      },

      candidateCount:
        candidates.length,

      compatibleCandidateCount:
        compatible.length,
    };
  };

module.exports = {
  ENGINE_VERSION,
  resolveActualDataset,
};