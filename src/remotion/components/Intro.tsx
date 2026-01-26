import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig } from 'remotion';

export const Intro: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const opacity = spring({
        frame,
        fps,
        config: { damping: 200 },
        durationInFrames: 60,
    });

    const scale = spring({
        frame,
        fps,
        from: 0.9,
        to: 1,
        config: { damping: 200 },
        durationInFrames: 60,
    });

    return (
        <AbsoluteFill className="flex justify-center items-center bg-white dark:bg-zinc-950">
            <div style={{ opacity, transform: `scale(${scale})` }} className="text-center">
                <h1 className="text-6xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 mb-4">
                    The Purest Way to Read.
                </h1>
                <p className="text-2xl text-zinc-500 font-light">
                    Only the Word. Nothing else.
                </p>
            </div>
        </AbsoluteFill>
    );
};
