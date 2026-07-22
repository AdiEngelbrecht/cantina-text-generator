import {Composition} from 'remotion';
import {SampleClip} from './SampleClip';

export const SampleRoot = () => {
  return (
    <Composition
      id="SampleClip"
      component={SampleClip}
      durationInFrames={180}
      fps={30}
      width={720}
      height={1280}
    />
  );
};
