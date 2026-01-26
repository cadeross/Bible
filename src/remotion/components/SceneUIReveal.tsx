import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { DeviceFrame } from './DeviceFrame';
import { COLORS, FONTS, EASING } from '../design';

export const SceneUIReveal: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Device slides up
    const deviceY = interpolate(frame, [0, 60], [1000, 0], { easing: EASING });

    // Inner Scroll
    const scrollY = interpolate(frame, [60, 240], [0, -400], { easing: EASING });

    // Highlight
    const highlightOpacity = interpolate(frame, [120, 160], [0, 1], { easing: EASING });

    return (
        <AbsoluteFill style={{ backgroundColor: COLORS.BACKGROUND }} className="flex justify-center items-center">

            <div style={{ transform: `translateY(${deviceY}px)`, width: '400px' }}>
                <DeviceFrame>
                    <div style={{ fontFamily: FONTS.SERIF, color: COLORS.TEXT }} className="p-8 h-[200%] leading-loose text-lg">
                        <div style={{ transform: `translateY(${scrollY}px)` }}>
                            <h2 className="text-2xl font-bold mb-6 text-center">Psalm 23</h2>
                            <p className="mb-6">
                                1 The Lord is my shepherd; I shall not want.
                            </p>
                            <p className="mb-6 relative">
                                <span
                                    style={{ backgroundColor: COLORS.ACCENT, opacity: highlightOpacity * 0.2 }}
                                    className="absolute -inset-2 rounded-lg"
                                />
                                2 He maketh me to lie down in green pastures: he leadeth me beside the still waters.
                            </p>
                            <p className="mb-6">
                                3 He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake.
                            </p>
                            <p className="mb-6">
                                4 Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.
                            </p>
                            <p className="mb-6">
                                5 Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.
                            </p>
                            <p className="mb-6">
                                6 Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the Lord for ever.
                            </p>
                        </div>
                    </div>
                </DeviceFrame>
            </div>

        </AbsoluteFill>
    );
};
