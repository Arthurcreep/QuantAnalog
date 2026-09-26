const {
  hasResearchFamily,
} = require(
  "./researchFamilyRegistry"
);

const ALLOWED_SOURCES = [
  "SYSTEM",
  "USER",
];

const ALLOWED_MODES = [
  "EXPLORATORY",
  "CONFIRMATORY",
];

const ALLOWED_STATUSES = [
  "DRAFT",
  "REGISTERED",
  "TESTED",
  "STATISTICAL_CANDIDATE",
  "MULTIPLE_TESTING_ADJUSTED",
  "ROBUST_CANDIDATE",
  "FROZEN",
  "FORWARD_OOS",
  "REJECTED",
  "UNAVAILABLE",
];

const validateHypothesis = (
  hypothesis
) => {
  if (
    !hypothesis ||
    typeof hypothesis !==
      "object"
  ) {
    throw new Error(
      "INVALID_HYPOTHESIS"
    );
  }

  if (
    typeof hypothesis.id !==
      "string" ||
    hypothesis.id.length === 0
  ) {
    throw new Error(
      "INVALID_HYPOTHESIS_ID"
    );
  }

  if (
    typeof hypothesis.version !==
      "string" ||
    hypothesis.version.length ===
      0
  ) {
    throw new Error(
      `INVALID_HYPOTHESIS_VERSION: ${hypothesis.id}`
    );
  }

  if (
    !ALLOWED_SOURCES.includes(
      hypothesis.source
    )
  ) {
    throw new Error(
      `INVALID_HYPOTHESIS_SOURCE: ${hypothesis.id}`
    );
  }

  if (
    !ALLOWED_MODES.includes(
      hypothesis.mode
    )
  ) {
    throw new Error(
      `INVALID_HYPOTHESIS_MODE: ${hypothesis.id}`
    );
  }

  if (
    !hasResearchFamily(
      hypothesis.family
    )
  ) {
    throw new Error(
      `UNKNOWN_RESEARCH_FAMILY: ${hypothesis.id}`
    );
  }

  if (
    typeof hypothesis.title !==
      "string" ||
    hypothesis.title.length === 0
  ) {
    throw new Error(
      `INVALID_HYPOTHESIS_TITLE: ${hypothesis.id}`
    );
  }

  if (
    typeof hypothesis
      .hypothesis !== "string" ||
    hypothesis
      .hypothesis
      .length === 0
  ) {
    throw new Error(
      `INVALID_HYPOTHESIS_TEXT: ${hypothesis.id}`
    );
  }

  if (
    !Array.isArray(
      hypothesis.requiredData
    )
  ) {
    throw new Error(
      `INVALID_REQUIRED_DATA: ${hypothesis.id}`
    );
  }

  if (
    !Array.isArray(
      hypothesis.features
    )
  ) {
    throw new Error(
      `INVALID_FEATURE_LIST: ${hypothesis.id}`
    );
  }

  if (
    !Array.isArray(
      hypothesis.targets
    )
  ) {
    throw new Error(
      `INVALID_TARGET_LIST: ${hypothesis.id}`
    );
  }

  if (
    !ALLOWED_STATUSES.includes(
      hypothesis.status
    )
  ) {
    throw new Error(
      `INVALID_HYPOTHESIS_STATUS: ${hypothesis.id}`
    );
  }

  return hypothesis;
};

const validateHypothesisRegistry = (
  hypotheses
) => {
  if (
    !Array.isArray(hypotheses)
  ) {
    throw new Error(
      "INVALID_HYPOTHESIS_REGISTRY"
    );
  }

  const ids =
    new Set();

  for (
    const hypothesis of hypotheses
  ) {
    validateHypothesis(
      hypothesis
    );

    const identity =
      `${hypothesis.id}@${hypothesis.version}`;

    if (
      ids.has(identity)
    ) {
      throw new Error(
        `DUPLICATE_HYPOTHESIS: ${identity}`
      );
    }

    ids.add(identity);
  }

  return {
    count:
      hypotheses.length,

    families:
      [
        ...new Set(
          hypotheses.map(
            (hypothesis) =>
              hypothesis.family
          )
        ),
      ],

    valid: true,
  };
};

module.exports = {
  validateHypothesis,
  validateHypothesisRegistry,
};