import MetricCard from
    "./MetricCard.jsx";

import {
    formatNumber,
    formatPercent,
} from "../utils/formatters.js";

const DatasetQualityMetrics =
    ({
        qualityReport,
        repairs,
    }) => {
        const metrics =
            qualityReport?.metrics ||
            {};

        return (
            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <MetricCard
                    title="Coverage"
                    value={
                        formatPercent(
                            qualityReport?.coverage
                        )
                    }
                />

                <MetricCard
                    title="Rows"
                    value={
                        formatNumber(
                            metrics.rows,
                            0
                        )
                    }
                />

                <MetricCard
                    title="Valid rows"
                    value={
                        formatNumber(
                            metrics.validRows,
                            0
                        )
                    }
                />

                <MetricCard
                    title="Invalid rows"
                    value={
                        formatNumber(
                            metrics.invalidRows,
                            0
                        )
                    }
                />

                <MetricCard
                    title="Duplicates"
                    value={
                        formatNumber(
                            metrics.duplicateCount,
                            0
                        )
                    }
                />

                <MetricCard
                    title="Gaps"
                    value={
                        formatNumber(
                            metrics.gapCount,
                            0
                        )
                    }
                />

                <MetricCard
                    title="Missing intervals"
                    value={
                        formatNumber(
                            metrics.missingIntervalCount,
                            0
                        )
                    }
                />

                <MetricCard
                    title="Zero volume"
                    value={
                        formatNumber(
                            metrics.zeroVolumeCount,
                            0
                        )
                    }
                />

                <MetricCard
                    title="Misaligned"
                    value={
                        formatNumber(
                            metrics.misalignedCount,
                            0
                        )
                    }
                />

                <MetricCard
                    title="Out of order"
                    value={
                        formatNumber(
                            metrics.outOfOrderCount,
                            0
                        )
                    }
                />

                <MetricCard
                    title="Incomplete buckets"
                    value={
                        formatNumber(
                            metrics.incompleteBucketCount,
                            0
                        )
                    }
                />

                <MetricCard
                    title="Repair events"
                    value={
                        formatNumber(
                            repairs?.count,
                            0
                        )
                    }
                />
            </section>
        );
    };

export default DatasetQualityMetrics;