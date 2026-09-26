const {
  runCategoricalFactorResearch,
} = require(
  "./runCategoricalFactorResearch.service"
);

const {
  adaptCalendarHourVolatilityV1,
} = require(
  "../protocols/adaptCalendarHourVolatilityV1"
);

const runCalendarHourFactorResearch =
  async ({
    datasetId,
  }) => {
    const protocol =
      adaptCalendarHourVolatilityV1();

    return runCategoricalFactorResearch({
      datasetId,
      protocol,
    });
  };

module.exports = {
  runCalendarHourFactorResearch,
};