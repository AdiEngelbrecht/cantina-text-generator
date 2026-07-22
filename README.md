# ClipFarm × Cantina Generator

Make viral fake-iMessage videos for the Cantina clipping campaign — the "my dog died and my mom sent me this" genre. The app turns a fake text conversation into a 1080x1920, 30fps mp4 where your Cantina response video shows up as a video message bubble, with the Gymnopédie TikTok audio as the soundtrack from the first frame.

## Quickstart

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Making a clip (5 steps)

1. **Upload your Cantina clip** — the response video you made in the Cantina app. It will appear inside the chat as a video message bubble.
2. **Add a hook video (optional)** — a crying/reaction clip that plays before the chat. Source clips from the [crying hooks Drive folder](https://drive.google.com/drive/folders/1suQPzPFb0i_6ATiABZsLOCMG2-AYYJqn?usp=sharing), caption in CapCut first (captions look better that way), then pick it from the `public/hooks` library or upload it, and trim it here.
3. **Write the fake conversation** — type the messages, pick a preset to start from, or mix both. Blue bubbles on the right are "me", gray bubbles on the left are "them". The video message always comes from "them".
4. **Set the contact name** — who's it from: Mom, Dad, Grandma... it shows in the chat header with their avatar.
5. **Pick the sound** — Gymnopédie Piano, the viral TikTok audio. It plays as the soundtrack through the whole video from the start, hook included (or choose None).

Watch the live preview, hit **Render**, and download your mp4.

### TikTok boost tip

Posting on TikTok? For maximum reach, attach the sound **inside TikTok** from the original audio page instead of relying on the baked-in mp3: [Gymnopédie solo piano — original sound](https://www.tiktok.com/music/Classic-classical-gymnopedie-solo-piano-1034554-6974451099088455681). Using the exact trending sound link helps the algorithm push the video. Posting anywhere else (Reels, Shorts)? The bundled "Gymnopédie Piano" option is the same audio and is already in your render.

## Genre tips

- Hook in the first message: "mom" / "MOM" / "dad dont be mad". Lowercase, short, typos welcome — it has to feel real.
- Keep it 6–12 messages. Longer conversations lose people before the reveal.
- The setup is a tragedy ("the dog died", "i crashed your car", "i failed my final") and the punchline is that they respond with a Cantina video.
- Classic format: *"my dog died and my mom sent me this"* — post the video with that caption.
- End with a closing line after the video bubble ("he sent you this", "rip nugget") so the sound and the absurdity land.

## For developers

- `npm run dev` — Next.js editor + live preview at http://localhost:3000.
- `npm run studio` — Remotion Studio for the `ConversationVideo` composition.
- The sample clip `public/sample/cantina-response.mp4` is a placeholder rendered from `scripts/make-sample/`:
  ```bash
  npx remotion render scripts/make-sample/entry.ts SampleClip public/sample/cantina-response.mp4
  ```

### Architecture

- `src/lib/types.ts` and `src/lib/timing.ts` are the shared contract: `ConversationProps`, `Message`, and the frame-accurate timeline (`getTimeline`) drive the Remotion composition, the live preview, and the render API identically.
- `src/remotion/` — the `ConversationVideo` composition (iOS Messages dark-mode look: typing indicator, keyboard, read receipts).
- `src/app/` — the editor UI, upload endpoint, and render API.
- `public/sounds/` — `gymnopedie-piano.mp3`, the viral TikTok audio (the only punchline sound).
- `public/sample/` — the placeholder Cantina clip used by presets.
- `public/uploads/` — where clipper uploads land.
