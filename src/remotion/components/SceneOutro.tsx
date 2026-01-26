import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { COLORS, FONTS, EASING } from '../design';

export const SceneOutro: React.FC = () => {
    const frame = useCurrentFrame();

    // Scene transition: Previous content fades out, App Name scales in

    const scale = interpolate(frame, [0, 45], [1.2, 1], { easing: EASING });
    const opacity = interpolate(frame, [0, 30], [0, 1], { easing: EASING });

    // CTA Button
    const btnOpacity = interpolate(frame, [30, 60], [0, 1], { easing: EASING });
    const btnY = interpolate(frame, [30, 60], [20, 0], { easing: EASING });

    return (
        <AbsoluteFill style={{ backgroundColor: COLORS.BACKGROUND, fontFamily: FONTS.SANS }} className="flex justify-center items-center flex-col">

            {/* App Name */}
            <div style={{ opacity, transform: `scale(${scale})`, color: COLORS.TEXT }} className="text-center mb-8">
                <div style={{ fontFamily: FONTS.SERIF }} className="text-6xl font-bold tracking-tight mb-2">
                    Bible
                </div>
                <div className="text-xl text-zinc-500 tracking-widest uppercase">
                    Pure Reading
                </div>
            </div>

            {/* CTA Button */}
            <div
                style={{ opacity: btnOpacity, transform: `translateY(${btnY}px)` }}
                className="bg-[#2D2D2D] text-[#F9F8F4] px-8 py-3 rounded-full text-lg font-medium tracking-wide shadow-lg"
            >
                Read Now at bible.cadeross.dev
            </div>

        </AbsoluteFill>
    );
};
