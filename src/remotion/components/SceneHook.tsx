import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, random } from 'remotion';
import { COLORS, FONTS, EASING } from '../design';

export const SceneHook: React.FC = () => {
    const frame = useCurrentFrame();

    // Noise Animation (0-90 frames)
    // "Noise" text jitters and dissolves
    // "Find Focus" fades in

    const noiseOpacity = interpolate(frame, [0, 45], [1, 0], { easing: EASING });

    // Random jitter for "Noise"
    const jitterX = random(frame) * 4 - 2;
    const jitterY = random(frame + 100) * 4 - 2;

    const focusOpacity = interpolate(frame, [45, 90], [0, 1], { easing: EASING, extrapolateLeft: 'clamp' });
    const focusTranslateY = interpolate(frame, [45, 90], [20, 0], { easing: EASING, extrapolateLeft: 'clamp' });

    return (
        <AbsoluteFill style={{ backgroundColor: COLORS.BACKGROUND, fontFamily: FONTS.SANS }}>
            <AbsoluteFill className="flex items-center justify-center">
                {/* NOISE */}
                <div
                    style={{
                        opacity: noiseOpacity,
                        transform: `translate(${jitterX}px, ${jitterY}px)`,
                        color: COLORS.TEXT,
                        fontFamily: FONTS.SERIF
                    }}
                    className="text-6xl font-bold tracking-tight opacity-50 blur-[1px]"
                >
                    Noise.
                </div>

                {/* FIND FOCUS */}
                <div
                    style={{
                        opacity: focusOpacity,
                        transform: `translateY(${focusTranslateY}px)`,
                        color: COLORS.TEXT,
                        fontFamily: FONTS.SANS
                    }}
                    className="absolute text-5xl font-light tracking-wide uppercase"
                >
                    Find Focus
                </div>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
