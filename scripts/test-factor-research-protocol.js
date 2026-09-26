const assert = require(
  "assert"
);

const {
  validateFactorResearchProtocol,
} = require(
  "../src/modules/research/factors/validateFactorResearchProtocol"
);

const {
  CALENDAR_WEEKDAY_FUTURE_RV_V1,
} = require(
  "../src/modules/research/protocols/calendarWeekdayFutureRvV1"
);

const run = () => {
  const validated =
    validateFactorResearchProtocol(
      CALENDAR_WEEKDAY_FUTURE_RV_V1
    );

  assert.strictEqual(
    validated.id,
    "CALENDAR_WEEKDAY_FUTURE_RV"
  );

  assert.strictEqual(
    validated.feature.name,
    "CALENDAR_WEEKDAY_UTC"
  );

  assert.strictEqual(
    validated.feature.kind,
    "CATEGORICAL"
  );

  assert.strictEqual(
    validated.feature.categoryCount,
    7
  );

  assert.strictEqual(
    validated.target.name,
    "FUTURE_REALIZED_VOLATILITY"
  );

  assert.deepStrictEqual(
    validated.horizons.map(
      (item) =>
        item.bars
    ),
    [
      1,
      4,
      6,
      12,
      24,
    ]
  );

  assert.strictEqual(
    validated
      .statistics
      .bootstrap
      .blockSizeBars,
    168
  );

  assert.strictEqual(
    validated
      .forwardOos
      .status,
    "PENDING_FUTURE_DATA"
  );

  console.log(
    "Factor research protocol validation passed."
  );

  console.log({
    id:
      validated.id,

    version:
      validated.version,

    feature:
      validated.feature,

    target:
      validated.target,

    modelTimeframe:
      validated.modelTimeframe,

    horizons:
      validated.horizons,

    statistics:
      validated.statistics,
  });
};

run();