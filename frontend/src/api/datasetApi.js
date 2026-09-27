import http from
  "./http.js";

const getDatasetQuality =
  async ({
    datasetId,
  }) => {
    const response =
      await http.get(
        `/datasets/${datasetId}/quality`
      );

    return response
      .data
      .data;
  };

const getDatasetLineage =
  async ({
    datasetId,
  }) => {
    const response =
      await http.get(
        `/datasets/${datasetId}/lineage`
      );

    return response
      .data
      .data;
  };

export {
  getDatasetQuality,
  getDatasetLineage,
};