const assert = require(
  "assert"
);

const {
  buildCalendarFeatures,
} = require(
  "../src/modules/research/features/calendar/buildCalendarFeatures"
);

const {
  getHypothesisExecution,
  isHypothesisImplemented,
} = require(
  "../src/modules/research/registry/hypothesisExecutionRegistry"
);

const {
  getResearchProtocol,
  hasResearchProtocol,
} = require(
  "../src/modules/research/registry/researchProtocolRegistry"
);

const run = () => {
  const january =
    buildCalendarFeatures({
      timestamp:
        "2026-01-15T12:00:00.000Z",
    });

  const december =
    buildCalendarFeatures({
      timestamp:
        "2026-12-15T12:00:00.000Z",
    });

  assert.strictEqual(
    january.calendarMonthUtc,
    1
  );

  assert.strictEqual(
    january.calendarMonthIndexUtc,
    0
  );

  assert.strictEqual(
    december.calendarMonthUtc,
    12
  );

  assert.strictEqual(
    december.calendarMonthIndexUtc,
    11
  );

  assert.strictEqual(
    isHypothesisImplemented(
      "H_CAL_004"
    ),
    true
  );

  const execution =
    getHypothesisExecution(
      "H_CAL_004"
    );

  assert.strictEqual(
    execution.executor,
    "CATEGORICAL_FACTOR_RESEARCH"
  );

  assert.strictEqual(
    execution.protocol,
    "CALENDAR_MONTH_FUTURE_RV_V1"
  );

  assert.strictEqual(
    hasResearchProtocol(
      "CALENDAR_MONTH_FUTURE_RV_V1"
    ),
    true
  );

  const protocol =
    getResearchProtocol(
      "CALENDAR_MONTH_FUTURE_RV_V1"
    );

  assert.strictEqual(
    protocol.feature.field,
    "calendarMonthIndexUtc"
  );

  assert.strictEqual(
    protocol.feature.categoryCount,
    12
  );

  assert.strictEqual(
    protocol.horizons.length,
    5
  );

  console.log(
    "Calendar month registration test passed."
  );

  console.log({
    hypothesisId:
      "H_CAL_004",

    feature:
      protocol.feature,

    january: {
      month:
        january.calendarMonthUtc,

      category:
        january.calendarMonthIndexUtc,
    },

    december: {
      month:
        december.calendarMonthUtc,

      category:
        december.calendarMonthIndexUtc,
    },

    executor:
      execution.executor,
  });
};

run();