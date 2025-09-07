import { useEffect, useRef, useState } from 'react';
import type { Metric } from '~/types';

// Enhanced Line Chart Component
export const LineChart = ({ metric, width, height }: { metric: Metric, width?: number, height?: number }) => {
    // Observe container width to render responsively on mobile/desktop
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState<number | null>(null);

    useEffect(() => {
        if (!containerRef.current || typeof window === 'undefined') return;
        // Initialize with current width
        setContainerWidth(containerRef.current.getBoundingClientRect().width);

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const nextWidth = entry.contentRect.width;
                if (nextWidth > 0) setContainerWidth(nextWidth);
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Base drawing size (scaled by viewBox), fall back to 800x400 for SSR
    const baseWidth = Math.max(320, Math.round((width ?? containerWidth ?? 800)));
    const baseHeight = Math.max(220, Math.round(height ?? (baseWidth * 0.5)));
    if (metric.measurements.length === 0) {
        return (
            <div className="flex items-center justify-center h-96 text-gray-500 dark:text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="text-center">
                    <div className="text-4xl mb-4">📊</div>
                    <p className="text-lg font-medium">No hay datos para mostrar</p>
                    <p className="text-sm mt-2">Agrega algunas mediciones para ver el gráfico</p>
                </div>
            </div>
        );
    }

    // Responsive paddings (slightly tighter on small screens)
    const isNarrow = baseWidth < 480;
    const paddingTop = 16;
    const paddingBottom = 44;
    const paddingLeft = isNarrow ? 40 : 50;
    const paddingRight = 16;
    const chartWidth = baseWidth - paddingLeft - paddingRight;
    const chartHeight = baseHeight - paddingTop - paddingBottom;

    // Sort measurements by date first
    const sortedMeasurements = [...metric.measurements].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const values = sortedMeasurements.map(m => m.value);
    const dates = sortedMeasurements.map(m => new Date(m.date));

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    // Add some padding to the value range for better visualization
    const paddedMin = minValue - (valueRange * 0.1);
    const paddedMax = maxValue + (valueRange * 0.1);
    const paddedRange = paddedMax - paddedMin;

    const minDate = Math.min(...dates.map(d => d.getTime()));
    const maxDate = Math.max(...dates.map(d => d.getTime()));
    const dateRange = maxDate - minDate || 1;

    // Create points
    const points = sortedMeasurements.map((measurement) => {
        const x = paddingLeft + ((new Date(measurement.date).getTime() - minDate) / dateRange) * chartWidth;
        const y = paddingTop + ((paddedMax - measurement.value) / paddedRange) * chartHeight;
        return { x, y, value: measurement.value, date: measurement.date };
    });

    // Create smooth curve path using bezier curves
    const createSmoothPath = (points: Array<{ x: number, y: number, value: number, date: string }>) => {
        if (points.length < 2) return '';

        let path = `M ${points[0].x} ${points[0].y}`;

        for (let i = 1; i < points.length; i++) {
            const x0 = i > 0 ? points[i - 1].x : points[i].x;
            const y0 = i > 0 ? points[i - 1].y : points[i].y;
            const x1 = points[i].x;
            const y1 = points[i].y;

            const cp1x = x0 + (x1 - x0) * 0.5;
            const cp1y = y0;
            const cp2x = x0 + (x1 - x0) * 0.5;
            const cp2y = y1;

            path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x1},${y1}`;
        }

        return path;
    };

    const pathData = createSmoothPath(points);

    // Create gradient area path
    const areaPath = pathData
        ? pathData + ` L ${points[points.length - 1].x} ${baseHeight - paddingBottom}` + ` L ${points[0].x} ${baseHeight - paddingBottom} Z`
        : '';

    // Target line
    const targetY = metric.target ? paddingTop + ((paddedMax - metric.target) / paddedRange) * chartHeight : null;

    // Generate Y-axis labels (5 labels)
    const yAxisLabels = [] as Array<{ value: number; y: number }>;
    for (let i = 0; i <= 4; i++) {
        const ratio = i / 4;
        const value = paddedMin + (paddedRange * (1 - ratio));
        const y = paddingTop + (ratio * chartHeight);
        yAxisLabels.push({ value, y });
    }

    // Generate equidistant X-axis ticks (avoid drawing a line on the very left axis)
    const xTickCount = 5;
    const xAxisTicks = Array.from({ length: xTickCount }, (_, i) => {
        const ratio = xTickCount === 1 ? 0 : i / (xTickCount - 1);
        const x = paddingLeft + ratio * chartWidth;
        const date = new Date(minDate + ratio * dateRange);
        return { x, date };
    });

    // Unique ids per metric to avoid collisions across multiple SVGs
    const idSuffix = (metric.id || 'metric').toString().replace(/[^a-zA-Z0-9_-]/g, '');
    const gradientLineId = `lineGradient-${idSuffix}`;
    const gradientAreaId = `areaGradient-${idSuffix}`;
    const glowId = `glow-${idSuffix}`;

    const fontSize = isNarrow ? 10 : 11;
    const latestDotRadius = isNarrow ? 4.5 : 5;
    const dotRadius = isNarrow ? 3.5 : 4;

    return (
        <div ref={containerRef} className="w-full overflow-hidden">
            <svg viewBox={`0 0 ${baseWidth} ${baseHeight}`} className="w-full h-auto">
                {/* Gradient definitions */}
                <defs>
                    <linearGradient id={gradientLineId} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity="1" />
                    </linearGradient>
                    <linearGradient id={gradientAreaId} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                    </linearGradient>
                    <filter id={glowId}>
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Grid lines - horizontal */}
                {yAxisLabels.map((label, index) => (
                    <line
                        key={`grid-${index}`}
                        x1={paddingLeft}
                        y1={label.y}
                        x2={baseWidth - paddingRight}
                        y2={label.y}
                        stroke={index === yAxisLabels.length - 1 ? "#374151" : "#e5e7eb"}
                        strokeWidth={index === yAxisLabels.length - 1 ? "2" : "1"}
                        opacity={index === yAxisLabels.length - 1 ? "1" : "0.5"}
                        strokeDasharray={index === yAxisLabels.length - 1 ? "0" : "2,2"}
                    />
                ))}

                {/* Vertical grid lines (equidistant, skip the leftmost/rightmost to avoid overlapping axis) */}
                {points.length > 1 && xAxisTicks.slice(1, -1).map((tick, index) => (
                    <line
                        key={`vgrid-${index}`}
                        x1={tick.x}
                        y1={paddingTop}
                        x2={tick.x}
                        y2={baseHeight - paddingBottom}
                        stroke="#e5e7eb"
                        strokeWidth="1"
                        opacity="0.2"
                        strokeDasharray="2,3"
                    />
                ))}

                {/* Target line */}
                {metric.target && targetY && targetY >= paddingTop && targetY <= baseHeight - paddingBottom && (
                    <g>
                        <line
                            x1={paddingLeft}
                            y1={targetY}
                            x2={baseWidth - paddingRight}
                            y2={targetY}
                            stroke="#ef4444"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                            opacity="0.7"
                        />
                        <text
                            x={baseWidth - paddingRight - 5}
                            y={targetY - 5}
                            fill="#ef4444"
                            fontSize={fontSize}
                            textAnchor="end"
                            className="font-medium"
                        >
                            Meta: {metric.target}{metric.unit}
                        </text>
                    </g>
                )}

                {/* Area under the curve */}
                {areaPath && (
                    <path d={areaPath} fill={`url(#${gradientAreaId})`} stroke="none" />
                )}

                {/* Main line */}
                {pathData && (
                    <path
                        d={pathData}
                        fill="none"
                        stroke={`url(#${gradientLineId})`}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter={`url(#${glowId})`}
                    />
                )}

                {/* Data points */}
                {points.map((point, index) => {
                    const isLatest = index === points.length - 1;
                    const isTarget = metric.target && Math.abs(point.value - metric.target) < (valueRange * 0.05);
                    return (
                        <g key={index}>
                            {/* Point */}
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r={isLatest ? `${latestDotRadius}` : `${dotRadius}`}
                                fill={isTarget ? "#10b981" : "#3b82f6"}
                                stroke="white"
                                strokeWidth="2"
                            />
                            {/* Interactive hover area */}
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r="10"
                                fill="transparent"
                                className="cursor-pointer"
                            >
                                <title>{`${new Date(point.date).toLocaleDateString('es-ES', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}: ${point.value}${metric.unit}`}</title>
                            </circle>
                            {/* Latest value label */}
                            {isLatest && (
                                <g>
                                    <rect
                                        x={point.x - 30}
                                        y={point.y - 35}
                                        width="60"
                                        height="24"
                                        rx="4"
                                        fill="#1e40af"
                                        opacity="0.9"
                                    />
                                    <text
                                        x={point.x}
                                        y={point.y - 18}
                                        fill="white"
                                        fontSize={isNarrow ? 11 : 12}
                                        textAnchor="middle"
                                        className="font-semibold"
                                    >
                                        {point.value}{metric.unit}
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                })}

                {/* Y-axis labels */}
                {yAxisLabels.map((label, index) => (
                    <text
                        key={`y-label-${index}`}
                        x={paddingLeft - 10}
                        y={label.y + 4}
                        fill="#6b7280"
                        fontSize={fontSize}
                        textAnchor="end"
                        className="font-medium"
                    >
                        {label.value.toFixed(1)}
                    </text>
                ))}

                {/* X-axis labels aligned with equidistant ticks */}
                {xAxisTicks.map((tick, index) => (
                    <g key={`x-label-${index}`}>
                        <text
                            x={tick.x}
                            y={baseHeight - paddingBottom + 20}
                            fill="#6b7280"
                            fontSize={fontSize}
                            textAnchor={index === 0 ? "start" : index === xTickCount - 1 ? "end" : "middle"}
                            className="font-medium"
                        >
                            {tick.date.toLocaleDateString('es-ES', {
                                month: 'short',
                                day: 'numeric'
                            })}
                        </text>
                    </g>
                ))}

                {/* Left axis line */}
                <line
                    x1={paddingLeft}
                    y1={paddingTop}
                    x2={paddingLeft}
                    y2={baseHeight - paddingBottom}
                    stroke="#374151"
                    strokeWidth="2"
                />

                {/* Unit label on Y axis */}
                <text
                    x={15}
                    y={paddingTop + chartHeight / 2}
                    fill="#6b7280"
                    fontSize={isNarrow ? 11 : 12}
                    textAnchor="middle"
                    transform={`rotate(-90, 15, ${paddingTop + chartHeight / 2})`}
                    className="font-medium"
                >
                    {metric.unit}
                </text>
            </svg>
        </div>
    );
}; 