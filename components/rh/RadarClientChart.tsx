"use client";

import React from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
} from 'recharts';

interface RadarDataPoint {
    subject: string;
    A: number;
    fullMark: number;
}

interface RadarClientChartProps {
    data: RadarDataPoint[];
}

export function RadarClientChart({ data }: RadarClientChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 4]} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} />
                <Radar
                    name="Performance"
                    dataKey="A"
                    stroke="#4f46e5"
                    fill="#4f46e5"
                    fillOpacity={0.4}
                />
                <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#4f46e5', fontWeight: 600 }}
                />
            </RadarChart>
        </ResponsiveContainer>
    );
}
