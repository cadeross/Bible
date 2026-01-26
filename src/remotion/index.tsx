import { registerRoot, Composition } from 'remotion';
import { PromoVideo } from './PromoVideo';
import '../app/globals.css';

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="PromoVideo"
                component={PromoVideo}
                durationInFrames={450}
                fps={30}
                width={1920}
                height={1080}
            />
        </>
    );
};

registerRoot(RemotionRoot);
