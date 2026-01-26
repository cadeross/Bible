import { AbsoluteFill, Sequence } from 'remotion';
import React from 'react';
import { SceneHook } from './components/SceneHook';
import { SceneUIReveal } from './components/SceneUIReveal';
import { SceneValueProp } from './components/SceneValueProp';
import { SceneOutro } from './components/SceneOutro';
import { COLORS } from './design';

export const PromoVideo: React.FC = () => {
    return (
        <AbsoluteFill style={{ backgroundColor: COLORS.BACKGROUND }}>
            <Sequence from={0} durationInFrames={90}>
                <SceneHook />
            </Sequence>
            <Sequence from={90} durationInFrames={180}>
                <SceneUIReveal />
            </Sequence>
            <Sequence from={270} durationInFrames={90}>
                <SceneValueProp />
            </Sequence>
            <Sequence from={360} durationInFrames={90}>
                <SceneOutro />
            </Sequence>
        </AbsoluteFill>
    );
};
