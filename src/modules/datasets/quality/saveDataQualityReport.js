const {
  createDataQualityReport,
} = require("./dataQualityReport.repository");

const saveDataQualityReport = async ({
  datasetId,
  report,
  policy,
  qualityStatus,
  transaction,
}) => {
  return createDataQualityReport(
    {
      datasetId,
      status: qualityStatus,
      coverage: report.coverage,
      metrics: report,
      policy,
    },
    {
      transaction,
    }
  );
};

module.exports = {
  saveDataQualityReport,
};