const up = async (
  queryInterface,
  Sequelize
) => {
  await queryInterface.createTable(
    "forecast_run_items",
    {
      id: {
        type:
          Sequelize.UUID,

        allowNull:
          false,

        primaryKey:
          true,

        defaultValue:
          Sequelize.UUIDV4,
      },

      forecast_run_id: {
        type:
          Sequelize.UUID,

        allowNull:
          false,

        references: {
          model:
            "forecast_runs",

          key:
            "id",
        },

        onUpdate:
          "CASCADE",

        onDelete:
          "RESTRICT",
      },

      forecast_id: {
        type:
          Sequelize.UUID,

        allowNull:
          false,

        references: {
          model:
            "forecasts",

          key:
            "id",
        },

        onUpdate:
          "CASCADE",

        onDelete:
          "RESTRICT",
      },

      horizon: {
        type:
          Sequelize.STRING(20),

        allowNull:
          false,
      },

      horizon_bars: {
        type:
          Sequelize.INTEGER,

        allowNull:
          false,
      },

      position: {
        type:
          Sequelize.INTEGER,

        allowNull:
          false,
      },

      created_at: {
        type:
          Sequelize.DATE,

        allowNull:
          false,

        defaultValue:
          Sequelize.fn(
            "NOW"
          ),
      },
    }
  );

  await queryInterface.addIndex(
    "forecast_run_items",
    [
      "forecast_run_id",
      "forecast_id",
    ],
    {
      unique:
        true,

      name:
        "forecast_run_items_run_forecast_unique_idx",
    }
  );

  await queryInterface.addIndex(
    "forecast_run_items",
    [
      "forecast_run_id",
      "horizon",
    ],
    {
      unique:
        true,

      name:
        "forecast_run_items_run_horizon_unique_idx",
    }
  );

  await queryInterface.addIndex(
    "forecast_run_items",
    [
      "forecast_run_id",
      "position",
    ],
    {
      name:
        "forecast_run_items_position_idx",
    }
  );
};

const down = async (
  queryInterface
) => {
  await queryInterface.dropTable(
    "forecast_run_items"
  );
};

module.exports = {
  up,
  down,
};