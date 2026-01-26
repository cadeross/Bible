import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig } from 'remotion';

export const FeaturePureText: React.FC = () => {
    const frame = useCurrentFrame();
    const { height } = useVideoConfig();

    const scrollY = interpolate(frame, [0, 180], [0, -200], {
        extrapolateRight: 'clamp',
    });

    return (
        <AbsoluteFill className="bg-white dark:bg-zinc-950 p-12 overflow-hidden flex flex-row gap-12 text-zinc-900 dark:text-zinc-100">
            {/* Text Content */}
            <div className="flex-1 max-w-2xl mx-auto mt-24">
                <div style={{ transform: `translateY(${scrollY}px)` }} className="space-y-6">
                    <h2 className="text-4xl font-serif font-bold">In the beginning...</h2>
                    <p className="text-2xl font-serif leading-relaxed text-left">
                        1 In the beginning God created heaven, and earth.
                        2 And the earth was void and empty, and darkness was upon the face of the deep; and the spirit of God moved over the waters.
                        3 And God said: Be light made. And light was made.
                        4 And God saw the light that it was good; and he divided the light from the darkness.
                        5 And he called the light Day, and the darkness Night; and there was evening and morning one day.
                        6 And God said: Let there be a firmament made amidst the waters: and let it divide the waters from the waters.
                        7 And God made a firmament, and divided the waters that were under the firmament, from those that were above the firmament, and it was so.
                        8 And God called the firmament, Heaven; and the evening and morning were the second day.
                    </p>
                    <p className="text-2xl font-serif leading-relaxed text-left">
                        9 God also said: Let the waters that are under the heaven, be gathered together into one place: and let the dry land appear. And it was so done.
                        10 And God called the dry land, Earth; and the gathering together of the waters, he called Seas. And God saw that it was good.
                    </p>
                </div>
            </div>

            {/* Overlay Text */}
            <div className="absolute top-0 right-0 p-24 w-1/3 h-full flex items-center justify-end bg-gradient-to-l from-white via-white/80 to-transparent dark:from-zinc-950 dark:via-zinc-950/80">
                <h2 className="text-5xl font-bold tracking-tighter text-right">
                    Distraction Free.
                </h2>
            </div>
        </AbsoluteFill>
    );
};
