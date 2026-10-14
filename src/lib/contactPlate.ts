import { AgentProfile } from '../types';

export interface PlateRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const DEFAULT_PLATE: PlateRect = { x: 0.04, y: 0.835, w: 0.92, h: 0.078 };

const PLATE_BG = '#0B0B0B';
const GOLD_LIGHT = '#F3DC8E';
const GOLD_DARK = '#B8901F';
const WHITE = '#FFFFFF';

// Crisp 24-unit SVG telephone outline
const PHONE_SVG_PATH =
  'M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2';

export function formatPosterPhone(raw: string | null | undefined): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (trimmed.startsWith('+') && /\s/.test(trimmed)) return trimmed;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return trimmed;
}

export function drawContactPlate(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  agent: AgentProfile,
  rect: PlateRect = DEFAULT_PLATE
): void {
  const px = rect.x * W;
  const py = rect.y * H;
  const pw = rect.w * W;
  const ph = rect.h * H;
  const radius = ph * 0.16;

  // 1. Plate shadow & dark background
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = ph * 0.25;
  ctx.shadowOffsetY = ph * 0.05;
  ctx.fillStyle = PLATE_BG;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(px, py, pw, ph, radius);
  } else {
    ctx.rect(px, py, pw, ph);
  }
  ctx.fill();
  ctx.restore();

  // 2. Metallic gold top hairline
  const hair = Math.max(2, ph * 0.035);
  const goldTop = ctx.createLinearGradient(px, 0, px + pw, 0);
  goldTop.addColorStop(0, GOLD_DARK);
  goldTop.addColorStop(0.5, GOLD_LIGHT);
  goldTop.addColorStop(1, GOLD_DARK);

  ctx.save();
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(px, py, pw, ph, radius);
  } else {
    ctx.rect(px, py, pw, ph);
  }
  ctx.clip();
  ctx.fillStyle = goldTop;
  ctx.fillRect(px, py, pw, hair);
  ctx.restore();

  // 3. Left gold accent bar
  const barW = Math.max(5, ph * 0.06);
  const goldBar = ctx.createLinearGradient(0, py, 0, py + ph);
  goldBar.addColorStop(0, GOLD_LIGHT);
  goldBar.addColorStop(1, GOLD_DARK);
  ctx.save();
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(px, py, pw, ph, radius);
  } else {
    ctx.rect(px, py, pw, ph);
  }
  ctx.clip();
  ctx.fillStyle = goldBar;
  ctx.fillRect(px, py, barW, ph);
  ctx.restore();

  // 4. Content layout
  const padLeft = barW + ph * 0.28;
  const padRight = ph * 0.22;
  const centerY = py + ph / 2;

  // Top eyebrow label ("ENQUIRE NOW" or "REFERRAL PARTNER")
  const eyebrow = (agent.customLabel || (agent.role === 'Referral Partner' ? 'REFERRAL PARTNER' : 'ENQUIRE NOW')).toUpperCase();
  ctx.fillStyle = GOLD_LIGHT;
  ctx.font = `600 ${Math.round(ph * 0.16)}px "Poppins", "Outfit", sans-serif`;
  ctx.textBaseline = 'bottom';
  ctx.textAlign = 'left';
  ctx.fillText(eyebrow, px + padLeft, centerY - ph * 0.06);

  // Agent Name
  ctx.fillStyle = WHITE;
  ctx.font = `700 ${Math.round(ph * 0.28)}px "Poppins", "Outfit", sans-serif`;
  ctx.textBaseline = 'top';
  ctx.fillText(agent.name || 'Saraswati Nagri Partner', px + padLeft, centerY);

  // 5. Right phone pill button
  const phoneText = formatPosterPhone(agent.phone || '+91 94221 00000');
  const pillH = ph * 0.54;
  const pillFont = `700 ${Math.round(ph * 0.23)}px "Poppins", "Outfit", sans-serif`;
  ctx.font = pillFont;
  const phoneW = ctx.measureText(phoneText).width;
  const iconSize = pillH * 0.44;
  const pillW = phoneW + iconSize + ph * 0.35;
  const pillX = px + pw - padRight - pillW;
  const pillY = centerY - pillH / 2;

  // Pill metallic background
  const pillGrad = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY + pillH);
  pillGrad.addColorStop(0, GOLD_LIGHT);
  pillGrad.addColorStop(1, GOLD_DARK);

  ctx.save();
  ctx.fillStyle = pillGrad;
  ctx.shadowColor = 'rgba(212, 175, 55, 0.35)';
  ctx.shadowBlur = ph * 0.15;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
  } else {
    ctx.rect(pillX, pillY, pillW, pillH);
  }
  ctx.fill();
  ctx.restore();

  // Draw telephone icon
  ctx.save();
  ctx.translate(pillX + ph * 0.12, pillY + (pillH - iconSize) / 2);
  const scale = iconSize / 24;
  ctx.scale(scale, scale);
  ctx.strokeStyle = '#0B0B0B';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (typeof Path2D !== 'undefined') {
    ctx.stroke(new Path2D(PHONE_SVG_PATH));
  }
  ctx.restore();

  // Draw phone text in dark charcoal
  ctx.fillStyle = '#0B0B0B';
  ctx.font = pillFont;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(phoneText, pillX + iconSize + ph * 0.22, centerY);
}
