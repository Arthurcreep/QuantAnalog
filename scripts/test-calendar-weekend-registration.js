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
  const saturday =
    buildCalendarFeatures({
      timestamp:
        "2026-09-26T12:00:00.000Z",
    });

  const monday =
    buildCalendarFeatures({
      timestamp:
        "2026-09-28T12:00:00.000Z",
    });

  assert.strictEqual(
    saturday.calendarIsWeekend,
    true
  );

  assert.strictEqual(
    saturday.calendarWeekendUtc,
    1
  );

  assert.strictEqual(
    monday.calendarIsWeekend,
    false
  );

  assert.strictEqual(
    monday.calendarWeekendUtc,
    0
  );

  assert.strictEqual(
    isHypothesisImplemented(
      "H_CAL_003"
    ),
    true
  );

  const execution =
    getHypothesisExecution(
      "H_CAL_003"
    );

  assert.strictEqual(
    execution.executor,
    "CATEGORICAL_FACTOR_RESEARCH"
  );

  assert.strictEqual(
    execution.protocol,
    "CALENDAR_WEEKEND_FUTURE_RV_V1"
  );

  assert.strictEqual(
    execution
      .datasetBinding
      .timeframe,
    "1h"
  );

  assert.strictEqual(
    hasResearchProtocol(
      "CALENDAR_WEEKEND_FUTURE_RV_V1"
    ),
    true
  );

  const protocol =
    getResearchProtocol(
      "CALENDAR_WEEKEND_FUTURE_RV_V1"
    );

  assert.strictEqual(
    protocol.feature.field,
    "calendarWeekendUtc"
  );

  assert.strictEqual(
    protocol.feature.categoryCount,
    2
  );

  assert.strictEqual(
    protocol.horizons.length,
    5
  );

  console.log(
    "Calendar weekend registration test passed."
  );

  console.log({
    hypothesisId:
      "H_CAL_003",

    feature:
      protocol.feature,

    modelTimeframe:
      protocol.modelTimeframe,

    horizons:
      protocol.horizons,

    saturday:
      saturday.calendarWeekendUtc,

    monday:
      monday.calendarWeekendUtc,

    executor:
      execution.executor,
  });
};

run();