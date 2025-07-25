import { useEffect, useRef } from "react";

export function usePerformanceMonitor(componentName: string, pageName: string) {
  const renderStartTime = useRef<number>(0);

  useEffect(() => {
    // Record render start time
    renderStartTime.current = performance.now();

    return () => {
      // Record render end time when component unmounts
      const renderDuration =
        (performance.now() - renderStartTime.current) / 1000;

      // Send metric to backend
      fetch("/api/metrics/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metric: "react_component_render_duration_seconds",
          value: renderDuration,
          labels: {
            component_name: componentName,
            page: pageName,
          },
        }),
      }).catch(console.error);
    };
  }, [componentName, pageName]);
}
