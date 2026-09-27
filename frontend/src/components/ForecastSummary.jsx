import MetricCard from
    "./MetricCard.jsx";

import {
    formatPercent,
} from "../utils/formatters.js";

const ForecastSummary =
    ({
        model,
        protocol,
        validation,
        currentRunIntervalAssessment,
    }) => {
        return (
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title="Model"
                    value={
                        `${model.id}@${model.version}`
                    }
                />

                <MetricCard
                    title="Protocol"
                    value={
                        `${protocol.id}@${protocol.version}`
                    }
                />

                <MetricCard
                    title="Historical runs"
                    value={
                        validation.runCount
                    }
                    subtitle={
                        validation.historicalSeriesStatus
                    }
                />

                <MetricCard
                    title="Current interval coverage"
                    value={
                        formatPercent(
                            currentRunIntervalAssessment
                                ?.coverage
                        )
                    }
                    subtitle="Current run only"
                />
            </section>
        );
    };

export default ForecastSummary;