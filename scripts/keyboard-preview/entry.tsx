import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {Keyboard} from '../../src/remotion/components/Keyboard';

const KeyboardPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: '#000000'}}>
      <Keyboard
        theme="dark"
        typingText="it was just a prank"
        typingStartFrame={10}
        typingFrames={40}
      />
    </AbsoluteFill>
  );
};

const Root: React.FC = () => {
  return (
    <Composition
      id="KeyboardPreview"
      component={KeyboardPreview}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={90}
    />
  );
};

registerRoot(Root);
