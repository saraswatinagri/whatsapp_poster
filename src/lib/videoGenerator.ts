import { PosterTemplate, SongTrack, AgentProfile, StatusCustomization } from '../types';
import { drawFullPosterCanvas } from './posterLibrary';
import { drawContactPlate } from './contactPlate';
import { audioEngine } from './audioEngine';

export interface ExportProgress {
  progress: number; // 0 to 100
  secondsRendered: number;
  totalSeconds: number;
  statusText: string;
}

export function drawMusicSticker(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  song: SongTrack,
  customization: StatusCustomization,
  animTime: number,
  freqData?: Uint8Array
) {
  if (!customization.showMusicSticker) return;

  // Position calculation
  let x = 60;
  let y = 140;
  const stickerW = Math.min(W * 0.75, 420);
  const stickerH = 68;

  switch (customization.musicStickerPosition) {
    case 'top_left':
      x = 60;
      y = 120;
      break;
    case 'top_right':
      x = W - stickerW - 60;
      y = 120;
      break;
    case 'bottom_left':
      x = 60;
      y = H - 280;
      break;
    case 'bottom_right':
      x = W - stickerW - 60;
      y = H - 280;
      break;
    case 'bottom_center':
      x = (W - stickerW) / 2;
      y = H - 260;
      break;
  }

  ctx.save();
  // Glassmorphic translucent badge
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, stickerW, stickerH, stickerH / 2);
  } else {
    ctx.rect(x, y, stickerW, stickerH);
  }
  ctx.fill();
  ctx.stroke();

  // Music icon circle
  const iconRadius = 22;
  const iconX = x + iconRadius + 12;
  const iconY = y + stickerH / 2;
  const iconGrad = ctx.createLinearGradient(iconX - iconRadius, iconY, iconX + iconRadius, iconY);
  iconGrad.addColorStop(0, song.color || '#E0457B');
  iconGrad.addColorStop(1, '#D4AF37');
  ctx.fillStyle = iconGrad;
  ctx.beginPath();
  ctx.arc(iconX, iconY, iconRadius, 0, Math.PI * 2);
  ctx.fill();

  // Musical note icon 🎵
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 20px "Poppins", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('♫', iconX, iconY + 1);

  // Animated equalizer sound bars on right
  const barAreaX = x + stickerW - 55;
  const barCount = 4;
  for (let b = 0; b < barCount; b++) {
    let barH = 8;
    if (freqData && freqData.length > 0) {
      const idx = (b * 4) % freqData.length;
      barH = Math.max(6, (freqData[idx] / 255) * 26);
    } else {
      barH = Math.max(6, Math.sin(animTime * 12 + b * 1.5) * 12 + 14);
    }
    const bx = barAreaX + b * 8;
    const by = iconY - barH / 2;
    ctx.fillStyle = '#F3DC8E';
    ctx.fillRect(bx, by, 4, barH);
  }

  // Song title and artist text
  const textX = iconX + iconRadius + 14;
  const maxTextW = stickerW - (textX - x) - 65;

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 18px "Poppins", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  let titleStr = song.title;
  if (ctx.measureText(titleStr).width > maxTextW) {
    while (ctx.measureText(titleStr + '…').width > maxTextW && titleStr.length > 4) {
      titleStr = titleStr.slice(0, -1);
    }
    titleStr += '…';
  }
  ctx.fillText(titleStr, textX, iconY - 2);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '500 13px "Poppins", sans-serif';
  ctx.textBaseline = 'top';
  let artistStr = song.artist;
  if (ctx.measureText(artistStr).width > maxTextW) {
    while (ctx.measureText(artistStr + '…').width > maxTextW && artistStr.length > 4) {
      artistStr = artistStr.slice(0, -1);
    }
    artistStr += '…';
  }
  ctx.fillText(artistStr, textX, iconY + 2);

  ctx.restore();
}

export function drawWaveformOverlay(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  freqData: Uint8Array,
  animTime: number
) {
  const bars = 48;
  const barW = (W * 0.88) / bars;
  const startX = W * 0.06;
  const baseY = H * 0.77;

  ctx.save();
  for (let i = 0; i < bars; i++) {
    const freqVal = freqData[i % freqData.length] || 0;
    const waveSin = Math.sin(animTime * 8 + i * 0.3) * 15;
    const barH = Math.max(4, (freqVal / 255) * 60 + waveSin);

    const bx = startX + i * barW;
    const by = baseY - barH;

    const grad = ctx.createLinearGradient(0, by, 0, baseY);
    grad.addColorStop(0, '#F3DC8E');
    grad.addColorStop(1, 'rgba(212, 175, 55, 0.2)');
    ctx.fillStyle = grad;
    ctx.fillRect(bx + 1, by, barW - 2, barH);
  }
  ctx.restore();
}

