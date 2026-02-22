"use client";

import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';

interface LineDataPoint {
    date: string;
    score: number;
}

interface LineClientChartProps {
    data: LineDataPoint[];
}

export function LineClientChart({ data }: LineClientChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                    dataKey="date"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickMargin={10}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    domain={[0, 4]}
                    ticks={[0, 1, 2, 3, 4]}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                />
                <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ color: '#64748b', fontWeight: 600, fontSize: 12, marginBottom: '4px' }}
                    itemStyle={{ color: '#10b981', fontWeight: 800 }}
                    formatter={(value: number) => [`${value} / 4.0`, 'Nota Diária']}
                />
                {/* Threshold target (2.0) */}
                <ReferenceLine y={2.0} stroke="#f87171" strokeDasharray="3 3" opacity={0.5} />

                <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#10b981"
                    strokeWidth={3}
                    activeDot={{ r: 6, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
                    dot={{ r: 0 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
