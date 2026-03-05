import React from 'react';
import { cn } from '../../lib/utils';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, ReferenceLine } from 'recharts';
import { RetentionLeak } from '../../types';

export function RetentionGraph({ leaks }: { leaks: RetentionLeak[] }) {
    const data = Array.from({ length: 61 }, (_, i) => {
        // Base decay: starts at 100, decays to ~40% over 60s
        let original = 100 * Math.pow(0.985, i);

        // Apply drops for leaks
        leaks.forEach(leak => {
            if (i >= leak.timestamp) {
                // The drop should be more pronounced at the exact timestamp
                const dropFactor = i === leak.timestamp ? 8 : 5;
                original -= dropFactor;
            }
        });

        // Ensure it doesn't go below 5%
        original = Math.max(original, 5);

        // Improved: starts at 100, decays to ~70% over 60s
        const improved = 100 * Math.pow(0.994, i);

        return {
            time: i,
            original: Math.round(original),
            improved: Math.round(improved),
        };
    });

    return (
        <div className="h-64 w-full" style={{ minHeight: '250px', minWidth: '0' }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={200} minWidth={0}>
                <LineChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                        dataKey="time"
                        stroke="rgba(255,255,255,0.4)"
                        fontSize={10}
                        tickFormatter={(val) => `${val}s`}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        stroke="rgba(255,255,255,0.4)"
                        fontSize={10}
                        tickFormatter={(val) => `${val}%`}
                        domain={[0, 100]}
                        axisLine={false}
                        tickLine={false}
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
                        itemStyle={{ padding: '2px 0' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="original"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={false}
                        name="Original Script"
                        animationDuration={1500}
                    />
                    <Line
                        type="monotone"
                        dataKey="improved"
                        stroke="#10b981"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Improved Script"
                        animationDuration={1500}
                    />
                    {leaks.map((leak, idx) => (
                        <ReferenceLine
                            key={idx}
                            x={leak.timestamp}
                            stroke="#ef4444"
                            strokeDasharray="3 3"
                            label={{
                                value: '!',
                                position: 'top',
                                fill: '#ef4444',
                                fontSize: 12,
                                fontWeight: 'bold'
                            }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
