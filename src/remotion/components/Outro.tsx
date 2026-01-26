import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig } from 'remotion';

export const Outro: React.FC = () => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();

    const opacity = interpolate(frame, [0, 30], [0, 1]);
    const fadeOut = interpolate(frame, [durationInFrames - 30, durationInFrames], [1, 0]);

    return (
        <AbsoluteFill style={{ opacity: Math.min(opacity, fadeOut) }} className="bg-zinc-950 flex justify-center items-center text-white">
            <div className="text-center">
                <h1 className="text-7xl font-bold tracking-tighter mb-8">
                    Read the Word.
                </h1>
                <p className="text-2xl text-zinc-400 font-mono">
                    bible.cadeross.dev
                </p>
            </div>
        </AbsoluteFill>
    );
};
