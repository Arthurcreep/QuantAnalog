import {
    useParams,
} from "react-router-dom";

import DatasetHeader from
    "../components/DatasetHeader.jsx";

import DatasetLineage from
    "../components/DatasetLineage.jsx";

import DatasetQualityMetrics from
    "../components/DatasetQualityMetrics.jsx";

import InfoPanel from
    "../components/InfoPanel.jsx";

import PageMessage from
    "../components/PageMessage.jsx";

import useDatasetQuality from
    "../hooks/useDatasetQuality.js";

import {
    formatUtcDate,
} from "../utils/formatters.js";

const DatasetQualityPage =
    () => {
        const {
            id,
        } =
            useParams();

        const {
            result,
            loading,
            error,
        } =
            useDatasetQuality({
                datasetId:
                    id,
            });

        if (loading) {
            return (
                <PageMessage
                    message="Loading dataset quality..."
                />
            );
        }

        if (error) {
            return (
                <PageMessage
                    error
                    title="Dataset request failed"
                    message={
                        error
                    }
                />
            );
        }

        if (!result) {
            return (
                <PageMessage
                    message="Dataset unavailable."
                />
            );
        }

        const {
            quality,
            lineage,
        } =
            result;

        const dataset =
            quality.dataset;

        const qualityReport =
            quality.qualityReport;

        return (
            <div className="min-h-screen bg-zinc-950 text-zinc-100">
                <DatasetHeader
                    dataset={
                        dataset
                    }
                />

                <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
                    <DatasetQualityMetrics
                        qualityReport={
                            qualityReport
                        }
                        repairs={
                            quality.repairs
                        }
                    />

                    <section className="grid gap-6 lg:grid-cols-2">
                        <InfoPanel
                            title="Dataset"
                            rows={[
                                [
                                    "Dataset ID",
                                    dataset.id,
                                ],

                                [
                                    "Dataset type",
                                    dataset.datasetType,
                                ],

                                [
                                    "Stage",
                                    dataset.stage,
                                ],

                                [
                                    "Version",
                                    dataset.version,
                                ],

                                [
                                    "Timezone",
                                    dataset.timezone,
                                ],

                                [
                                    "Start UTC",
                                    formatUtcDate(
                                        dataset.startTime
                                    ),
                                ],

                                [
                                    "End UTC",
                                    formatUtcDate(
                                        dataset.endTime
                                    ),
                                ],
                            ]}
                        />

                        <InfoPanel
                            title="Reproducibility"
                            rows={[
                                [
                                    "Checksum",
                                    dataset.checksum,
                                ],

                                [
                                    "Quality report",
                                    qualityReport?.id ||
                                    "—",
                                ],

                                [
                                    "Quality status",
                                    qualityReport?.status ||
                                    "—",
                                ],

                                [
                                    "Schema valid",
                                    qualityReport
                                        ?.metrics
                                        ?.schemaValid
                                        ? "YES"
                                        : "NO",
                                ],

                                [
                                    "Report created",
                                    formatUtcDate(
                                        qualityReport
                                            ?.created_at
                                    ),
                                ],

                                [
                                    "Storage",
                                    dataset.storageUri,
                                ],
                            ]}
                        />
                    </section>

                    <DatasetLineage
                        lineage={
                            lineage
                        }
                    />
                </main>
            </div>
        );
    };

export default DatasetQualityPage;