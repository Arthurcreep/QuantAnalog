const {
  auditHypothesisDataAvailability,
} = require(
  "./auditHypothesisDataAvailability"
);

const auditResearchUniverseAvailability =
  ({
    hypotheses,
    availableData = [],
    acquirableData = [],
  }) => {
    if (
      !Array.isArray(
        hypotheses
      )
    ) {
      throw new Error(
        "INVALID_HYPOTHESIS_LIST"
      );
    }

    const results =
      hypotheses.map(
        (hypothesis) =>
          auditHypothesisDataAvailability({
            hypothesis,
            availableData,
            acquirableData,
          })
      );

    const summary =
      results.reduce(
        (
          accumulator,
          result
        ) => {
          accumulator.total += 1;

          accumulator[
            result.status
          ] += 1;

          return accumulator;
        },
        {
          total: 0,
          READY: 0,
          NEED_ACQUISITION: 0,
          UNAVAILABLE: 0,
        }
      );

    return {
      summary,
      results,
    };
  };

module.exports = {
  auditResearchUniverseAvailability,
};