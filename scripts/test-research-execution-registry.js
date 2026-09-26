const assert = require(
  "assert"
);

const {
  getHypothesisExecution,
} = require(
  "../src/modules/research/registry/hypothesisExecutionRegistry"
);

const {
  getResearchProtocol,
} = require(
  "../src/modules/research/registry/researchProtocolRegistry"
);

const run = () => {
  const volatilityExecution =
    getHypothesisExecution(
      "H_VOL_001"
    );

  const hourExecution =
    getHypothesisExecution(
      "H_CAL_001"
    );

  const weekdayExecution =
    getHypothesisExecution(
      "H_CAL_002"
    );

  assert.strictEqual(
    volatilityExecution.executor,
    "VOLATILITY_STRUCTURE_RESEARCH"
  );

  assert.strictEqual(
    hourExecution.executor,
    "CATEGORICAL_FACTOR_RESEARCH"
  );

  assert.strictEqual(
    weekdayExecution.executor,
    "CATEGORICAL_FACTOR_RESEARCH"
  );

  const volatilityProtocol =
    getResearchProtocol(
      volatilityExecution.protocol
    );

  const hourProtocol =
    getResearchProtocol(
      hourExecution.protocol
    );

  const weekdayProtocol =
    getResearchProtocol(
      weekdayExecution.protocol
    );

  assert.ok(
    volatilityProtocol
  );

  assert.ok(
    hourProtocol
  );

  assert.ok(
    weekdayProtocol
  );

  assert.strictEqual(
    hourProtocol.feature.name,
    "CALENDAR_HOUR_UTC"
  );

  assert.strictEqual(
    hourProtocol.feature.kind,
    "CATEGORICAL"
  );

  assert.strictEqual(
    hourProtocol.feature.field,
    "calendarHourUtc"
  );

  assert.strictEqual(
    hourProtocol.feature.categoryCount,
    24
  );

  assert.strictEqual(
    hourProtocol.target.name,
    "FUTURE_REALIZED_VOLATILITY"
  );

  assert.strictEqual(
    hourProtocol.modelTimeframe,
    "1h"
  );

  assert.strictEqual(
    hourProtocol.statistics.hacLagFloor,
    24
  );

  assert.strictEqual(
    hourProtocol
      .statistics
      .bootstrap
      .blockSizeBars,
    168
  );

  assert.strictEqual(
    hourProtocol
      .statistics
      .bootstrap
      .iterations,
    2000
  );

  assert.strictEqual(
    hourProtocol
      .statistics
      .bootstrap
      .seed,
    20260921
  );

  assert.strictEqual(
    weekdayProtocol.feature.name,
    "CALENDAR_WEEKDAY_UTC"
  );

  assert.strictEqual(
    weekdayProtocol
      .feature
      .categoryCount,
    7
  );

  console.log(
    "Research execution registry test passed."
  );

  console.log(
    "\n===== EXECUTION ====="
  );

  console.table([
    {
      Hypothesis:
        "H_VOL_001",

      Executor:
        volatilityExecution.executor,

      Protocol:
        volatilityExecution.protocol,
    },

    {
      Hypothesis:
        "H_CAL_001",

      Executor:
        hourExecution.executor,

      Protocol:
        hourExecution.protocol,
    },

    {
      Hypothesis:
        "H_CAL_002",

      Executor:
        weekdayExecution.executor,

      Protocol:
        weekdayExecution.protocol,
    },
  ]);

  console.log(
    "\n===== GENERIC CALENDAR PROTOCOLS ====="
  );

  console.table([
    {
      Protocol:
        hourProtocol.id,

      Feature:
        hourProtocol.feature.name,

      Categories:
        hourProtocol
          .feature
          .categoryCount,

      Timeframe:
        hourProtocol
          .modelTimeframe,

      HAC:
        hourProtocol
          .statistics
          .hacLagFloor,

      BootstrapBlock:
        hourProtocol
          .statistics
          .bootstrap
          .blockSizeBars,
    },

    {
      Protocol:
        weekdayProtocol.id,

      Feature:
        weekdayProtocol.feature.name,

      Categories:
        weekdayProtocol
          .feature
          .categoryCount,

      Timeframe:
        weekdayProtocol
          .modelTimeframe,

      HAC:
        weekdayProtocol
          .statistics
          .hacLagFloor,

      BootstrapBlock:
        weekdayProtocol
          .statistics
          .bootstrap
          .blockSizeBars,
    },
  ]);
};

run();