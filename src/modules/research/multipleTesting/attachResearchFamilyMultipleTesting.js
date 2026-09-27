const {
  applyBenjaminiHochberg,
} = require(
  "../calculations/applyBenjaminiHochberg"
);

const ENGINE_VERSION =
  "research-family-multiple-testing-v1.1";

const METHOD =
  "BENJAMINI_HOCHBERG";

const SCOPE =
  "EVALUATED_FACTOR_HORIZON_TESTS_WITHIN_SNAPSHOT_MULTIPLE_TESTING_FAMILY";

const FACTOR_EXECUTORS =
  new Set([
    "CATEGORICAL_FACTOR_RESEARCH",
    "CONTINUOUS_FACTOR_RESEARCH",
  ]);

const isValidPValue = (
  value
) =>
  typeof value ===
    "number" &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= 1;

const isNonEmptyString = (
  value
) =>
  typeof value ===
    "string" &&
  value.trim().length >
    0;

const buildTestKey = ({
  hypothesisId,
  analysisRunId,
  horizon,
  horizonBars,
  horizonIndex,
}) =>
  [
    hypothesisId,
    analysisRunId,
    horizon,
    horizonBars,
    horizonIndex,
  ].join(
    "::"
  );

const createFamilyState = (
  familyId
) => ({
  familyId,

  hypothesisIds:
    new Set(),

  definitionSources:
    new Set(),

  developmentTests:
    [],

  validationTests:
    [],
});

const collectFamilies = (
  report
) => {
  const families =
    new Map();

  for (
    const hypothesis of
    report.hypotheses
  ) {
    if (
      hypothesis
        .executionStatus !==
        "COMPLETED"
    ) {
      continue;
    }

    if (
      !FACTOR_EXECUTORS.has(
        hypothesis.executor
      )
    ) {
      continue;
    }

    const familyId =
      hypothesis
        .multipleTestingFamily;

    if (
      !isNonEmptyString(
        familyId
      )
    ) {
      continue;
    }

    if (
      !families.has(
        familyId
      )
    ) {
      families.set(
        familyId,
        createFamilyState(
          familyId
        )
      );
    }

    const family =
      families.get(
        familyId
      );

    family
      .hypothesisIds
      .add(
        hypothesis
          .hypothesisId
      );

    if (
      isNonEmptyString(
        hypothesis
          .multipleTestingFamilySource
      )
    ) {
      family
        .definitionSources
        .add(
          hypothesis
            .multipleTestingFamilySource
        );
    }

    for (
      const run of
      hypothesis.analysisRuns ||
      []
    ) {
      const horizons =
        run
          .metrics
          ?.horizons ||
        [];

      for (
        let horizonIndex = 0;
        horizonIndex <
        horizons.length;
        horizonIndex += 1
      ) {
        const item =
          horizons[
            horizonIndex
          ];

        const testKey =
          buildTestKey({
            hypothesisId:
              hypothesis
                .hypothesisId,

            analysisRunId:
              run
                .analysisRunId,

            horizon:
              item.horizon,

            horizonBars:
              item
                .horizonBars,

            horizonIndex,
          });

        const developmentPValue =
          item
            .evaluation
            ?.development
            ?.hac
            ?.pValue;

        const validationPValue =
          item
            .evaluation
            ?.retrospectiveValidation
            ?.hac
            ?.pValue;

        if (
          isValidPValue(
            developmentPValue
          )
        ) {
          family
            .developmentTests
            .push({
              testKey,

              pValue:
                developmentPValue,
            });
        }

        if (
          isValidPValue(
            validationPValue
          )
        ) {
          family
            .validationTests
            .push({
              testKey,

              pValue:
                validationPValue,
            });
        }
      }
    }
  }

  return families;
};

const buildAdjustedMap = (
  tests
) => {
  if (
    tests.length === 0
  ) {
    return new Map();
  }

  const adjusted =
    applyBenjaminiHochberg(
      tests
    );

  return new Map(
    adjusted.map(
      (item) => [
        item.testKey,
        item.adjustedPValue,
      ]
    )
  );
};

