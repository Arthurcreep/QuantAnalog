const up = async (
  queryInterface,
  Sequelize
) => {
  await queryInterface.addColumn(
    "research_batches",
    "execution_details",
    {
      type:
        Sequelize.JSONB,

      allowNull:
        false,

      defaultValue:
        [],
    }
  );
};

const down = async (
  queryInterface
) => {
  await queryInterface.removeColumn(
    "research_batches",
    "execution_details"
  );
};

module.exports = {
  up,
  down,
};