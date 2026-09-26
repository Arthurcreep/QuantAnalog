const DataQualityReport = require(
  "./dataQualityReport.model"
);

const createDataQualityReport = async (
  data,
  options = {}
) => {
  return DataQualityReport.create(data, options);
};

const findLatestDataQualityReport = async (
  datasetId,
  options = {}
) => {
  return DataQualityReport.findOne({
    where: {
      datasetId,
    },
    order: [["created_at", "DESC"]],
    ...options,
  });
};

module.exports = {
  createDataQualityReport,
  findLatestDataQualityReport,
};