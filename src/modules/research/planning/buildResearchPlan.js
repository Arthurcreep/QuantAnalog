const {
  auditResearchUniverseAvailability,
} = require(
  "../availability/auditResearchUniverseAvailability"
);

const {
  getHypothesisExecution,
} = require(
  "../registry/hypothesisExecutionRegistry"
);

const PLAN_STATUS = {
  RUNNABLE:
    "RUNNABLE",

  NEED_ACQUISITION:
    "NEED_ACQUISITION",

  NOT_IMPLEMENTED:
    "NOT_IMPLEMENTED",

  NEED_ACQUISITION_AND_IMPLEMENTATION:
    "NEED_ACQUISITION_AND_IMPLEMENTATION",

  UNAVAILABLE:
    "UNAVAILABLE",
};

const MULTIPLE_TESTING_FAMILY_SOURCE = {
  EXPLICIT:
    "EXPLICIT",

  RESEARCH_FAMILY_FALLBACK:
    "RESEARCH_FAMILY_FALLBACK",
};

const resolvePlanStatus = ({
  dataStatus,
  executionStatus,
}) => {
  if (
    dataStatus ===
    "UNAVAILABLE"
  ) {
    return PLAN_STATUS
      .UNAVAILABLE;
  }

  const implemented =
    executionStatus ===
    "IMPLEMENTED";

  const needsAcquisition =
    dataStatus ===
    "NEED_ACQUISITION";

  if (
    implemented &&
    !needsAcquisition
  ) {
    return PLAN_STATUS
      .RUNNABLE;
  }

  if (
    implemented &&
    needsAcquisition
  ) {
    return PLAN_STATUS
      .NEED_ACQUISITION;
  }

  if (
    !implemented &&
    needsAcquisition
  ) {
    return PLAN_STATUS
      .NEED_ACQUISITION_AND_IMPLEMENTATION;
  }

  return PLAN_STATUS
    .NOT_IMPLEMENTED;
};

const isNonEmptyString = (
  value
) =>
  typeof value ===
    "string" &&
  value.trim().length >
    0;

const resolveMultipleTestingFamily = (
  hypothesis
) => {
  if (
    isNonEmptyString(
      hypothesis
        .multipleTestingFamily
    )
  ) {
    return {
      id:
        hypothesis
          .multipleTestingFamily,

      source:
        MULTIPLE_TESTING_FAMILY_SOURCE
          .EXPLICIT,
    };
  }

  if (
    isNonEmptyString(
      hypothesis.family
    )
  ) {
    return {
      id:
        hypothesis.family,

      source:
        MULTIPLE_TESTING_FAMILY_SOURCE
          .RESEARCH_FAMILY_FALLBACK,
    };
  }

  throw new Error(
    `MULTIPLE_TESTING_FAMILY_NOT_DEFINED:${hypothesis.id}`
  );
};

const buildResearchPlan = ({
  hypotheses,
  availableData = [],
  acquirableData = [],
}) => {
  const availability =
    auditResearchUniverseAvailability({
      hypotheses,
      availableData,
      acquirableData,
    });

  const hypothesisMap =
    new Map(
      hypotheses.map(
        (hypothesis) => [
          hypothesis.id,
          hypothesis,
        ]
      )
    );

  const items =
    availability.results.map(
      (dataAudit) => {
        const hypothesis =
          hypothesisMap.get(
            dataAudit.hypothesisId
          );

        if (!hypothesis) {
          throw new Error(
            `HYPOTHESIS_NOT_FOUND:${dataAudit.hypothesisId}`
          );
        }

        const execution =
          getHypothesisExecution(
            dataAudit.hypothesisId
          );

        const executionStatus =
          execution?.status ||
          "UNREGISTERED";

        const planStatus =
          resolvePlanStatus({
            dataStatus:
              dataAudit.status,

            executionStatus,
          });

        const multipleTestingFamily =
          resolveMultipleTestingFamily(
            hypothesis
          );

        return {
          hypothesisId:
            hypothesis.id,

          family:
            hypothesis.family,

          multipleTestingFamily:
            multipleTestingFamily.id,

          multipleTestingFamilySource:
            multipleTestingFamily.source,

          title:
            hypothesis.title,

          hypothesisStatus:
            hypothesis.status,

          planStatus,

          dataStatus:
            dataAudit.status,

          executionStatus,

          missingData:
            dataAudit.missingData,

          acquirableMissingData:
            dataAudit
              .acquirableMissingData,

          unavailableData:
            dataAudit
              .unavailableData,

          execution:
            execution
              ? {
                  status:
                    execution.status,

                  executor:
                    execution.executor ||
                    null,

                  protocol:
                    execution.protocol ||
                    null,

                  reason:
                    execution.reason ||
                    null,
                }
              : {
                  status:
                    "UNREGISTERED",

                  executor:
                    null,

                  protocol:
                    null,

                  reason:
                    "No execution registry entry",
                },
        };
      }
    );

  const summary =
    items.reduce(
      (
        accumulator,
        item
      ) => {
        accumulator.total +=
          1;

        accumulator[
          item.planStatus
        ] +=
          1;

        return accumulator;
      },
      {
        total:
          0,

        RUNNABLE:
          0,

        NEED_ACQUISITION:
          0,

        NOT_IMPLEMENTED:
          0,

        NEED_ACQUISITION_AND_IMPLEMENTATION:
          0,

        UNAVAILABLE:
          0,
      }
    );

  /*
   * Список всех данных,
   * которых не хватает Research Universe,
   * независимо от того, реализован ли
   * конкретный executor прямо сейчас.
   */
  const acquisitionCapabilities =
    [
      ...new Set(
        items.flatMap(
          (item) =>
            item
              .acquirableMissingData
        )
      ),
    ];

  const runnable =
    items.filter(
      (item) =>
        item.planStatus ===
        PLAN_STATUS.RUNNABLE
    );

  const acquisitionRequired =
    items.filter(
      (item) =>
        item
          .acquirableMissingData
          .length >
        0
    );

  const implementationRequired =
    items.filter(
      (item) =>
        item.executionStatus !==
        "IMPLEMENTED"
    );

  return {
    summary,

    acquisitionCapabilities,

    runnable,

    acquisitionRequired,

    implementationRequired,

    items,
  };
};

module.exports = {
  PLAN_STATUS,
  MULTIPLE_TESTING_FAMILY_SOURCE,
  buildResearchPlan,
};