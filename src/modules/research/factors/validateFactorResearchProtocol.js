const ALLOWED_FEATURE_KINDS = [
  "CATEGORICAL",
  "CONTINUOUS",
  "BINARY",
];

const ALLOWED_INCOMPLETE_POLICIES = [
  "DROP_INCOMPLETE",
];

const ALLOWED_MULTIPLE_TESTING_METHODS = [
  "BENJAMINI_HOCHBERG",
];

const validateIsoDate = ({
  value,
  field,
}) => {
  if (
    typeof value !== "string" ||
    Number.isNaN(Date.parse(value))
  ) {
    throw new Error(
      `INVALID_PROTOCOL_DATE: ${field}`
    );
  }
};

const validateHorizons = (
  horizons
) => {
  if (
    !Array.isArray(horizons) ||
    horizons.length === 0
  ) {
    throw new Error(
      "INVALID_PROTOCOL_HORIZONS"
    );
  }

  const labels =
    new Set();

  const bars =
    new Set();

  for (
    const horizon of horizons
  ) {
    if (
      !horizon ||
      typeof horizon.label !==
        "string" ||
      horizon.label.length === 0
    ) {
      throw new Error(
        "INVALID_PROTOCOL_HORIZON_LABEL"
      );
    }

    if (
      !Number.isInteger(
        horizon.bars
      ) ||
      horizon.bars <= 0
    ) {
      throw new Error(
        "INVALID_PROTOCOL_HORIZON_BARS"
      );
    }

    if (
      labels.has(
        horizon.label
      )
    ) {
      throw new Error(
        "DUPLICATE_PROTOCOL_HORIZON_LABEL"
      );
    }

    if (
      bars.has(
        horizon.bars
      )
    ) {
      throw new Error(
        "DUPLICATE_PROTOCOL_HORIZON_BARS"
      );
    }

    labels.add(
      horizon.label
    );

    bars.add(
      horizon.bars
    );
  }
};

const validateFeature = (
  feature
) => {
  if (
    !feature ||
    typeof feature.name !==
      "string" ||
    typeof feature.field !==
      "string"
  ) {
    throw new Error(
      "INVALID_PROTOCOL_FEATURE"
    );
  }

  if (
    !ALLOWED_FEATURE_KINDS.includes(
      feature.kind
    )
  ) {
    throw new Error(
      "INVALID_PROTOCOL_FEATURE_KIND"
    );
  }

  if (
    feature.kind ===
      "CATEGORICAL" &&
    (
      !Number.isInteger(
        feature.categoryCount
      ) ||
      feature.categoryCount <
        2
    )
  ) {
    throw new Error(
      "INVALID_PROTOCOL_CATEGORY_COUNT"
    );
  }
};

const validateTarget = (
  target
) => {
  if (
    !target ||
    typeof target.name !==
      "string" ||
    typeof target.field !==
      "string"
  ) {
    throw new Error(
      "INVALID_PROTOCOL_TARGET"
    );
  }
};

const validateFactorResearchProtocol = (
  protocol
) => {
  if (
    !protocol ||
    typeof protocol !==
      "object"
  ) {
    throw new Error(
      "INVALID_FACTOR_RESEARCH_PROTOCOL"
    );
  }

  if (
    typeof protocol.id !==
      "string" ||
    protocol.id.length === 0
  ) {
    throw new Error(
      "INVALID_PROTOCOL_ID"
    );
  }

  if (
    typeof protocol.version !==
      "string" ||
    protocol.version.length === 0
  ) {
    throw new Error(
      "INVALID_PROTOCOL_VERSION"
    );
  }

  validateFeature(
    protocol.feature
  );

  validateTarget(
    protocol.target
  );

  if (
    typeof protocol
      .modelTimeframe !==
      "string" ||
    protocol
      .modelTimeframe
      .length === 0
  ) {
    throw new Error(
      "INVALID_PROTOCOL_MODEL_TIMEFRAME"
    );
  }

  if (
    !ALLOWED_INCOMPLETE_POLICIES.includes(
      protocol
        .incompletePolicy
    )
  ) {
    throw new Error(
      "INVALID_PROTOCOL_INCOMPLETE_POLICY"
    );
  }

  validateHorizons(
    protocol.horizons
  );

  validateIsoDate({
    value:
      protocol
        .development
        ?.end,

    field:
      "development.end",
  });

  validateIsoDate({
    value:
      protocol
        .retrospectiveValidation
        ?.start,

    field:
      "retrospectiveValidation.start",
  });

  const developmentEnd =
    Date.parse(
      protocol
        .development
        .end
    );

  const validationStart =
    Date.parse(
      protocol
        .retrospectiveValidation
        .start
    );

  if (
    developmentEnd >=
    validationStart
  ) {
    throw new Error(
      "INVALID_PROTOCOL_PERIOD_SPLIT"
    );
  }

  if (
    !Number.isInteger(
      protocol
        .statistics
        ?.hacLagFloor
    ) ||
    protocol
      .statistics
      .hacLagFloor < 0
  ) {
    throw new Error(
      "INVALID_PROTOCOL_HAC_LAG_FLOOR"
    );
  }

  if (
    !ALLOWED_MULTIPLE_TESTING_METHODS.includes(
      protocol
        .statistics
        ?.multipleTesting
        ?.method
    )
  ) {
    throw new Error(
      "INVALID_PROTOCOL_MULTIPLE_TESTING"
    );
  }

  if (
    !Number.isInteger(
      protocol
        .statistics
        ?.bootstrap
        ?.blockSizeBars
    ) ||
    protocol
      .statistics
      .bootstrap
      .blockSizeBars <= 0
  ) {
    throw new Error(
      "INVALID_PROTOCOL_BOOTSTRAP_BLOCK_SIZE"
    );
  }

  if (
    !Number.isInteger(
      protocol
        .statistics
        ?.bootstrap
        ?.iterations
    ) ||
    protocol
      .statistics
      .bootstrap
      .iterations <= 0
  ) {
    throw new Error(
      "INVALID_PROTOCOL_BOOTSTRAP_ITERATIONS"
    );
  }

  if (
    !Number.isInteger(
      protocol
        .statistics
        ?.bootstrap
        ?.seed
    )
  ) {
    throw new Error(
      "INVALID_PROTOCOL_BOOTSTRAP_SEED"
    );
  }

  return protocol;
};

module.exports = {
  validateFactorResearchProtocol,
};