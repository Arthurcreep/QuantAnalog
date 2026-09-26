const assert = require(
  "assert"
);

const sequelize = require(
  "../src/config/database"
);

const {
  resolveInstrumentCapabilities,
} = require(
  "../src/modules/research/availability/resolveInstrumentCapabilities"
);

const run = async () => {
  try {
    await sequelize.authenticate();

    const result =
      await resolveInstrumentCapabilities({
        venue: "BYBIT",
        instrument: "BTCUSDT",
        marketType: "LINEAR",
      });

    assert.ok(
      result.available.includes(
        "CANDLES"
      )
    );

    assert.ok(
      result.available.includes(
        "TIMESTAMP"
      )
    );

    assert.strictEqual(
      result
        .datasets
        .CANDLES
        .available,
      true
    );

    assert.ok(
      result
        .datasets
        .CANDLES
        .canonical
    );

    assert.ok(
      result
        .datasets
        .CANDLES
        .prepared
        ["1h"]
    );

    console.log(
      "Instrument capability resolver test passed."
    );

    console.log(
      "\n===== INSTRUMENT ====="
    );

    console.log(
      result.instrumentContext
    );

    console.log(
      "\n===== CAPABILITIES ====="
    );

    console.log({
      available:
        result.available,

      missing:
        result.missing,

      researchReadyDatasetCount:
        result
          .researchReadyDatasetCount,
    });

    console.log(
      "\n===== CANDLE DATASETS ====="
    );

    console.log({
      canonical:
        result
          .datasets
          .CANDLES
          .canonical
          ? {
              id:
                result
                  .datasets
                  .CANDLES
                  .canonical
                  .id,

              timeframe:
                result
                  .datasets
                  .CANDLES
                  .canonical
                  .sourceTimeframe,

              qualityStatus:
                result
                  .datasets
                  .CANDLES
                  .canonical
                  .qualityStatus,
            }
          : null,

      prepared:
        Object.fromEntries(
          Object.entries(
            result
              .datasets
              .CANDLES
              .prepared
          ).map(
            ([
              timeframe,
              dataset,
            ]) => [
              timeframe,
              {
                id:
                  dataset.id,

                qualityStatus:
                  dataset
                    .qualityStatus,

                rowCount:
                  dataset
                    .rowCount,
              },
            ]
          )
        ),
    });

    console.log(
      "\n===== OTHER DATA ====="
    );

    console.table(
      [
        "FUNDING",
        "OPEN_INTEREST",
        "TRADES",
        "ORDER_BOOK",
        "LIQUIDATIONS",
      ].map(
        (capability) => ({
          Capability:
            capability,

          Available:
            result
              .datasets[
                capability
              ]
              .available,

          Count:
            result
              .datasets[
                capability
              ]
              .datasetCount,
        })
      )
    );
  } catch (error) {
    console.error(
      "Instrument capability resolver test failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();