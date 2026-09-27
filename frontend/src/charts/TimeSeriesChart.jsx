import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import {
    formatNumber,
    formatShortUtcDate,
    formatUtcDate,
} from "../utils/formatters.js";

const TimeSeriesChart =
    ({
        data,
        lines,
        xKey = "issuedAt",
        height = 360,
    }) => {
        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {
            return (
                <div className="flex min-h-48 items-center justify-center text-sm text-zinc-500">
                    Historical series unavailable.
                </div>
            );
        }

        return (
            <div
                style={{
                    height,
                }}
            >
                <ResponsiveContainer
                    width="100%"
                    height="100%"
                >
                    <LineChart
                        data={data}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#27272a"
                        />

                        <XAxis
                            dataKey={xKey}
                            minTickGap={35}
                            tickFormatter={
                                formatShortUtcDate
                            }
                            tick={{
                                fill:
                                    "#a1a1aa",
                                fontSize:
                                    12,
                            }}
                        />

                        <YAxis
                            width={75}
                            tickFormatter={
                                (value) =>
                                    formatNumber(
                                        value,
                                        4
                                    )
                            }
                            tick={{
                                fill:
                                    "#a1a1aa",
                                fontSize:
                                    12,
                            }}
                        />

                        <Tooltip
                            labelFormatter={
                                formatUtcDate
                            }
                            formatter={
                                (value, name) => [
                                    formatNumber(
                                        value
                                    ),
                                    name,
                                ]
                            }
                            contentStyle={{
                                background:
                                    "#18181b",
                                border:
                                    "1px solid #3f3f46",
                                borderRadius:
                                    "8px",
                            }}
                        />

                        <Legend />

                        {lines.map(
                            (line) => (
                                <Line
                                    key={
                                        line.dataKey
                                    }
                                    type="monotone"
                                    dataKey={
                                        line.dataKey
                                    }
                                    name={
                                        line.name
                                    }
                                    stroke={
                                        line.stroke
                                    }
                                    strokeWidth={2}
                                    dot={false}
                                />
                            )
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        );
    };

export default TimeSeriesChart;