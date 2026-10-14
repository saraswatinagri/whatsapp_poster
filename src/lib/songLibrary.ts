import { SongTrack } from '../types';

export const PRESET_SONGS: SongTrack[] = [
  {
    id: 'saraswati-vandana',
    title: 'Saraswati Vandana • Divine Flute',
    artist: 'Pt. Hariprasad Style Bansuri & Tanpura',
    genre: 'Devotional',
    durationSec: 45,
    bpm: 78,
    synthesizerType: 'saraswati_flute',
    color: '#E0457B',
    albumArt: '🪷',
  },
  {
    id: 'ganesh-mangalmurti',
    title: 'Ganesh Mangalmurti • Dhol Tasha',
    artist: 'Nagpur Shivgarjana Rhythm & Tashya',
    genre: 'Festive',
    durationSec: 40,
    bpm: 107,
    synthesizerType: 'ganesh_dhol',
    color: '#E07B3A',
    albumArt: '🥁',
  },
  {
    id: 'maratha-powada',
    title: 'Shivrajyabhishek • Royal Maratha',
    artist: 'Veer Ras Tutari & Nagara',
    genre: 'Trending',
    durationSec: 35,
    bpm: 118,
    synthesizerType: 'maratha_beat',
    color: '#D4AF37',
    albumArt: '🚩',
  },
  {
    id: 'deva-shree-ganesha',
    title: 'Deva Shree Ganesha • Shankh & Dhol',
    artist: 'Devotional Celebration Beat',
    genre: 'Devotional',
    durationSec: 42,
    bpm: 110,
    synthesizerType: 'ganesh_dhol',
    color: '#F97316',
    albumArt: '🌺',
  },
  {
    id: 'mauli-mauli',
    title: 'Mauli Mauli • Vitthal Wari Chime',
    artist: 'Pandharpur Bhakti Rhythm',
    genre: 'Devotional',
    durationSec: 45,
    bpm: 88,
    synthesizerType: 'saraswati_flute',
    color: '#A855F7',
    albumArt: '🕉️',
  },
  {
    id: 'shankh-devotional',
    title: 'Shankhnaad & Temple Bells',
    artist: 'Divine Morning Shlok Chimes',
    genre: 'Devotional',
    durationSec: 30,
    bpm: 65,
    synthesizerType: 'shankh_devotional',
    color: '#8B5CF6',
    albumArt: '🔔',
  },
  {
    id: 'festive-diwali',
    title: 'Shubh Muhurat • Celebration Beats',
    artist: 'Festive Shehnai & Dholak Groove',
    genre: 'Festive',
    durationSec: 35,
    bpm: 112,
    synthesizerType: 'festive_diwali',
    color: '#F43F5E',
    albumArt: '🪔',
  },
  {
    id: 'real-estate-lofi',
    title: 'Dream Home • Acoustic Golden Chords',
    artist: 'Saraswati Nagri Chillwave & Guitar',
    genre: 'Real Estate',
    durationSec: 45,
    bpm: 90,
    synthesizerType: 'real_estate_lofi',
    color: '#10B981',
    albumArt: '🏡',
  },
  {
    id: 'nagpur-ambient',
    title: 'Nagpur Corridor • Modern Growth',
    artist: 'Corporate Inspiration Piano',
    genre: 'Real Estate',
    durationSec: 40,
    bpm: 96,
    synthesizerType: 'real_estate_lofi',
    color: '#059669',
    albumArt: '✨',
  },
  {
    id: 'morning-bansuri',
    title: 'Shubh Prabhat • Morning Bansuri',
    artist: 'Raga Bhupali Peaceful Flute',
    genre: 'Morning',
    durationSec: 50,
    bpm: 72,
    synthesizerType: 'morning_bansuri',
    color: '#3B82F6',
    albumArt: '🌅',
  },
  {
    id: 'sunrise-meditation',
    title: 'Sunrise Birds & Sitar Chimes',
    artist: 'Morning Calm Atmosphere',
    genre: 'Morning',
    durationSec: 40,
    bpm: 68,
    synthesizerType: 'morning_bansuri',
    color: '#0EA5E9',
    albumArt: '🕊️',
  },
  {
    id: 'trending-reels',
    title: 'Viral Instagram Flute Beat',
    artist: 'Lo-Fi Trap Flute Drop',
    genre: 'Trending',
    durationSec: 30,
    bpm: 125,
    synthesizerType: 'maratha_beat',
    color: '#EC4899',
    albumArt: '🔥',
  },
];

// In-memory audio buffer cache to allow playback across modals and board cards
const audioBufferCache = new Map<string, AudioBuffer>();

export function registerAudioBuffer(id: string, buffer: AudioBuffer) {
  audioBufferCache.set(id, buffer);
}

export function getAudioBuffer(id: string): AudioBuffer | undefined {
  return audioBufferCache.get(id);
}

const STORAGE_KEY = 'sn_custom_songs_catalog_v1';

export function loadStoredCustomSongs(): SongTrack[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list: SongTrack[] = JSON.parse(raw);
    return list.map((song) => {
      const cached = audioBufferCache.get(song.id);
      return {
        ...song,
        audioBuffer: cached || song.audioBuffer,
      };
    });
  } catch (e) {
    console.error('Failed to load custom songs from storage', e);
    return [];
  }
}

export function saveStoredCustomSong(song: SongTrack): SongTrack[] {
  try {
    if (song.audioBuffer) {
      registerAudioBuffer(song.id, song.audioBuffer);
    }
    const current = loadStoredCustomSongs().filter((s) => s.id !== song.id);
    const toSave = [
      {
        id: song.id,
        title: song.title,
        artist: song.artist,
        genre: song.genre,
        durationSec: song.durationSec,
        bpm: song.bpm,
        isCustom: true,
        audioUrl: song.audioUrl,
        color: song.color || '#E11D48',
        albumArt: song.albumArt || '🎵',
      },
      ...current,
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    return loadStoredCustomSongs();
  } catch (e) {
    console.error('Failed to save custom song to storage', e);
    return [];
  }
}
