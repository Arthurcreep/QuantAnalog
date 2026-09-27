const { validateSeriesContinuity } = require("../series/validateSeriesContinuity");
const { timeframeToMilliseconds } = require("../../datasets/calculations/timeframeToMilliseconds");

const crypto = require(
  "crypto"
);

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
  calculateVolatilityAcf,
} = require(
  "../calculations/calculateVolatilityAcf"
);

const {
  calculateLjungBox,
} = require(
  "../calculations/calculateLjungBox"
);

const {
  calculateArchLm,
} = require(
  "../calculations/calculateArchLm"
);

const {
  createAnalysisRun,
} = require(
  "../runs/analysisRun.repository"
);

const {
  VOLATILITY_STRUCTURE_V1,
} = require(
  "../protocols/volatilityStructureV1"
);

const {
  createAppError,
} = require(
  "../../../errors/appError"
);

const RESEARCH_ENGINE_VERSION =
  "research-v1.2";

const hashObject = (
  value
) =>
  crypto
    .createHash("sha256")
    .update(
      JSON.stringify(value)
    )
    .digest("hex");

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

const selectAcfLags = (
  acf,
  selectedLags
) =>
  acf.filter(
    (item) =>
      selectedLags.includes(
        item.lag
      )
  );

const calculateDiagnostics = ({
  series,
  protocol,
  expectedIntervalMs,
}) => {
  validateSeriesContinuity({ series, expectedIntervalMs });
  const values =
    series.map(
      (item) =>
        item.logReturn
    );

  if (
    values.length <=
    protocol.maxAcfLag
  ) {
    throw createAppError({
      statusCode: 400,
      code:
        "INSUFFICIENT_DIAGNOSTIC_SAMPLE",
      message:
        "Not enough returns for volatility diagnostics",
    });
  }

  const squaredReturns =
    values.map(
      (value) =>
        value ** 2
    );

  const acf =
    calculateVolatilityAcf({
      returns: values,
      maxLag:
        protocol.maxAcfLag,
    });

  return {
    sampleSize:
      values.length,

    acf: {
      returns:
        selectAcfLags(
          acf.returns,
          protocol
            .displayedAcfLags
        ),

      absoluteReturns:
        selectAcfLags(
          acf.absoluteReturns,
          protocol
            .displayedAcfLags
        ),

      squaredReturns:
        selectAcfLags(
          acf.squaredReturns,
          protocol
            .displayedAcfLags
        ),
    },

    ljungBoxReturns:
      protocol
        .diagnosticLags
        .map(
          (lags) =>
            calculateLjungBox({
              values,
              lags,
            })
        ),

    ljungBoxSquaredReturns:
      protocol
        .diagnosticLags
        .map(
          (lags) =>
            calculateLjungBox({
              values:
                squaredReturns,
              lags,
            })
        ),

    archLm:
      protocol
        .diagnosticLags
        .map(
          (lags) =>
            calculateArchLm({
              returns: values,
              lags,
            })
        ),
  };
};

const runVolatilityStructureResearch =
  async ({
    datasetId,
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

    validateDataset(
      dataset
    );

    const protocol =
      VOLATILITY_STRUCTURE_V1;

    const returns =
      await buildLogReturnSeries({
        filePath:
          dataset.storageUri,

        timeframe:
          dataset.sourceTimeframe,

        incompletePolicy:
          protocol
            .incompletePolicy,
      });

    const developmentEnd =
      new Date(
        protocol
          .development
          .end
      ).getTime();

    const validationStart =
      new Date(
        protocol
          .retrospectiveValidation
          .start
      ).getTime();

    const development =
      returns.series.filter(
        (item) =>
          new Date(
            item.timestamp
          ).getTime() <=
          developmentEnd
      );

    const retrospectiveValidation =
      returns.series.filter(
        (item) =>
          new Date(
            item.timestamp
          ).getTime() >=
          validationStart
      );

    const protocolChecksum =
      hashObject(
        protocol
      );

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

      development:
        calculateDiagnostics({
          series:
            development,
          protocol,
          expectedIntervalMs: timeframeToMilliseconds(dataset.sourceTimeframe),
        }),

      retrospectiveValidation:
        calculateDiagnostics({
          series:
            retrospectiveValidation,
          protocol,
          expectedIntervalMs: timeframeToMilliseconds(dataset.sourceTimeframe),
        }),

      forwardOos: {
        status:
          protocol
            .forwardOosStatus,
      },
    };

    const run =
      await createAnalysisRun({
        datasetId:
          dataset.id,

        runType:
          "VOLATILITY_STRUCTURE",

        engineVersion:
          RESEARCH_ENGINE_VERSION,

        config: {
          instrument:
            dataset.instrument,

          venue:
            dataset.venue,

          timeframe:
            dataset.sourceTimeframe,

          datasetChecksum:
            dataset.checksum,

          protocol,
          protocolChecksum,

          validationMode:
            "RETROSPECTIVE_HOLDOUT",
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

      protocolId:
        protocol.id,

      protocolVersion:
        protocol.version,

      protocolChecksum,

      metrics,
    };
  };

module.exports = {
  runVolatilityStructureResearch,
};