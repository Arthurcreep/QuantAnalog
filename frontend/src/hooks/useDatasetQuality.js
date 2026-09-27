import {
  useEffect,
  useState,
} from "react";

import {
  getDatasetLineage,
  getDatasetQuality,
} from "../api/datasetApi.js";

const useDatasetQuality =
  ({
    datasetId,
  }) => {
    const [
      result,
      setResult,
    ] =
      useState(
        null
      );

    const [
      loading,
      setLoading,
    ] =
      useState(
        true
      );

    const [
      error,
      setError,
    ] =
      useState(
        null
      );

    useEffect(
      () => {
        let active =
          true;

        const load =
          async () => {
            try {
              setLoading(
                true
              );

              setError(
                null
              );

              const [
                quality,
                lineage,
              ] =
                await Promise.all([
                  getDatasetQuality({
                    datasetId,
                  }),

                  getDatasetLineage({
                    datasetId,
                  }),
                ]);

              if (!active) {
                return;
              }

              setResult({
                quality,
                lineage,
              });
            } catch (
              requestError
            ) {
              if (!active) {
                return;
              }

              setError(
                requestError
                  ?.response
                  ?.data
                  ?.error
                  ?.message ||
                  requestError
                    ?.message ||
                  "Failed to load dataset"
              );
            } finally {
              if (active) {
                setLoading(
                  false
                );
              }
            }
          };

        load();

        return () => {
          active =
            false;
        };
      },
      [
        datasetId,
      ]
    );

    return {
      result,
      loading,
      error,
    };
  };

export default useDatasetQuality;