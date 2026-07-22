import type {VideoTheme} from '../../lib/types';

/** Color palette for the iOS Messages look, per theme. */
export type Palette = {
  background: string;
  headerText: string;
  secondaryText: string;
  mineBubble: string;
  mineText: string;
  theirsBubble: string;
  theirsText: string;
  typingBubble: string;
  typingDot: string;
  statusBar: string;
  hairline: string;
  dynamicIsland: string;
  dynamicIslandBorder: string;
};

export const IOS_BLUE = '#0A84FF';

export const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif, "Apple Color Emoji"';

export const getPalette = (theme: VideoTheme): Palette =>
  theme === 'dark'
    ? {
        background: '#000000',
        headerText: '#FFFFFF',
        secondaryText: '#8E8E93',
        mineBubble: IOS_BLUE,
        mineText: '#FFFFFF',
        theirsBubble: '#26262A',
        theirsText: '#FFFFFF',
        typingBubble: '#26262A',
        typingDot: '#9A9AA0',
        statusBar: '#FFFFFF',
        hairline: '#2C2C2E',
        dynamicIsland: 'linear-gradient(180deg, #17171A 0%, #0A0A0C 100%)',
        dynamicIslandBorder: '1px solid rgba(255,255,255,0.07)',
      }
    : {
        background: '#FFFFFF',
        headerText: '#000000',
        secondaryText: '#6E6E73',
        mineBubble: IOS_BLUE,
        mineText: '#FFFFFF',
        theirsBubble: '#E9E9EB',
        theirsText: '#000000',
        typingBubble: '#E9E9EB',
        typingDot: '#8E8E93',
        statusBar: '#000000',
        hairline: '#D1D1D6',
        dynamicIsland: '#000000',
        dynamicIslandBorder: 'none',
      };
