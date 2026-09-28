import { useEffect, useRef } from "react";

// Calls `fn` immediately and then every `intervalMs` while the tab is visible,
// and once more when the tab becomes visible again. Always calls the latest `fn`.
export function usePolling(fn: () => void, intervalMs: number, deps: React.DependencyList = []) {
    const fnRef = useRef(fn);
    useEffect(() => {
        fnRef.current = fn;
    });

    useEffect(() => {
        const tick = () => {
            if (document.visibilityState === "visible") fnRef.current();
        };
        fnRef.current();
        const intervalId = setInterval(tick, intervalMs);
        document.addEventListener("visibilitychange", tick);
        return () => {
            clearInterval(intervalId);
            document.removeEventListener("visibilitychange", tick);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [intervalMs, ...deps]);
}
