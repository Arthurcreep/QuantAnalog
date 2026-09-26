const {
  SYSTEM_HYPOTHESES,
} = require(
  "../registry/hypothesisRegistry"
);

const {
  resolveInstrumentCapabilities,
} = require(
  "../availability/resolveInstrumentCapabilities"
);

const {
  resolveSourceAcquirableCapabilities,
} = require(
  "../availability/sourceAcquisitionRegistry"
);

const {
  buildResearchPlan,
} = require(
  "./buildResearchPlan"
);

const planInstrumentResearch =
  async ({
    venue,
    instrument,
    marketType,
    hypotheses =
      SYSTEM_HYPOTHESES,
  }) => {
    if (
      !venue ||
      !instrument ||
      !marketType
    ) {
      throw new Error(
        "INVALID_RESEARCH_INSTRUMENT_CONTEXT"
      );
    }

    if (
      !Array.isArray(
        hypotheses
      )
    ) {
      throw new Error(
        "INVALID_RESEARCH_HYPOTHESES"
      );
    }

    const capabilities =
      await resolveInstrumentCapabilities({
        venue,
        instrument,
        marketType,
      });

    const acquirableData =
      resolveSourceAcquirableCapabilities({
        venue,
        marketType,
      });

    const plan =
      buildResearchPlan({
        hypotheses,

        availableData:
          capabilities.available,

        acquirableData,
      });

    return {
      instrumentContext: {
        venue,
        instrument,
        marketType,
      },

      capabilities,

      acquirableData,

      plan,
    };
  };

module.exports = {
  planInstrumentResearch,
};