import InfoPanel from
    "./InfoPanel.jsx";

import {
    formatUtcDate,
} from "../utils/formatters.js";

const RunDetails =
    ({
        forecastRun,
        lifecycle,
        validation,
        baselineComparison,
    }) => {
        return (
            <section className="grid gap-6 lg:grid-cols-2">
                <InfoPanel
                    title="Forecast run"
                    rows={[
                        [
                            "Run ID",
                            forecastRun.id,
                        ],

                        [
                            "Issued at",
                            formatUtcDate(
                                forecastRun.issuedAt
                            ),
                        ],

                        [
                            "Input cutoff",
                            formatUtcDate(
                                forecastRun.inputCutoffAt
                            ),
                        ],

                        [
                            "Horizons",
                            forecastRun.horizons.join(
                                ", "
                            ),
                        ],
                    ]}
                />

                <InfoPanel
                    title="Validation"
                    rows={[
                        [
                            "Lifecycle",
                            lifecycle.status,
                        ],

                        [
                            "Historical status",
                            validation.historicalSeriesStatus,
                        ],

                        [
                            "Run count",
                            validation.runCount,
                        ],

                        [
                            "First issue",
                            formatUtcDate(
                                validation.firstIssuedAt
                            ),
                        ],

                        [
                            "Last issue",
                            formatUtcDate(
                                validation.lastIssuedAt
                            ),
                        ],

                        [
                            "Baseline comparison",
                            baselineComparison
                                ? "AVAILABLE"
                                : "NOT AVAILABLE",
                        ],
                    ]}
                />
            </section>
        );
    };

export default RunDetails;