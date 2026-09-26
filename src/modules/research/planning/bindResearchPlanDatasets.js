const {
  getHypothesisExecution,
} = require(
  "../registry/hypothesisExecutionRegistry"
);

const BINDING_STATUS = {
  BOUND:
    "BOUND",

  MISSING_DATASET:
    "MISSING_DATASET",

  INVALID_BINDING:
    "INVALID_BINDING",
};

const normalizeBoundDataset = (
  dataset
) => ({
  id:
    dataset.id,

  name:
    dataset.name,

  datasetType:
    dataset.datasetType,

  stage:
    dataset.stage,

  sourceTimeframe:
    dataset.sourceTimeframe,

  version:
    dataset.version,

  qualityStatus:
    dataset.qualityStatus,

  startTime:
    dataset.startTime,

  endTime:
    dataset.endTime,

  rowCount:
    dataset.rowCount,

  checksum:
    dataset.checksum,

  storageUri:
    dataset.storageUri,
});

const bindSinglePreparedCandleDataset =
  ({
    capabilities,
    binding,
  }) => {
    const timeframe =
      binding.timeframe;

    if (!timeframe) {
      return {
        status:
          BINDING_STATUS
            .INVALID_BINDING,

        datasets: [],

        missingTimeframes:
          [],

        reason:
          "SINGLE binding requires timeframe",
      };
    }

    const dataset =
      capabilities
        .datasets
        ?.CANDLES
        ?.prepared
        ?.[timeframe];

    if (!dataset) {
      return {
        status:
          BINDING_STATUS
            .MISSING_DATASET,

        datasets: [],

        missingTimeframes: [
          timeframe,
        ],

        reason:
          `Prepared candle dataset ${timeframe} is missing`,
      };
    }

    return {
      status:
        BINDING_STATUS.BOUND,

      datasets: [
        normalizeBoundDataset(
          dataset
        ),
      ],

      missingTimeframes:
        [],

      reason:
        null,
    };
  };

const bindMultiplePreparedCandleDatasets =
  ({
    capabilities,
    binding,
  }) => {
    if (
      !Array.isArray(
        binding.timeframes
      ) ||
      binding.timeframes.length ===
        0
    ) {
      return {
        status:
          BINDING_STATUS
            .INVALID_BINDING,

        datasets: [],

        missingTimeframes:
          [],

        reason:
          "MULTIPLE binding requires timeframes",
      };
    }

    const prepared =
      capabilities
        .datasets
        ?.CANDLES
        ?.prepared || {};

    const datasets =
      [];

    const missingTimeframes =
      [];

    for (
      const timeframe of
      binding.timeframes
    ) {
      const dataset =
        prepared[
          timeframe
        ];

      if (!dataset) {
        missingTimeframes.push(
          timeframe
        );

        continue;
      }

      datasets.push(
        normalizeBoundDataset(
          dataset
        )
      );
    }

    if (
      missingTimeframes.length >
      0
    ) {
      return {
        status:
          BINDING_STATUS
            .MISSING_DATASET,

        datasets,

        missingTimeframes,

        reason:
          `Missing prepared candle datasets: ${missingTimeframes.join(", ")}`,
      };
    }

    return {
      status:
        BINDING_STATUS.BOUND,

      datasets,

      missingTimeframes:
        [],

      reason:
        null,
    };
  };

const bindExecutionDatasets =
  ({
    capabilities,
    binding,
  }) => {
    if (!binding) {
      return {
        status:
          BINDING_STATUS
            .INVALID_BINDING,

        datasets: [],

        missingTimeframes:
          [],

        reason:
          "Execution dataset binding is not defined",
      };
    }

    if (
      binding.capability !==
      "CANDLES"
    ) {
      return {
        status:
          BINDING_STATUS
            .INVALID_BINDING,

        datasets: [],

        missingTimeframes:
          [],

        reason:
          `Unsupported binding capability: ${binding.capability}`,
      };
    }

    if (
      binding.stage !==
      "PREPARED"
    ) {
      return {
        status:
          BINDING_STATUS
            .INVALID_BINDING,

        datasets: [],

        missingTimeframes:
          [],

        reason:
          `Unsupported candle binding stage: ${binding.stage}`,
      };
    }

    if (
      binding.cardinality ===
      "SINGLE"
    ) {
      return bindSinglePreparedCandleDataset({
        capabilities,
        binding,
      });
    }

    if (
      binding.cardinality ===
      "MULTIPLE"
    ) {
      return bindMultiplePreparedCandleDatasets({
        capabilities,
        binding,
      });
    }

    return {
      status:
        BINDING_STATUS
          .INVALID_BINDING,

      datasets: [],

      missingTimeframes:
        [],

      reason:
        `Unsupported binding cardinality: ${binding.cardinality}`,
    };
  };

const bindResearchPlanDatasets =
  ({
    plan,
    capabilities,
  }) => {
    if (
      !plan ||
      !Array.isArray(
        plan.runnable
      )
    ) {
      throw new Error(
        "INVALID_RESEARCH_PLAN_FOR_BINDING"
      );
    }

    if (!capabilities) {
      throw new Error(
        "INVALID_CAPABILITIES_FOR_BINDING"
      );
    }

    const items =
      plan.runnable.map(
        (planItem) => {
          const execution =
            getHypothesisExecution(
              planItem.hypothesisId
            );

          if (!execution) {
            return {
              hypothesisId:
                planItem.hypothesisId,

              executor:
                null,

              protocol:
                null,

              bindingStatus:
                BINDING_STATUS
                  .INVALID_BINDING,

              datasets: [],

              missingTimeframes:
                [],

              reason:
                "Execution registry entry not found",
            };
          }

          const bindingResult =
            bindExecutionDatasets({
              capabilities,

              binding:
                execution.datasetBinding,
            });

          return {
            hypothesisId:
              planItem.hypothesisId,

            family:
              planItem.family,

            executor:
              execution.executor,

            protocol:
              execution.protocol,

            datasetBinding:
              execution.datasetBinding,

            bindingStatus:
              bindingResult.status,

            datasets:
              bindingResult.datasets,

            missingTimeframes:
              bindingResult
                .missingTimeframes,

            reason:
              bindingResult.reason,
          };
        }
      );

    const summary =
      items.reduce(
        (
          accumulator,
          item
        ) => {
          accumulator.total += 1;

          accumulator[
            item.bindingStatus
          ] += 1;

          return accumulator;
        },
        {
          total: 0,

          BOUND: 0,

          MISSING_DATASET: 0,

          INVALID_BINDING: 0,
        }
      );

    return {
      summary,

      allBound:
        summary.BOUND ===
        summary.total,

      items,
    };
  };

module.exports = {
  BINDING_STATUS,
  bindResearchPlanDatasets,
};