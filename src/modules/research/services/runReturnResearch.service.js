const { validateSeriesContinuity } = require("../series/validateSeriesContinuity");
const { timeframeToMilliseconds } = require("../../datasets/calculations/timeframeToMilliseconds");

const {
  findDatasetById,
} = require(
  "../../datasets/repositories/dataset.repository"
);

const {
  buildLogReturnSeries,
} = require(
  "../series/buildLogReturnSeries"
);

const {
  calculateDescriptiveStats,
} = require(
  "../calculations/calculateDescriptiveStats"
);

const {
  calculateHigherMoments,
} = require(
  "../calculations/calculateHigherMoments"
);

const {
  calculateQuantiles,
} = require(
  "../calculations/calculateQuantiles"
);

const {
  calculateAcf,
} = require(
  "../calculations/calculateAcf"
);

const {
  calculateRealizedVolatility,
} = require(
  "../calculations/calculateRealizedVolatility"
);

const {
  createAnalysisRun,
} = require(
  "../runs/analysisRun.repository"
);

const {
  createAppError,
} = require(
  "../../../errors/appError"
);

const RESEARCH_ENGINE_VERSION =
  "research-v1.1";

const DEFAULT_QUANTILES = [
  0.01,
  0.05,
  0.25,
  0.5,
  0.75,
  0.95,
  0.99,
];

const validateDataset = (
  dataset
) => {
  if (
    dataset.stage !==
    "PREPARED"
  ) {
    throw createAppError({
      statusCode: 400,
      code:
        "INVALID_RESEARCH_DATASET_STAGE",
      message:
        "Research requires a PREPARED dataset",
    });
  }

  if (
    ![
      "PASS",
      "ACCEPTABLE_WITH_WARNINGS",
    ].includes(
      dataset.qualityStatus
    )
  ) {
    throw createAppError({
      statusCode: 400,
      code:
        "RESEARCH_DATASET_BLOCKED",
      message:
        "Dataset must pass quality validation before research",
    });
  }
};

const runReturnResearch = async ({
  datasetId,
  incompletePolicy,
  maxLag = 40,
  quantiles =
    DEFAULT_QUANTILES,
}) => {
  const dataset =
    await findDatasetById(
      datasetId
    );

  if (!dataset) {
    throw createAppError({
      statusCode: 404,
      code:
        "DATASET_NOT_FOUND",
      message:
        `Dataset ${datasetId} not found`,
    });
  }

  validateDataset(dataset);

  const returns =
    await buildLogReturnSeries({
      filePath:
        dataset.storageUri,

      timeframe:
        dataset.sourceTimeframe,

      incompletePolicy,
    });

  validateSeriesContinuity({ series: returns.series, expectedIntervalMs: timeframeToMilliseconds(dataset.sourceTimeframe) });

  const values =
    returns.series.map(
      (item) =>
        item.logReturn
    );

  if (values.length < 2) {
    throw createAppError({
      statusCode: 400,
      code:
        "INSUFFICIENT_RETURN_SAMPLE",
      message:
        "Research requires at least two valid returns",
    });
  }

  const metrics = {
    sample: {
      inputRowCount:
        returns.inputRowCount,

      usedRowCount:
        returns.usedRowCount,

      returnCount:
        returns.returnCount,

      skippedIncompleteCount:
        returns
          .skippedIncompleteCount,

      skippedGapReturnCount:
        returns
          .skippedGapReturnCount,
    },

    descriptive:
      calculateDescriptiveStats(
        values
      ),

    moments:
      calculateHigherMoments(
        values
      ),

    quantiles:
      calculateQuantiles(
        values,
        quantiles
      ),

    acf:
      calculateAcf(
        values,
        maxLag
      ),

    realizedVolatility:
      calculateRealizedVolatility(
        values
      ),
  };

  const run =
    await createAnalysisRun({
      datasetId:
        dataset.id,

      runType:
        "RETURN_PROFILE",

      engineVersion:
        RESEARCH_ENGINE_VERSION,

      config: {
        timeframe:
          dataset.sourceTimeframe,

        incompletePolicy,
        maxLag,
        quantiles,
        gapPolicy: "REQUIRE_CONTIGUOUS",
      },

      metrics,
    });

  return {
    analysisRunId:
      run.id,

    datasetId:
      dataset.id,

    engineVersion:
      RESEARCH_ENGINE_VERSION,

    metrics,
  };
};

module.exports = {
  runReturnResearch,
};