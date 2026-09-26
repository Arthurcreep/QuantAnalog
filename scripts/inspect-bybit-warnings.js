const {
  QueryTypes,
} = require("sequelize");

const sequelize = require(
  "../src/config/database"
);

const run = async () => {
  try {
    await sequelize.authenticate();

    const rows =
      await sequelize.query(
        `
        SELECT
          d.id,
          d.name,
          d.start_time,
          d.end_time,
          d.row_count,
          q.status,
          q.coverage,
          q.metrics,
          q.created_at
        FROM datasets d
        JOIN LATERAL (
          SELECT
            status,
            coverage,
            metrics,
            created_at
          FROM data_quality_reports
          WHERE dataset_id = d.id
          ORDER BY created_at DESC
          LIMIT 1
        ) q ON TRUE
        WHERE
          d.stage = 'RAW'
          AND d.venue = 'BYBIT'
          AND d.instrument = 'BTCUSDT'
          AND d.market_type = 'LINEAR'
          AND d.source_timeframe = '1m'
          AND q.status = 'ACCEPTABLE_WITH_WARNINGS'
        ORDER BY d.start_time ASC
        `,
        {
          type:
            QueryTypes.SELECT,
        }
      );

    console.log(
      `Warning datasets: ${rows.length}`
    );

    for (
      const row of rows
    ) {
      console.log(
        "\n------------------------------"
      );

      console.log({
        datasetId:
          row.id,

        startTime:
          row.start_time,

        endTime:
          row.end_time,

        rowCount:
          row.row_count,

        coverage:
          row.coverage,
      });

      console.dir(
        row.metrics,
        {
          depth: null,
        }
      );
    }
  } catch (error) {
    console.error(
      "Warning inspection failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();