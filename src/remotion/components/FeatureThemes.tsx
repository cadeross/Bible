import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, interpolateColors, useVideoConfig } from 'remotion';

export const FeatureThemes: React.FC = () => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();

    const bgColor = interpolateColors(
        frame,
        [0, 60, 120, 180],
        ['#ffffff', '#18181b', '#fefce8', '#ffffff']
    );

    const textColor = interpolateColors(
        frame,
        [0, 60, 120, 180],
        ['#18181b', '#f4f4f5', '#713f12', '#18181b']
    );

    return (
        <AbsoluteFill style={{ backgroundColor: bgColor }} className="flex justify-center items-center">
            <div className="flex flex-row items-center gap-24">
                <div style={{ color: textColor }} className="text-left max-w-lg">
                    <h3 className="text-4xl font-bold mb-4">Themes</h3>
                    <p className="text-2xl font-serif">
                        Customize your reading experience with beautiful themes designed for any time of day.
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="w-16 h-16 rounded-full bg-white border-4 border-zinc-200 shadow-lg"></div>
                    <div className="w-16 h-16 rounded-full bg-zinc-950 border-4 border-zinc-700 shadow-lg"></div>
                    <div className="w-16 h-16 rounded-full bg-yellow-50 border-4 border-yellow-200 shadow-lg"></div>
                </div>
            </div>

            <div className="absolute bottom-24 w-full text-center">
                <h2 style={{ color: textColor }} className="text-4xl font-bold tracking-widest uppercase">
                    Personalized
                </h2>
            </div>
        </AbsoluteFill>
    );
};
