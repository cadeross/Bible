import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

export const FeatureFocusMode: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const dimming = interpolate(frame, [0, 60], [1, 0], {
        extrapolateRight: 'clamp',
    });

    const uiOpacity = spring({
        frame,
        fps,
        to: 0,
        config: { damping: 200 },
        durationInFrames: 60,
    });

    const textScale = spring({
        frame,
        fps,
        from: 1,
        to: 1.1,
        config: { damping: 200 },
        delay: 30,
    });

    return (
        <AbsoluteFill className="bg-zinc-50 dark:bg-zinc-900 flex justify-center items-center">

            {/* Background UI Elements simulating distraction */}
            <div style={{ opacity: uiOpacity }} className="absolute inset-0 p-8 flex justify-between items-start">
                <div className="w-12 h-12 bg-zinc-200 rounded-full"></div>
                <div className="flex gap-4">
                    <div className="w-24 h-8 bg-zinc-200 rounded"></div>
                    <div className="w-8 h-8 bg-zinc-200 rounded-full"></div>
                </div>
            </div>
            <div style={{ opacity: uiOpacity }} className="absolute bottom-0 inset-x-0 p-8 flex justify-center">
                <div className="w-64 h-12 dashed border-2 border-zinc-200 rounded-lg"></div>
            </div>

            {/* Main Content */}
            <div style={{ transform: `scale(${textScale})` }} className="max-w-xl text-center p-12 transition-colors duration-500">
                <p className="text-3xl font-serif text-zinc-900 border-l-4 border-red-500 pl-6 italic">
                    "Be still, and know that I am God."
                </p>
                <div className="mt-4 text-sm text-zinc-400 font-sans uppercase tracking-widest">
                    Psalm 46:10
                </div>
            </div>

            {/* Focus Mode Label */}
            <AbsoluteFill className="justify-center items-center pointer-events-none">
                <h2 style={{ opacity: 1 - uiOpacity, transform: `translateY(${interpolate(frame, [0, 60], [20, 0])}px)` }} className="text-6xl font-bold text-zinc-900 dark:text-zinc-50 mt-96">
                    Focus Mode
                </h2>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
