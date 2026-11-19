import { useEffect, useState } from "react";
import { getLocalHour } from "@/utils/sun";

const UPDATE_INTERVAL = 60_000;

// The visitor's local time of day in fractional hours, refreshed every minute
export function useLocalHour(): number {
    const [hour, setHour] = useState(() => getLocalHour(new Date()));

    useEffect(() => {
        const id = setInterval(
            () => setHour(getLocalHour(new Date())),
            UPDATE_INTERVAL
        );
        return () => clearInterval(id);
    }, []);

    return hour;
}
