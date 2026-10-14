import { PosterTemplate } from '../types';

export const PRESET_POSTERS: PosterTemplate[] = [];

/**
 * Draws a complete, pristine 1080x1920 poster on canvas incorporating the project artwork,
 * luxury real estate typography, amenity badge, Marathi/English branding, and layout map!
 */
export function drawFullPosterCanvas(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  template: PosterTemplate,
  layoutImg: HTMLImageElement | null
) {
  // 1. Background Gradient (Luxury Navy & Emerald deep fade)
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  if (template.category === 'festive') {
    bg.addColorStop(0, '#3a0d1e');
    bg.addColorStop(0.3, '#1c0710');
    bg.addColorStop(0.7, '#0b0407');
    bg.addColorStop(1, '#050203');
  } else {
    bg.addColorStop(0, '#0a1d17');
    bg.addColorStop(0.25, '#0e2920');
    bg.addColorStop(0.65, '#071612');
    bg.addColorStop(1, '#040b09');
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle decorative golden top arc
  ctx.save();
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(W / 2, -200, 700, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 2. Top Header Brand Bar (Saraswati Nagri Logo & Marathi Subtitle)
  // Lotus icon / Emblem circle
  ctx.save();
  ctx.fillStyle = '#D4AF37';
  ctx.beginPath();
  ctx.arc(W / 2, 90, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#071612';
  ctx.font = '700 32px "Poppins", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SN', W / 2, 92);
  ctx.restore();

  // Saraswati Nagri Marathi Brand
  ctx.fillStyle = '#F3DC8E';
  ctx.font = '700 46px "Poppins", "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('सरस्वती नगरी', W / 2, 165);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = '600 24px "Poppins", sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('SARASWATI NAGRI DEVELOPERS • NAGPUR', W / 2, 205);

  // Decorative divider
  const divGrad = ctx.createLinearGradient(W * 0.2, 0, W * 0.8, 0);
  divGrad.addColorStop(0, 'rgba(212, 175, 55, 0)');
  divGrad.addColorStop(0.5, 'rgba(212, 175, 55, 0.8)');
  divGrad.addColorStop(1, 'rgba(212, 175, 55, 0)');
  ctx.fillStyle = divGrad;
  ctx.fillRect(W * 0.15, 225, W * 0.7, 3);

  // 3. Category Tag Pill
  const tagText = template.tag.toUpperCase();
  ctx.font = '700 22px "Poppins", sans-serif';
  const tagW = ctx.measureText(tagText).width + 50;
  const tagX = (W - tagW) / 2;
  const tagY = 250;
  ctx.save();
  ctx.fillStyle = template.category === 'festive' ? '#B81D47' : '#14532D';
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(tagX, tagY, tagW, 44, 22);
  } else {
    ctx.rect(tagX, tagY, tagW, 44);
  }
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tagText, W / 2, tagY + 22);
  ctx.restore();

  // 4. Headline
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 52px "Outfit", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // Multi-line wrap for headline
  const words = template.headline.split(' ');
  let line = '';
  let yPos = 320;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > W * 0.86 && n > 0) {
      ctx.fillText(line.trim(), W / 2, yPos);
      line = words[n] + ' ';
      yPos += 64;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), W / 2, yPos);
  yPos += 72;

  // Subheadline
  ctx.fillStyle = '#B4D2C3';
  ctx.font = '500 28px "Poppins", sans-serif';
  ctx.fillText(template.subheadline, W / 2, yPos);

  // 5. Layout Image / Map Showcase Card (y = 510 to 1180)
  const cardX = W * 0.05;
  const cardY = 500;
  const cardW = W * 0.9;
  const cardH = 680;

  // Outer frame glow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 15;
  ctx.fillStyle = '#0F231D';
  ctx.strokeStyle = '#285844';
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(cardX, cardY, cardW, cardH, 28);
  } else {
    ctx.rect(cardX, cardY, cardW, cardH);
  }
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Draw Layout Image clipped inside card
  ctx.save();
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(cardX, cardY, cardW, cardH, 28);
  } else {
    ctx.rect(cardX, cardY, cardW, cardH);
  }
  ctx.clip();

  if (layoutImg && layoutImg.complete && layoutImg.naturalWidth > 0) {
    // Fill / cover mode
    const scale = Math.max(cardW / layoutImg.naturalWidth, cardH / layoutImg.naturalHeight);
    const sw = layoutImg.naturalWidth * scale;
    const sh = layoutImg.naturalHeight * scale;
    const sx = cardX + (cardW - sw) / 2;
    const sy = cardY + (cardH - sh) / 2;
    ctx.drawImage(layoutImg, sx, sy, sw, sh);

    // Subtle dark gradient vignette over image bottom
    const imgGrad = ctx.createLinearGradient(0, cardY + cardH * 0.6, 0, cardY + cardH);
    imgGrad.addColorStop(0, 'rgba(0,0,0,0)');
    imgGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = imgGrad;
    ctx.fillRect(cardX, cardY, cardW, cardH);
  } else {
    // Elegant procedural plot blueprint preview
    ctx.fillStyle = '#0B291F';
    ctx.fillRect(cardX, cardY, cardW, cardH);

    // Grid lines
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
    ctx.lineWidth = 2;
    for (let gx = cardX; gx <= cardX + cardW; gx += 60) {
      ctx.beginPath();
      ctx.moveTo(gx, cardY);
      ctx.lineTo(gx, cardY + cardH);
      ctx.stroke();
    }
    for (let gy = cardY; gy <= cardY + cardH; gy += 60) {
      ctx.beginPath();
      ctx.moveTo(cardX, gy);
      ctx.lineTo(cardX + cardW, gy);
      ctx.stroke();
    }

    // Roadway
    ctx.fillStyle = '#1D3B2F';
    ctx.fillRect(cardX + cardW * 0.35, cardY, 120, cardH);
    ctx.strokeStyle = '#F3DC8E';
    ctx.lineWidth = 3;
    ctx.setLineDash([15, 12]);
    ctx.beginPath();
    ctx.moveTo(cardX + cardW * 0.35 + 60, cardY);
    ctx.lineTo(cardX + cardW * 0.35 + 60, cardY + cardH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Sample plot boxes
    ctx.fillStyle = 'rgba(212, 175, 55, 0.25)';
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        const px = cardX + 50 + c * 90;
        const py = cardY + 80 + r * 130;
        ctx.fillRect(px, py, 75, 105);
        ctx.strokeRect(px, py, 75, 105);
      }
    }
  }

  // Corner Project Badge on Image
  const badgeText = template.badge;
  ctx.font = '700 24px "Poppins", sans-serif';
  const bW = ctx.measureText(badgeText).width + 48;
  ctx.fillStyle = '#E0457B';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(cardX + 24, cardY + 24, bW, 48, 12);
  } else {
    ctx.rect(cardX + 24, cardY + 24, bW, 48);
  }
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#FFFFFF';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(badgeText, cardX + 48, cardY + 48);

  ctx.restore();

  // 6. Highlights / Amenities Grid (y = 1210 to 1460)
  const items = template.highlights;
  const cols = 2;
  const rowH = 75;
  items.forEach((item, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const ix = cardX + col * (cardW / 2 + 15);
    const iy = 1220 + row * rowH;
    const iw = cardW / 2 - 15;

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(ix, iy, iw, 62, 14);
    } else {
      ctx.rect(ix, iy, iw, 62);
    }
    ctx.fill();
    ctx.stroke();

    // Checkmark bullet in gold
    ctx.fillStyle = '#D4AF37';
    ctx.beginPath();
    ctx.arc(ix + 28, iy + 31, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#071612';
    ctx.font = '700 18px "Poppins", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✓', ix + 28, iy + 32);

    // Text
    ctx.fillStyle = '#F5F5F5';
    ctx.font = '600 23px "Poppins", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(item, ix + 56, iy + 31);
    ctx.restore();
  });

  // 7. Reserved Contact Plate Band Area (y = 1580 to 1750)
  // Background band is drawn by contact plate stamper

  // 8. Footer (y = 1780 to 1920)
  ctx.fillStyle = '#06130F';
  ctx.fillRect(0, 1780, W, 140);
  ctx.fillStyle = '#8EAA9E';
  ctx.font = '500 22px "Poppins", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Head Office: Ground Floor, Saraswati Nagri, Godhni Road, Nagpur', W / 2, 1825);
  ctx.fillStyle = '#D4AF37';
  ctx.font = '600 22px "Poppins", sans-serif';
  ctx.fillText('saraswatinagri.com • Nagpur RERA Registered Projects', W / 2, 1865);
}
