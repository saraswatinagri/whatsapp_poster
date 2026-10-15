# Saraswati Nagri CRM • WhatsApp Status Poster with Song Integration Guide

This guide explains how to add the **WhatsApp Status Poster with Song & Music Search** feature directly into the **Saraswati Nagri CRM** codebase located at:
`C:\Users\hp\OneDrive\Desktop\Saraswati_nagri`

---

## 1. Why Video is Required for WhatsApp Status with Music

- **WhatsApp Platform Constraint**: WhatsApp statuses only support **Photos (silent)** or **Videos (up to 30s with audio)**.
- A raw image file (`.png` / `.jpg`) shared to WhatsApp cannot carry sound by itself.
- **The Solution**: The client-side video generator compiles the **Poster Image + Selected Song/Audio** into a **1080x1920 HD Status Video (MP4/WebM)** in real time, with the agent's stamped contact plate and an animated music sticker. When shared to WhatsApp, it plays the song automatically as a status story.

---

## 2. Song Selection from External Music Apps (Spotify, Gaana, etc.)

### Is it possible to directly download songs from Spotify or Gaana?
1. **Technical & Legal Realities**:
   - **Spotify & Gaana DRM**: Both platforms protect their entire catalog with Widevine DRM and strict music label licensing. Full song files cannot be extracted, downloaded, or recorded directly into external video files via public web APIs without violating developer terms and licensing.
   - **Spotify Web API**: Provides metadata and search, but does not provide downloadable MP3/AAC audio files to mix into third-party video generators.
   - **Gaana**: Has no public third-party developer API.

2. **The Integrated Multi-Source Solution**:
   - **Live Universal Music Search Engine**:
     - Built-in live search powered by the Apple Music / iTunes indexing engine.
     - Covers **millions of Bollywood, Marathi, Hindi, Devotional, Regional, and International songs** (Arijit Singh, Ajay-Atul, Shreya Ghoshal, Lata Mangeshkar, Marathi Powada, Dhol Tasha, etc.).
     - Streams **authentic 30-second high-fidelity master previews** with zero API keys required and CORS enabled.
     - Automatically decodes into Web Audio and compiles directly into the 15s/30s WhatsApp Status video.
   - **Device Audio Upload (Spotify / Gaana / Reels Downloads)**:
     - Agents who have downloaded or exported MP3/M4A/WAV tracks from Spotify, Gaana, YouTube Music, or Instagram Reels can upload them in 1 click.
   - **Direct Audio Stream URL**:
     - Paste any public audio stream or MP3 cloud link.
   - **Curated Saraswati Nagri Presets**:
     - Instant one-tap access to Saraswati Vandana, Ganesh Dhol Tasha, Royal Maratha, Shubh Muhurat, and Real Estate Chillwave.
   - **Native WhatsApp Music Sticker Workflow**:
     - WhatsApp has Meta's full licensed music library. Agents can click **"Poster Image (PNG)"** to download the stamped poster, open WhatsApp Status, and attach any song directly from WhatsApp's built-in Music sticker!

---

## 3. Files to Copy into `Saraswati_nagri`

Copy the following files from this repository (`whatsapp_poster`) into `Saraswati_nagri`:

1. `src/lib/audioEngine.ts` ➡️ `Saraswati_nagri/src/lib/poster/audio-engine.ts`
2. `src/lib/videoGenerator.ts` ➡️ `Saraswati_nagri/src/lib/poster/video-generator.ts`
3. `src/lib/songLibrary.ts` ➡️ `Saraswati_nagri/src/lib/poster/song-library.ts`
4. `src/lib/musicSearch.ts` ➡️ `Saraswati_nagri/src/lib/poster/music-search.ts`
5. `src/crm-integration/PosterMusicStatusModal.tsx` ➡️ `Saraswati_nagri/src/components/dashboard/PosterMusicStatusModal.tsx`

---

## 4. Modifying `DailyBoard.tsx` in `Saraswati_nagri`

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
  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 text-xs font-semibold transition cursor-pointer"
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

## 5. Alternative: Native WhatsApp In-App Song Sticker

If an agent prefers using WhatsApp's internal music catalog on their phone:
1. Tap **"Poster Image (PNG)"** in the studio to save the stamped high-res poster image.
2. Open **WhatsApp** on mobile ➡️ Go to **Status / Updates** ➡️ Tap camera icon.
3. Select the saved poster from gallery.
4. Tap the **Smiley / Sticker Icon** at the top bar ➡️ Tap **Music**.
5. Pick any song from WhatsApp's music catalog and publish!
