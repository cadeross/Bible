import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig } from 'remotion';
import { DeviceFrame } from './DeviceFrame';
import { COLORS, FONTS, EASING } from '../design';

export const SceneValueProp: React.FC = () => {
    const frame = useCurrentFrame();

    // Zoom out - scaling down
    // frame 0-90 (9s-12s globally if we considered previous)
    // but this component starts at frame 0 relative to its sequence.

    const scale = interpolate(frame, [0, 60], [1, 0.7], { easing: EASING });
    const translateY = interpolate(frame, [0, 60], [0, 50], { easing: EASING });

    // Floating text labels
    // 1. No Ads
    // 2. No Feeds
    // 3. Just The Word

    const opacity1 = interpolate(frame, [15, 30], [0, 1], { easing: EASING });
    const y1 = interpolate(frame, [15, 30], [20, 0], { easing: EASING });

    const opacity2 = interpolate(frame, [30, 45], [0, 1], { easing: EASING });
    const y2 = interpolate(frame, [30, 45], [20, 0], { easing: EASING });

    const opacity3 = interpolate(frame, [45, 60], [0, 1], { easing: EASING });
    const y3 = interpolate(frame, [45, 60], [20, 0], { easing: EASING });

    const Label: React.FC<{ text: string; opacity: number; y: number; className?: string }> = ({ text, opacity, y, className }) => (
        <div
            style={{
                opacity,
                transform: `translateY(${y}px)`,
                color: COLORS.TEXT,
                fontFamily: FONTS.SERIF
            }}
            className={`absolute text-2xl font-light italic ${className}`}
        >
            {text}
        </div>
    );

    return (
        <AbsoluteFill style={{ backgroundColor: COLORS.BACKGROUND }} className="flex justify-center items-center">

            <div style={{ transform: `scale(${scale}) translateY(${translateY}px)`, width: '400px' }}>
                <DeviceFrame>
                    {/* Simplified UI for "Zoomed out" state */}
                    <div style={{ fontFamily: FONTS.SERIF, color: COLORS.TEXT }} className="p-8 h-full bg-[#fcfcfc]">
                        <h2 className="text-2xl font-bold mb-6 text-center">Psalm 23</h2>
                        <div className="space-y-4 opacity-50 blur-[0.5px]">
                            <div className="h-2 bg-zinc-200 rounded w-full"></div>
                            <div className="h-2 bg-zinc-200 rounded w-5/6"></div>
                            <div className="h-2 bg-zinc-200 rounded w-full"></div>
                            <div className="h-2 bg-zinc-200 rounded w-4/6"></div>
                        </div>
                    </div>
                </DeviceFrame>
            </div>

            {/* Labels positioned relative to the scaled device */}
            <div className="absolute inset-0">
                <Label text="No Ads" opacity={opacity1} y={y1} className="left-1/4 top-1/3" />
                <Label text="No Feeds" opacity={opacity2} y={y2} className="right-1/4 top-1/2" />
                <Label text="Just The Word" opacity={opacity3} y={y3} className="left-1/3 bottom-1/4" />
            </div>

        </AbsoluteFill>
    );
};
