const up = async (
  queryInterface,
  Sequelize
) => {
  await queryInterface.createTable(
    "forecasts",
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

      dataset_id: {
        type:
          Sequelize.UUID,

        allowNull:
          false,

        references: {
          model:
            "datasets",

          key:
            "id",
        },

        onUpdate:
          "CASCADE",

        onDelete:
          "RESTRICT",
      },

      source_analysis_run_id: {
        type:
          Sequelize.UUID,

        allowNull:
          true,

        references: {
          model:
            "analysis_runs",

          key:
            "id",
        },

        onUpdate:
          "CASCADE",

        onDelete:
          "RESTRICT",
      },

      forecast_key: {
        type:
          Sequelize.STRING(64),

        allowNull:
          false,
      },

      model_id: {
        type:
          Sequelize.STRING(100),

        allowNull:
          false,
      },

      model_version: {
        type:
          Sequelize.STRING(50),

        allowNull:
          false,
      },

      model_checksum: {
        type:
          Sequelize.STRING(64),

        allowNull:
          false,
      },

      dataset_checksum: {
        type:
          Sequelize.STRING(128),

        allowNull:
          false,
      },

      target: {
        type:
          Sequelize.STRING(100),

        allowNull:
          false,
      },

      model_timeframe: {
        type:
          Sequelize.STRING(20),

        allowNull:
          false,
      },

      horizon: {
        type:
          Sequelize.STRING(20),

        allowNull:
          false,
      },

      issued_at: {
        type:
          Sequelize.DATE,

        allowNull:
          false,
      },

      input_cutoff_at: {
        type:
          Sequelize.DATE,

        allowNull:
          false,
      },

      target_window_start_at: {
        type:
          Sequelize.DATE,

        allowNull:
          false,
      },

      target_window_end_at: {
        type:
          Sequelize.DATE,

        allowNull:
          false,
      },

      model_config: {
        type:
          Sequelize.JSONB,

        allowNull:
          false,
      },

      prediction: {
        type:
          Sequelize.JSONB,

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
    "forecasts",
    [
      "forecast_key",
    ],
    {
      unique:
        true,

      name:
        "forecasts_forecast_key_unique_idx",
    }
  );

  await queryInterface.addIndex(
    "forecasts",
    [
      "dataset_id",
    ],
    {
      name:
        "forecasts_dataset_id_idx",
    }
  );

  await queryInterface.addIndex(
    "forecasts",
    [
      "source_analysis_run_id",
    ],
    {
      name:
        "forecasts_source_analysis_run_idx",
    }
  );

  await queryInterface.addIndex(
    "forecasts",
    [
      "issued_at",
    ],
    {
      name:
        "forecasts_issued_at_idx",
    }
  );

  await queryInterface.addIndex(
    "forecasts",
    [
      "target",
      "model_timeframe",
      "horizon",
    ],
    {
      name:
        "forecasts_target_timeframe_horizon_idx",
    }
  );
};

const down = async (
  queryInterface
) => {
  await queryInterface.dropTable(
    "forecasts"
  );
};

module.exports = {
  up,
  down,
};