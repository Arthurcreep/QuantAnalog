const up = async (
  queryInterface,
  Sequelize
) => {
  await queryInterface.createTable(
    "research_batches",
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },

      mode: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },

      venue: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      instrument: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      market_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },

      status: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },

      plan_snapshot: {
        type: Sequelize.JSONB,
        allowNull: false,
      },

      acquisition_requirements: {
        type: Sequelize.JSONB,
        allowNull: false,
      },

      execution_summary: {
        type: Sequelize.JSONB,
        allowNull: true,
      },

      started_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue:
          Sequelize.fn("NOW"),
      },

      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue:
          Sequelize.fn("NOW"),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue:
          Sequelize.fn("NOW"),
      },
    }
  );

  await queryInterface.addIndex(
    "research_batches",
    [
      "venue",
      "instrument",
      "market_type",
    ],
    {
      name:
        "research_batches_instrument_idx",
    }
  );

  await queryInterface.addIndex(
    "research_batches",
    ["status"],
    {
      name:
        "research_batches_status_idx",
    }
  );

  await queryInterface.createTable(
    "research_batch_analysis_runs",
    {
      research_batch_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,

        references: {
          model:
            "research_batches",
          key:
            "id",
        },

        onDelete:
          "CASCADE",

        onUpdate:
          "CASCADE",
      },

      analysis_run_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,

        references: {
          model:
            "analysis_runs",
          key:
            "id",
        },

        onDelete:
          "RESTRICT",

        onUpdate:
          "CASCADE",
      },

      hypothesis_id: {
        type:
          Sequelize.STRING(100),

        allowNull:
          false,
      },

      timeframe: {
        type:
          Sequelize.STRING(20),

        allowNull:
          true,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,

        defaultValue:
          Sequelize.fn("NOW"),
      },
    }
  );

  await queryInterface.addIndex(
    "research_batch_analysis_runs",
    ["analysis_run_id"],
    {
      name:
        "research_batch_analysis_runs_run_idx",
    }
  );

  await queryInterface.addIndex(
    "research_batch_analysis_runs",
    [
      "research_batch_id",
      "hypothesis_id",
    ],
    {
      name:
        "research_batch_analysis_runs_hypothesis_idx",
    }
  );
};

const down = async (
  queryInterface
) => {
  await queryInterface.dropTable(
    "research_batch_analysis_runs"
  );

  await queryInterface.dropTable(
    "research_batches"
  );
};

module.exports = {
  up,
  down,
};