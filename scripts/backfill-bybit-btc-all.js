const sequelize = require(
  "../src/config/database"
);

const {
  backfillBybitCandles,
} = require(
  "../src/modules/datasets/services/backfillBybitCandles.service"
);

const run = async () => {
  try {
    await sequelize.authenticate();

    const result =
      await backfillBybitCandles({
        category:
          "linear",

        symbol:
          "BTCUSDT",

        interval:
          "1",

        chunkDays: 30,
      });

    console.dir(
      result,
      {
        depth: null,
      }
    );

    console.log(
      "Full BTCUSDT Bybit backfill completed"
    );
  } catch (error) {
    console.error(
      "BTCUSDT Bybit backfill failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();