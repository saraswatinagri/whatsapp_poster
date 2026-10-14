# Saraswati Nagri CRM • WhatsApp Status Poster with Song Integration Guide

This guide explains how to add the **WhatsApp Status Poster with Song** feature directly into the **Saraswati Nagri CRM** codebase located at:
`C:\Users\hp\OneDrive\Desktop\Saraswati_nagri`

---

## 1. Why Video is Required for WhatsApp Status with Music

- **WhatsApp Platform Constraint**: WhatsApp statuses only support **Photos (silent)** or **Videos (up to 30s with audio)**.
- A raw image file (`.png` / `.jpg`) shared to WhatsApp cannot carry sound by itself.
- **The Solution**: The client-side video generator compiles the **Poster Image + Selected Song/Audio** into a **1080x1920 HD Status Video (MP4/WebM)** in real time, with the agent's stamped contact plate and an animated music sticker. When shared to WhatsApp, it plays the song automatically as a status story.

---

## 2. Files to Copy into `Saraswati_nagri`

Copy the following files from this repository (`whatsapp_poster`) into `Saraswati_nagri`:

1. `src/lib/audioEngine.ts` ➡️ `Saraswati_nagri/src/lib/poster/audio-engine.ts`
2. `src/lib/videoGenerator.ts` ➡️ `Saraswati_nagri/src/lib/poster/video-generator.ts`
3. `src/lib/songLibrary.ts` ➡️ `Saraswati_nagri/src/lib/poster/song-library.ts`
4. `src/crm-integration/PosterMusicStatusModal.tsx` ➡️ `Saraswati_nagri/src/components/dashboard/PosterMusicStatusModal.tsx`

---

## 3. Modifying `DailyBoard.tsx` in `Saraswati_nagri`

In `Saraswati_nagri/src/components/dashboard/DailyBoard.tsx`:

### Step 1: Import the modal
```tsx
import { PosterMusicStatusModal } from './PosterMusicStatusModal';
```

### Step 2: Add State inside `PostCard`
```tsx
const [musicModalOpen, setMusicModalOpen] = useState(false);
```

### Step 3: Add the Button in `PostCard` Action Row
Next to the existing WhatsApp share and download buttons:
```tsx
<button
  onClick={() => setMusicModalOpen(true)}
  title="Create WhatsApp Status with Song"
  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs font-semibold transition"
>
  <span>🎵</span>
  <span>Music Status</span>
</button>
```

### Step 4: Render the Modal
```tsx
{musicModalOpen && (
  <PosterMusicStatusModal
    isOpen={musicModalOpen}
    onClose={() => setMusicModalOpen(false)}
    posterUrl={displayUrl}
    posterTitle={post.title}
    projectName={post.projectName}
    agentName={currentUser?.name || ''}
    agentPhone={currentUser?.officePhone || currentUser?.phone || ''}
    agentRole={currentUser?.role === 'Referral Partner' ? 'Referral Partner' : 'Sales Executive'}
  />
)}
```

---

## 4. Alternative: Native WhatsApp In-App Song Sticker

If an agent prefers using WhatsApp's internal music catalog on their phone:
1. Tap **Download** in CRM to save the stamped high-res poster image.
2. Open **WhatsApp** on mobile ➡️ Go to **Status / Updates** ➡️ Tap camera icon.
3. Select the saved poster from gallery.
4. Tap the **Smiley / Sticker Icon** at the top bar ➡️ Tap **Music**.
5. Pick any song from WhatsApp's music catalog and publish!