const finalizeFamilies = (
  families
) => {
  const result =
    new Map();

  for (
    const [
      familyId,
      family,
    ] of families
  ) {
    result.set(
      familyId,
      {
        familyId,

        hypothesisIds:
          [
            ...family
              .hypothesisIds,
          ].sort(),

        definitionSources:
          [
            ...family
              .definitionSources,
          ].sort(),

        developmentTestCount:
          family
            .developmentTests
            .length,

        validationTestCount:
          family
            .validationTests
            .length,

        developmentAdjusted:
          buildAdjustedMap(
            family
              .developmentTests
          ),

        validationAdjusted:
          buildAdjustedMap(
            family
              .validationTests
          ),
      }
    );
  }

  return result;
};

const attachToHypothesis = ({
  hypothesis,
  families,
}) => {
  const family =
    families.get(
      hypothesis
        .multipleTestingFamily
    );

  if (
    !family ||
    !FACTOR_EXECUTORS.has(
      hypothesis.executor
    )
  ) {
    return hypothesis;
  }

  const analysisRuns =
    (
      hypothesis.analysisRuns ||
      []
    ).map(
      (run) => {
        const horizons =
          (
            run
              .metrics
              ?.horizons ||
            []
          ).map(
            (
              item,
              horizonIndex
            ) => {
              const testKey =
                buildTestKey({
                  hypothesisId:
                    hypothesis
                      .hypothesisId,

                  analysisRunId:
                    run
                      .analysisRunId,

                  horizon:
                    item.horizon,

                  horizonBars:
                    item
                      .horizonBars,

                  horizonIndex,
                });

              return {
                ...item,

                familyMultipleTesting: {
                  engineVersion:
                    ENGINE_VERSION,

                  method:
                    METHOD,

                  scope:
                    SCOPE,

                  familyId:
                    family.familyId,

                  familyDefinitionSource:
                    hypothesis
                      .multipleTestingFamilySource,

                  hypothesisCount:
                    family
                      .hypothesisIds
                      .length,

                  developmentTestCount:
                    family
                      .developmentTestCount,

                  validationTestCount:
                    family
                      .validationTestCount,

                  developmentAdjustedPValue:
                    family
                      .developmentAdjusted
                      .get(
                        testKey
                      ) ??
                    null,

                  validationAdjustedPValue:
                    family
                      .validationAdjusted
                      .get(
                        testKey
                      ) ??
                    null,
                },
              };
            }
          );

        return {
          ...run,

          metrics: {
            ...run.metrics,

            horizons,
          },
        };
      }
    );

  return {
    ...hypothesis,

    analysisRuns,
  };
};

const attachResearchFamilyMultipleTesting =
  ({
    report,
  }) => {
    if (
      !report ||
      !Array.isArray(
        report.hypotheses
      )
    ) {
      throw new Error(
        "INVALID_RESEARCH_REPORT_FOR_FAMILY_MULTIPLE_TESTING"
      );
    }

    const collected =
      collectFamilies(
        report
      );

    const families =
      finalizeFamilies(
        collected
      );

    const hypotheses =
      report
        .hypotheses
        .map(
          (hypothesis) =>
            attachToHypothesis({
              hypothesis,
              families,
            })
        );

    const summary =
      [
        ...families.values(),
      ]
        .map(
          (family) => ({
            familyId:
              family.familyId,

            hypothesisIds:
              family
                .hypothesisIds,

            hypothesisCount:
              family
                .hypothesisIds
                .length,

            definitionSources:
              family
                .definitionSources,

            developmentTestCount:
              family
                .developmentTestCount,

            validationTestCount:
              family
                .validationTestCount,
          })
        )
        .sort(
          (a, b) =>
            a.familyId.localeCompare(
              b.familyId
            )
        );

    return {
      ...report,

      hypotheses,

      familyMultipleTesting: {
        engineVersion:
          ENGINE_VERSION,

        method:
          METHOD,

        scope:
          SCOPE,

        families:
          summary,
      },
    };
  };

module.exports = {
  attachResearchFamilyMultipleTesting,
};