export function drawSparkleParticles(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  animTime: number
) {
  ctx.save();
  const count = 18;
  for (let i = 0; i < count; i++) {
    const t = animTime * 0.8 + i * 3.7;
    const px = ((Math.sin(t * 0.7 + i) * 0.5 + 0.5) * W * 0.9) + W * 0.05;
    const py = ((Math.cos(t * 0.5 + i * 2) * 0.5 + 0.5) * (H * 0.65)) + 300;
    const size = Math.abs(Math.sin(t * 2)) * 5 + 2;
    const alpha = Math.abs(Math.sin(t * 1.5)) * 0.75 + 0.2;

    ctx.fillStyle = `rgba(243, 220, 142, ${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();

    // 4-point star glint
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px - size * 1.8, py);
    ctx.lineTo(px + size * 1.8, py);
    ctx.moveTo(px, py - size * 1.8);
    ctx.lineTo(px, py + size * 1.8);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Generates an MP4/WebM WhatsApp status video with the poster + song audio mixed in.
 */
export async function generateStatusVideo(
  template: PosterTemplate,
  layoutImg: HTMLImageElement | null,
  song: SongTrack,
  agent: AgentProfile,
  customization: StatusCustomization,
  onProgress?: (p: ExportProgress) => void
): Promise<{ blob: Blob; fileName: string; mimeType: string }> {
  const W = 1080;
  const H = 1920;
  const fps = 30;
  const durationSec = customization.durationSec;
  const totalFrames = durationSec * fps;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Start audio for recording stream
  await audioEngine.play(song, customization.startOffsetSec, customization.musicVolume);
  const audioStream = audioEngine.getDestinationStream();

  // Capture canvas video stream
  const canvasStream = canvas.captureStream(fps);
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...audioStream.getAudioTracks(),
  ]);

  // Determine supported mime type
  let mimeType = 'video/mp4;codecs=avc1,mp4a';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/mp4';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
    }
  }

  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 4_500_000, // 4.5 Mbps for crisp status
    audioBitsPerSecond: 192_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  recorder.start(100);

  // Render frame loop in real-time
  const frameIntervalMs = 1000 / fps;
  let frame = 0;

  return new Promise<{ blob: Blob; fileName: string; mimeType: string }>((resolve, reject) => {
    recorder.onerror = (err) => {
      audioEngine.pause();
      reject(err);
    };

    recorder.onstop = () => {
      audioEngine.pause();
      const finalBlob = new Blob(chunks, { type: mimeType });
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const cleanTitle = template.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const fileName = `saraswati_nagri_${cleanTitle}_status.${ext}`;
      resolve({ blob: finalBlob, fileName, mimeType });
    };

    const renderStep = () => {
      if (frame >= totalFrames) {
        recorder.stop();
        return;
      }

      const animTime = frame / fps;
      const progress = Math.round((frame / totalFrames) * 100);

      if (onProgress) {
        onProgress({
          progress,
          secondsRendered: Math.round(animTime),
          totalSeconds: durationSec,
          statusText: `Encoding WhatsApp Status Video... ${progress}% (${Math.round(animTime)}s / ${durationSec}s)`,
        });
      }

      // 1. Ken Burns motion transform if active
      ctx.save();
      if (customization.motionEffect === 'ken_burns') {
        const zoom = 1 + (animTime / durationSec) * 0.05; // 5% gentle zoom
        ctx.translate(W / 2, H / 2);
        ctx.scale(zoom, zoom);
        ctx.translate(-W / 2, -H / 2);
      }

      // Draw poster base
      drawFullPosterCanvas(ctx, W, H, template, layoutImg);
      ctx.restore();

      // 2. Decorative sparkles if active
      if (customization.motionEffect === 'golden_sparkles') {
        drawSparkleParticles(ctx, W, H, animTime);
      }

      // 3. Audio frequency data
      const freq = audioEngine.getFrequencyData();

      // 4. Waveform overlay if active
      if (customization.showWaveformOverlay || customization.motionEffect === 'audio_wave') {
        drawWaveformOverlay(ctx, W, H, freq, animTime);
      }

      // 5. Stamped agent contact plate
      if (customization.personalizePlate) {
        drawContactPlate(ctx, W, H, agent);
      }

      // 6. WhatsApp Music Sticker badge
      if (customization.showMusicSticker) {
        drawMusicSticker(ctx, W, H, song, customization, animTime, freq);
      }

      frame++;
      setTimeout(renderStep, frameIntervalMs);
    };

    renderStep();
  });
}
