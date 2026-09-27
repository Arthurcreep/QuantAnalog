const up = async (
  queryInterface,
  Sequelize
) => {
  await queryInterface.createTable(
    "forecast_runs",
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

      run_key: {
        type:
          Sequelize.STRING(64),

        allowNull:
          false,
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

      dataset_checksum: {
        type:
          Sequelize.STRING(128),

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

      protocol_id: {
        type:
          Sequelize.STRING(100),

        allowNull:
          false,
      },

      protocol_version: {
        type:
          Sequelize.STRING(50),

        allowNull:
          false,
      },

      protocol_checksum: {
        type:
          Sequelize.STRING(64),

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

      horizons: {
        type:
          Sequelize.JSONB,

        allowNull:
          false,
      },

      run_config: {
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
    "forecast_runs",
    [
      "run_key",
    ],
    {
      unique:
        true,

      name:
        "forecast_runs_run_key_unique_idx",
    }
  );

  await queryInterface.addIndex(
    "forecast_runs",
    [
      "dataset_id",
    ],
    {
      name:
        "forecast_runs_dataset_id_idx",
    }
  );

  await queryInterface.addIndex(
    "forecast_runs",
    [
      "issued_at",
    ],
    {
      name:
        "forecast_runs_issued_at_idx",
    }
  );

  await queryInterface.addIndex(
    "forecast_runs",
    [
      "model_id",
      "model_version",
    ],
    {
      name:
        "forecast_runs_model_idx",
    }
  );
};

const down = async (
  queryInterface
) => {
  await queryInterface.dropTable(
    "forecast_runs"
  );
};

module.exports = {
  up,
  down,
};