const StatusBadge =
    ({
        status,
    }) => {
        if (!status) {
            return (
                <span className="text-zinc-500">
                    —
                </span>
            );
        }

        const positive =
            status ===
            "INSIDE";

        return (
            <span
                className={
                    positive
                        ? "rounded-md bg-emerald-950 px-2 py-1 text-xs font-medium text-emerald-400"
                        : "rounded-md bg-amber-950 px-2 py-1 text-xs font-medium text-amber-400"
                }
            >
                {status}
            </span>
        );
    };

export default StatusBadge;