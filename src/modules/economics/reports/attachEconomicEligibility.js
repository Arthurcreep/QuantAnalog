const {
  evaluateEconomicEligibility,
} = require(
  "../eligibility/evaluateEconomicEligibility"
);

const ECONOMIC_ELIGIBILITY_ENGINE_VERSION =
  "economic-eligibility-v1.0";

const countStatuses = (
  results
) => {
  const counts = {};

  for (
    const result of
    results
  ) {
    counts[result.status] =
      (
        counts[
          result.status
        ] ||
        0
      ) +
      1;
  }

  return counts;
};

const attachEconomicEligibility = ({
  report,
}) => {
  if (
    !report ||
    typeof report !==
      "object"
  ) {
    throw new Error(
      "INVALID_RESEARCH_REPORT"
    );
  }

  if (
    !Array.isArray(
      report.hypotheses
    )
  ) {
    throw new Error(
      "RESEARCH_REPORT_HYPOTHESES_REQUIRED"
    );
  }

  const eligibilityResults =
    [];

  const hypotheses =
    report
      .hypotheses
      .map(
        (hypothesis) => {
          const eligibility =
            evaluateEconomicEligibility(
              hypothesis
            );

          eligibilityResults.push(
            eligibility
          );

          return {
            ...hypothesis,

            economics: {
              eligibility,

              evaluation:
                null,
            },
          };
        }
      );

  const eligibleHypotheses =
    eligibilityResults.filter(
      (item) =>
        item.status ===
        "ELIGIBLE"
    );

  return {
    ...report,

    hypotheses,

    economics: {
      eligibilityEngineVersion:
        ECONOMIC_ELIGIBILITY_ENGINE_VERSION,

      status:
        "ELIGIBILITY_EVALUATED",

      evaluatedHypotheses:
        eligibilityResults
          .length,

      eligibleHypotheses:
        eligibleHypotheses
          .length,

      statusCounts:
        countStatuses(
          eligibilityResults
        ),
    },
  };
};

module.exports = {
  ECONOMIC_ELIGIBILITY_ENGINE_VERSION,
  attachEconomicEligibility,
};