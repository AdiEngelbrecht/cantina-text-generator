# ClipFarm × Cantina Generator

Make viral fake-iMessage videos for the Cantina clipping campaign — the "my dog died and my mom sent me this" genre. The app turns a fake text conversation into a 1080x1920, 30fps mp4 where your Cantina response video shows up as a video message bubble, with the Gymnopédie TikTok audio as the soundtrack from the first frame.

## Quickstart

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Making a clip (7 steps)

1. **Upload your Cantina clip** — the response video you made in the Cantina app. It appears inside the chat as a video message bubble. Keep "Play Cantina app scene" checked to open the video with the fake Cantina app: the clip pops into the composer, your prompt types out, and the Generating modal plays before the reveal.
2. **Add a hook video (optional)** — a crying/reaction clip that plays before everything. Source clips from the [crying hooks Drive folder](https://drive.google.com/drive/folders/1suQPzPFb0i_6ATiABZsLOCMG2-AYYJqn?usp=sharing), caption in CapCut first (captions look better that way), then pick it from the `public/hooks` library or upload it. Trim it and add a slow Ken Burns zoom here.
3. **Write the fake conversation** — build it in the chat canvas (drag bubbles to reorder, tapback reactions, emoji), pick a preset, or flip to **Paste script** and drop a whole script at once: `me: ...` / `them: ...` per line, `react: ❤️` to react to the previous message, `[video]` where the Cantina clip goes.
4. **Set the contact** — name, avatar photo (optional), the clock time on the phone, and the unread count on the back button.
5. **Timing & chat sounds** — how fast "you" type, how slow "they" reply, and whether the iMessage send/receive blips play.
6. **Pick the sound** — Gymnopédie Piano, the viral TikTok audio. It plays as the soundtrack through the whole video from the start, hook included (or choose None).
7. **Render** — watch the live preview, hit Render, and the mp4 is created right in your browser and saved to your device.

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
- Hook library: drop `.mp4`/`.mov`/`.webm` clips into `public/hooks/`, then regenerate the manifest before deploying:
  ```bash
  node scripts/update-hooks-manifest.mjs
  ```
  This writes `public/hooks/manifest.json`, which the editor fetches at runtime — there is no server API to list clips.

### Architecture

The app runs **fully client-side** — no server APIs, no server storage. It deploys to Vercel (or any static/edge host) as-is.

- **Uploads never leave the browser.** Picked videos become `blob:` object URLs (`URL.createObjectURL`) that the preview and renderer use directly. Duration is measured client-side via a temporary `<video>` element. Object URLs intentionally don't survive reloads.
- **Rendering happens in the browser** via `@remotion/web-renderer` (WebCodecs). The finished mp4 is handed to the user as a blob URL download — nothing is rendered or stored on a server.
- `src/lib/types.ts` and `src/lib/timing.ts` are the shared contract: `ConversationProps`, `Message`, and the frame-accurate timeline (`getTimeline`) drive the Remotion composition, the live preview, and the client-side render identically.
- `src/remotion/` — the `ConversationVideo` composition (iOS Messages dark-mode look: typing indicator, keyboard, read receipts).
- `src/app/` — the editor UI only (no API routes).
- `public/sounds/` — `gymnopedie-piano.mp3`, the viral TikTok audio (the only punchline sound).
- `public/sample/` — the placeholder Cantina clip used by presets.
- `public/hooks/` — the hook clip library, indexed by `manifest.json` (see above).
