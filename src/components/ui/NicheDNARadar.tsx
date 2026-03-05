import React from 'react';
import { cn } from '../../lib/utils';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';

export function NicheDNARadar({ data }: { data: { subject: string, value: number }[] }) {
    return (
        <div className="h-full w-full" style={{ minHeight: '200px', minWidth: '0' }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={200} minWidth={0}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: 'bold' }}
                    />
                    <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={false}
                        axisLine={false}
                    />
                    <Radar
                        name="Niche DNA"
                        dataKey="value"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.5}
                        animationDuration={1500}
                    />
                    <Tooltip
                        wrapperStyle={{ zIndex: 50 }}
                        allowEscapeViewBox={{ x: false, y: true }}
                        contentStyle={{
                            backgroundColor: '#1a1a1a',
                            border: `1px solid rgba(255,255,255,0.1)`,
                            fontSize: '10px',
                            fontFamily: 'monospace',
                            borderRadius: '0px'
                        }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
