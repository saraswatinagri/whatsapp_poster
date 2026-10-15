export interface PosterTemplate {
  id: string;
  title: string;
  projectName: string;
  category: string;
  imageUrl: string;
  urls?: string[];
  aspectRatio: '9:16' | '4:5' | '1:1';
  tag: string;
  headline: string;
  subheadline: string;
  badge: string;
  highlights: string[];
  downloadsCount?: number;
  postDate?: string;
  createdAt?: string;
  posterName?: string;
  type?: string;
  content?: string;
  song?: SongTrack;
  songDurationSec?: 15 | 30;
  songStartOffsetSec?: number;
  hasSong?: boolean;
  personalizeForAgent?: boolean;
  sendToPartnersWhatsApp?: boolean;
}

export type SynthesizerType = 
  | 'saraswati_flute' 
  | 'ganesh_dhol' 
  | 'maratha_beat' 
  | 'real_estate_lofi' 
  | 'morning_bansuri'
  | 'shankh_devotional'
  | 'festive_diwali';

export interface SongTrack {
  id: string;
  title: string;
  artist: string;
  genre: 'Devotional' | 'Festive' | 'Real Estate' | 'Morning' | 'Trending' | 'Custom' | 'Online Search';
  durationSec: number;
  bpm: number;
  isCustom?: boolean;
  audioUrl?: string;
  audioBuffer?: AudioBuffer;
  synthesizerType?: SynthesizerType;
  color: string;
  albumArt?: string;
  albumCoverUrl?: string;
  sourceApp?: 'spotify' | 'gaana' | 'itunes' | 'device' | 'preset';
}

export interface AgentProfile {
  name: string;
  phone: string;
  role: 'Sales Executive' | 'Referral Partner' | 'Relationship Manager' | 'Operational Manager';
  customLabel?: string;
  reraNumber?: string;
}

export type StatusMotionEffect = 'none' | 'ken_burns' | 'audio_wave' | 'golden_sparkles';

export type MusicStickerPosition = 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' | 'bottom_center';

export interface StatusCustomization {
  durationSec: 15 | 30;
  startOffsetSec: number;
  showMusicSticker: boolean;
  musicStickerPosition: MusicStickerPosition;
  motionEffect: StatusMotionEffect;
  showWaveformOverlay: boolean;
  musicVolume: number;
  personalizePlate: boolean;
}

export type CrmTab = 'daily' | 'songs_app' | 'layout_media' | 'vault' | 'marketing_assets' | 'deleted';
