const {
  runVolatilityStructureResearch,
} = require(
  "../services/runVolatilityStructureResearch.service"
);

const {
  runCategoricalFactorResearch,
} = require(
  "../services/runCategoricalFactorResearch.service"
);

const {
  getResearchProtocol,
} = require(
  "../registry/researchProtocolRegistry"
);

const compactRunResult = ({
  result,
  dataset,
}) => ({
  datasetId:
    dataset.id,

  timeframe:
    dataset.sourceTimeframe,

  analysisRunId:
    result.analysisRunId,

  engineVersion:
    result.engineVersion,

  protocolId:
    result.protocolId ||
    null,

  protocolVersion:
    result.protocolVersion ||
    null,

  protocolChecksum:
    result.protocolChecksum ||
    null,
});

const executeVolatilityStructure =
  async ({
    binding,
  }) => {
    const runs = [];

    for (
      const dataset of
      binding.datasets
    ) {
      const result =
        await runVolatilityStructureResearch({
          datasetId:
            dataset.id,
        });

      runs.push(
        compactRunResult({
          result,
          dataset,
        })
      );
    }

    return runs;
  };

const executeCategoricalFactor =
  async ({
    binding,
  }) => {
    if (
      binding.datasets.length !==
      1
    ) {
      throw new Error(
        "CATEGORICAL_FACTOR_REQUIRES_SINGLE_DATASET"
      );
    }

    const protocol =
      getResearchProtocol(
        binding.protocol
      );

    if (!protocol) {
      throw new Error(
        `RESEARCH_PROTOCOL_NOT_FOUND:${binding.protocol}`
      );
    }

    const dataset =
      binding.datasets[0];

    const result =
      await runCategoricalFactorResearch({
        datasetId:
          dataset.id,

        protocol,
      });

    return [
      compactRunResult({
        result,
        dataset,
      }),
    ];
  };

const executeResearchBinding =
  async ({
    binding,
  }) => {
    if (
      !binding ||
      binding.bindingStatus !==
        "BOUND"
    ) {
      throw new Error(
        "RESEARCH_BINDING_NOT_EXECUTABLE"
      );
    }

    let runs;

    if (
      binding.executor ===
      "VOLATILITY_STRUCTURE_RESEARCH"
    ) {
      runs =
        await executeVolatilityStructure({
          binding,
        });
    } else if (
      binding.executor ===
      "CATEGORICAL_FACTOR_RESEARCH"
    ) {
      runs =
        await executeCategoricalFactor({
          binding,
        });
    } else {
      throw new Error(
        `UNSUPPORTED_RESEARCH_EXECUTOR:${binding.executor}`
      );
    }

    return {
      hypothesisId:
        binding.hypothesisId,

      family:
        binding.family,

      executor:
        binding.executor,

      protocol:
        binding.protocol,

      status:
        "COMPLETED",

      runs,
    };
  };

module.exports = {
  executeResearchBinding,
};