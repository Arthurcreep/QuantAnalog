const { findRecentForecastRuns } = require("../runs/forecastRun.repository");

const listForecastRuns = async () => ({ forecastRuns: await findRecentForecastRuns() });

module.exports = { listForecastRuns };
