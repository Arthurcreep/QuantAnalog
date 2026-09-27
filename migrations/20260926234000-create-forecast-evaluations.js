const up = async (
  queryInterface,
  Sequelize
) => {
  await queryInterface.createTable(
    "forecast_evaluations",
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

      outcome_id: {
        type:
          Sequelize.UUID,

        allowNull:
          false,

        references: {
          model:
            "forecast_outcomes",

          key:
            "id",
        },

        onUpdate:
          "CASCADE",

        onDelete:
          "RESTRICT",
      },

      evaluation_key: {
        type:
          Sequelize.STRING(64),

        allowNull:
          false,
      },

      evaluator_id: {
        type:
          Sequelize.STRING(100),

        allowNull:
          false,
      },

      evaluator_version: {
        type:
          Sequelize.STRING(50),

        allowNull:
          false,
      },

      evaluator_checksum: {
        type:
          Sequelize.STRING(64),

        allowNull:
          false,
      },

      metrics: {
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
    "forecast_evaluations",
    [
      "evaluation_key",
    ],
    {
      unique:
        true,

      name:
        "forecast_evaluations_key_unique_idx",
    }
  );

  await queryInterface.addIndex(
    "forecast_evaluations",
    [
      "forecast_id",
    ],
    {
      name:
        "forecast_evaluations_forecast_id_idx",
    }
  );

  await queryInterface.addIndex(
    "forecast_evaluations",
    [
      "outcome_id",
    ],
    {
      name:
        "forecast_evaluations_outcome_id_idx",
    }
  );

  await queryInterface.addIndex(
    "forecast_evaluations",
    [
      "evaluator_id",
      "evaluator_version",
    ],
    {
      name:
        "forecast_evaluations_evaluator_idx",
    }
  );
};

const down = async (
  queryInterface
) => {
  await queryInterface.dropTable(
    "forecast_evaluations"
  );
};

module.exports = {
  up,
  down,
};