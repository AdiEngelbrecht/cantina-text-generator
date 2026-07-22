import React from 'react';
import {CalculateMetadataFunction, Composition} from 'remotion';
import {ConversationProps, DEFAULT_PROPS} from '../lib/types';
import {FPS, VIDEO_HEIGHT, VIDEO_WIDTH, getTimeline} from '../lib/timing';
import {ConversationVideo} from './ConversationVideo';

const calculateMetadata: CalculateMetadataFunction<ConversationProps> = ({
  props,
}) => {
  return {
    durationInFrames: getTimeline(props).totalFrames,
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ConversationVideo"
      component={ConversationVideo}
      durationInFrames={getTimeline(DEFAULT_PROPS).totalFrames}
      fps={FPS}
      width={VIDEO_WIDTH}
      height={VIDEO_HEIGHT}
      defaultProps={DEFAULT_PROPS}
      calculateMetadata={calculateMetadata}
    />
  );
};
