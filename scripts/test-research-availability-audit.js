const assert = require(
  "assert"
);

const {
  SYSTEM_HYPOTHESES,
} = require(
  "../src/modules/research/registry/hypothesisRegistry"
);

const {
  auditResearchUniverseAvailability,
} = require(
  "../src/modules/research/availability/auditResearchUniverseAvailability"
);

const findResult = (
  results,
  hypothesisId
) =>
  results.find(
    (item) =>
      item.hypothesisId ===
      hypothesisId
  );

const run = () => {
  const result =
    auditResearchUniverseAvailability({
      hypotheses:
        SYSTEM_HYPOTHESES,

      /*
       * Представим текущее состояние:
       * candles у BTC уже есть.
       */
      availableData: [
        "CANDLES",
      ],

      /*
       * Эти данные теоретически умеем
       * получить следующим слоем acquisition.
       */
      acquirableData: [
        "FUNDING",
        "OPEN_INTEREST",
        "MULTI_ASSET_CANDLES",
      ],
    });

  const hour =
    findResult(
      result.results,
      "H_CAL_001"
    );

  const weekday =
    findResult(
      result.results,
      "H_CAL_002"
    );

  const funding =
    findResult(
      result.results,
      "H_FUND_001"
    );

  const openInterest =
    findResult(
      result.results,
      "H_OI_001"
    );

  const crossAsset =
    findResult(
      result.results,
      "H_CROSS_001"
    );

  const lunar =
    findResult(
      result.results,
      "H_EXP_001"
    );

  assert.strictEqual(
    hour.status,
    "READY"
  );

  assert.strictEqual(
    weekday.status,
    "READY"
  );

  assert.strictEqual(
    funding.status,
    "NEED_ACQUISITION"
  );

  assert.strictEqual(
    openInterest.status,
    "NEED_ACQUISITION"
  );

  assert.strictEqual(
    crossAsset.status,
    "NEED_ACQUISITION"
  );

  /*
   * TIMESTAMP должен автоматически
   * считаться доступным через CANDLES.
   */
  assert.strictEqual(
    lunar.status,
    "READY"
  );

  console.log(
    "Research availability audit test passed."
  );

  console.log(
    "\n===== SUMMARY ====="
  );

  console.log(
    result.summary
  );

  console.log(
    "\n===== HYPOTHESES ====="
  );

  console.table(
    result.results.map(
      (item) => ({
        Hypothesis:
          item.hypothesisId,

        Status:
          item.status,

        Missing:
          item.missingData
            .join(", "),

        Acquirable:
          item
            .acquirableMissingData
            .join(", "),

        Unavailable:
          item
            .unavailableData
            .join(", "),
      })
    )
  );
};

run();