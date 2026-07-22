/**
 * Preset conversations in the popular Cantina genre
 * ("my dog died and my mom sent me this").
 *
 * Each preset ends with the placeholder Cantina clip
 * (`public/sample/cantina-response.mp4`) delivered as a video bubble,
 * plus a closing line after it.
 */

import type {Message} from './types';

export type Preset = {
  id: string;
  title: string;
  description: string;
  /** Displayed in the contact header ("who's it from"). */
  contactName: string;
  /** Messages with ids already assigned (stable within the preset). */
  messages: Message[];
};

const SAMPLE_VIDEO = '/sample/cantina-response.mp4';

const videoMessage = (id: string): Message => ({
  id,
  kind: 'video',
  sender: 'them',
  src: SAMPLE_VIDEO,
  durationSec: 6,
});

export const PRESETS: Preset[] = [
  {
    id: 'dog-died',
    title: 'My dog died',
    description: 'Mom responds to the worst news with a Cantina clip.',
    contactName: 'Mom',
    messages: [
      {id: 'm1', kind: 'text', sender: 'me', text: 'mom'},
      {id: 'm2', kind: 'text', sender: 'me', text: 'MOM'},
      {id: 'm3', kind: 'text', sender: 'them', text: 'what'},
      {id: 'm4', kind: 'text', sender: 'me', text: 'biscuit died'},
      {id: 'm5', kind: 'text', sender: 'them', text: 'WHAT'},
      {id: 'm6', kind: 'text', sender: 'them', text: 'omg no way'},
      {id: 'm7', kind: 'text', sender: 'them', text: 'i made you something'},
      videoMessage('m8'),
      {id: 'm9', kind: 'text', sender: 'them', text: 'he sent you this'},
    ],
  },
  {
    id: 'cat-died',
    title: 'My cat died',
    description: 'Dad processes grief exclusively through Cantina.',
    contactName: 'Dad',
    messages: [
      {id: 'm1', kind: 'text', sender: 'me', text: 'dad the cat died'},
      {id: 'm2', kind: 'text', sender: 'them', text: 'which one'},
      {id: 'm3', kind: 'text', sender: 'me', text: 'we only have one cat'},
      {id: 'm4', kind: 'text', sender: 'them', text: 'oh. whiskers'},
      {id: 'm5', kind: 'text', sender: 'me', text: 'yes whiskers'},
      {id: 'm6', kind: 'text', sender: 'them', text: 'hold on'},
      {id: 'm7', kind: 'text', sender: 'them', text: 'dont be sad watch this'},
      videoMessage('m8'),
      {id: 'm9', kind: 'text', sender: 'them', text: 'feel better champ'},
    ],
  },
  {
    id: 'crashed-car',
    title: "I crashed dad's car",
    description: 'The confession goes about as well as expected.',
    contactName: 'Dad',
    messages: [
      {id: 'm1', kind: 'text', sender: 'me', text: 'dad'},
      {id: 'm2', kind: 'text', sender: 'me', text: 'dont be mad'},
      {id: 'm3', kind: 'text', sender: 'them', text: 'what did you do'},
      {id: 'm4', kind: 'text', sender: 'me', text: 'i crashed your car'},
      {id: 'm5', kind: 'text', sender: 'them', text: 'YOU WHAT'},
      {id: 'm6', kind: 'text', sender: 'me', text: 'its just the bumper kinda'},
      {id: 'm7', kind: 'text', sender: 'them', text: 'youre so grounded'},
      {id: 'm8', kind: 'text', sender: 'them', text: 'but first watch this'},
      videoMessage('m9'),
      {id: 'm10', kind: 'text', sender: 'them', text: 'this is you rn'},
    ],
  },
  {
    id: 'failed-exam',
    title: 'I failed my final exam',
    description: 'Grandma stays supportive in her own way.',
    contactName: 'Grandma',
    messages: [
      {id: 'm1', kind: 'text', sender: 'me', text: 'grandma i failed my final'},
      {id: 'm2', kind: 'text', sender: 'them', text: 'oh no sweetie'},
      {id: 'm3', kind: 'text', sender: 'them', text: 'how bad'},
      {id: 'm4', kind: 'text', sender: 'me', text: 'like a 12%'},
      {id: 'm5', kind: 'text', sender: 'them', text: 'out of what'},
      {id: 'm6', kind: 'text', sender: 'me', text: 'out of 100 grandma'},
      {id: 'm7', kind: 'text', sender: 'them', text: 'well. i made this for you'},
      videoMessage('m8'),
      {id: 'm9', kind: 'text', sender: 'them', text: 'youre still my favorite'},
    ],
  },
  {
    id: 'hamster-died',
    title: 'My hamster died',
    description: 'Mom sends condolences via Cantina, obviously.',
    contactName: 'Mom',
    messages: [
      {id: 'm1', kind: 'text', sender: 'me', text: 'mom nugget died'},
      {id: 'm2', kind: 'text', sender: 'them', text: 'the hamster?'},
      {id: 'm3', kind: 'text', sender: 'me', text: 'yes the hamster'},
      {id: 'm4', kind: 'text', sender: 'them', text: 'hes in a better place'},
      {id: 'm5', kind: 'text', sender: 'me', text: 'hes in the freezer'},
      {id: 'm6', kind: 'text', sender: 'them', text: 'WHAT'},
      {id: 'm7', kind: 'text', sender: 'me', text: 'until the funeral'},
      {id: 'm8', kind: 'text', sender: 'them', text: 'ok well i made you this'},
      videoMessage('m9'),
      {id: 'm10', kind: 'text', sender: 'them', text: 'rip nugget'},
    ],
  },
];
