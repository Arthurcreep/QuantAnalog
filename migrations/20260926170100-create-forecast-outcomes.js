const up = async (
  queryInterface,
  Sequelize
) => {
  await queryInterface.createTable(
    "forecast_outcomes",
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

      actual_dataset_id: {
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

      actual_dataset_checksum: {
        type:
          Sequelize.STRING(128),

        allowNull:
          false,
      },

      actual: {
        type:
          Sequelize.JSONB,

        allowNull:
          false,
      },

      observed_at: {
        type:
          Sequelize.DATE,

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
    "forecast_outcomes",
    [
      "forecast_id",
    ],
    {
      unique:
        true,

      name:
        "forecast_outcomes_forecast_unique_idx",
    }
  );

  await queryInterface.addIndex(
    "forecast_outcomes",
    [
      "actual_dataset_id",
    ],
    {
      name:
        "forecast_outcomes_actual_dataset_idx",
    }
  );

  await queryInterface.addIndex(
    "forecast_outcomes",
    [
      "observed_at",
    ],
    {
      name:
        "forecast_outcomes_observed_at_idx",
    }
  );
};

const down = async (
  queryInterface
) => {
  await queryInterface.dropTable(
    "forecast_outcomes"
  );
};

module.exports = {
  up,
  down,
};