# Saraswati Nagri CRM • Media Library & WhatsApp Song Poster Studio

A dedicated, high-performance web application tailored for **Saraswati Nagri Group (Nagpur)** that focuses exclusively on the **Media Library** module: creating, customizing, and sharing high-resolution daily posters and 1080x1920 WhatsApp Status Videos with background music.

---

## 🪷 Key Features

### 1. 100% Focused Media Library Navigation
Removed all unrelated CRM sections to provide a streamlined, distraction-free Media Library experience matching `crm.saraswatinagri.com`:
- 📌 **Daily Poster Board**: Live daily poster feed synced directly with Supabase CRM, one-click branded download with agent contact plate, and bilingual WhatsApp sharing.
- 🎵 **WhatsApp Song Studio**: Interactive smartphone status studio with customizable music sticker, real-time waveform overlay, Ken Burns motion effects, and 15s/30s duration trimming.
- 📸 **Daily Layout Media**: Nagpur project site photography (sanctioned cement roads, grand entrance arches, boundary stones, demarcation, drone surveys).
- 📁 **Project Legal Documents**: Instant access to NMRDA sanctioned RL maps, 7/12 land records, MahaRERA certificates, and Collector NA sanction orders.

### 2. Live Song Search & Custom Song Import
Easily attach any song to your WhatsApp status:
- **Live Universal Music Search**: Search millions of songs across Bollywood, Marathi, Hindi, Devotional, and Trending charts (Ajay-Atul, Arijit Singh, Shreya Ghoshal, Lata Mangeshkar) with instant 30s master audio previews.
- **Audio Files from Device (Spotify / Gaana Downloads)**: Import MP3, WAV, M4A, or AAC files downloaded or exported from Spotify, Gaana, YouTube Music, Instagram Reels, or WhatsApp Audio.
- **Direct Audio URLs**: Paste public audio stream or MP3 URLs with real-time Web Audio API decoding.
- **Curated Regional & Devotional Presets**: Quick 1-tap access to Saraswati Vandana, Ganesh Mangalmurti Dhol Tasha, Shivrajyabhishek Powada, Deva Shree Ganesha, Mauli Mauli, Shubh Muhurat, and Modern Real Estate Chillwave.
- **Audio Trimmer & Chorus Scrubber**: Select 15s or 30s status duration limits and scrub to the exact hook or drop with live audio audition.
- **Native WhatsApp Music Sticker Support**: 1-click stamped poster image export for agents using WhatsApp's in-app music sticker catalog.

### 3. Automated 1080x1920 HD WhatsApp Status Video Generator
WhatsApp statuses require video format to carry sound. The client-side video generator compiles:
1. High-resolution 9:16 vertical poster canvas
2. Selected song audio track (Web Audio API destination stream)
3. Stamped Agent Contact Plate (Name, Phone, Role, Enquire Now badge)
4. Translucent glassmorphic WhatsApp music sticker with animated soundbars
5. Optional Ken Burns zoom and sparkle particle effects
Directly outputs an MP4/WebM video ready to post to WhatsApp Status or share with clients!

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or pnpm

### Installation
```bash
# Clone the repository
git clone https://github.com/saraswatinagri/whatsapp_poster.git
cd whatsapp_poster

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
npm run dev
```

### Build for Production
```bash
npm run build
```

---

## 🛠 Tech Stack
- **Framework**: React 19, TypeScript
- **Bundler**: Vite 8
- **Audio & Video Engine**: Web Audio API, Canvas 2D API, MediaRecorder API
- **Styling**: Tailwind CSS & Glassmorphism
- **Backend Sync**: Supabase Client (PostgreSQL)
- **Icons**: Lucide React
