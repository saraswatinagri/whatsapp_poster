import { SongTrack } from '../types';

export interface MusicSearchCategory {
  id: string;
  name: string;
  icon: string;
  query: string;
}

export const POPULAR_MUSIC_SEARCH_PRESETS: MusicSearchCategory[] = [
  { id: 'saraswati', name: 'Saraswati Vandana', icon: '🪷', query: 'Saraswati Vandana devotional' },
  { id: 'ganesh', name: 'Ganesh Dhol Tasha', icon: '🥁', query: 'Deva Shree Ganesha Dhol Tasha' },
  { id: 'maratha', name: 'Royal Maratha / Powada', icon: '🚩', query: 'Shivaji Maharaj Ajay Atul powada' },
  { id: 'mauli', name: 'Mauli Mauli / Vitthal', icon: '🕉️', query: 'Mauli Mauli Ajay Atul' },
  { id: 'festive', name: 'Shubh Muhurat / Shehnai', icon: '🪔', query: 'Shubh Muhurat shehnai celebration' },
  { id: 'bollywood', name: 'Trending Bollywood', icon: '✨', query: 'Arijit Singh Pritam trending' },
  { id: 'lofi', name: 'Acoustic & Chillwave', icon: '🏡', query: 'acoustic guitar chill peace ambient' },
];

const COLOR_PALETTES = [
  '#E11D48', // Rose
  '#E0457B', // Deep Rose
  '#E07B3A', // Vibrant Orange
  '#D4AF37', // Gold
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#0EA5E9', // Sky Blue
  '#F43F5E', // Strawberry
  '#F59E0B', // Amber
];

interface ITunesTrackResult {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  previewUrl: string;
  artworkUrl60?: string;
  artworkUrl100?: string;
  primaryGenreName?: string;
  trackTimeMillis?: number;
}

/**
 * Searches the music catalog (Apple Music / iTunes Engine) which indexes
 * millions of Bollywood, Marathi, Hindi, Devotional, Regional, and International songs.
 * Returns 30-second high-fidelity audio preview tracks that stream with CORS enabled.
 */
export async function searchOnlineMusic(query: string, limit = 15): Promise<SongTrack[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  try {
    // Search with Indian storefront first for best regional and Bollywood matching
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&country=IN&media=music&entity=song&limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Music search failed: ${response.statusText}`);
    }

    const data = await response.json();
    let results: ITunesTrackResult[] = data.results || [];

    // Fallback without country filter if no results found
    if (results.length === 0) {
      const globalUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&media=music&entity=song&limit=${limit}`;
      const globalRes = await fetch(globalUrl);
      if (globalRes.ok) {
        const globalData = await globalRes.json();
        results = globalData.results || [];
      }
    }

    // Filter out items without an audio preview stream
    const validTracks = results.filter((r) => r.previewUrl && r.trackName);

    return validTracks.map((r, index) => {
      // High-res album art transformation
      const highResArt = r.artworkUrl100
        ? r.artworkUrl100.replace('100x100bb', '300x300bb')
        : undefined;

      const color = COLOR_PALETTES[index % COLOR_PALETTES.length];

      return {
        id: `itunes-${r.trackId}`,
        title: r.trackName,
        artist: r.artistName,
        genre: 'Online Search',
        durationSec: 30, // Official preview duration is 30s
        bpm: 100,
        isCustom: true,
        audioUrl: r.previewUrl,
        color,
        albumArt: '🎵',
        albumCoverUrl: highResArt || r.artworkUrl100,
        sourceApp: 'itunes',
      };
    });
  } catch (error) {
    console.error('Error searching online music:', error);
    return [];
  }
}
