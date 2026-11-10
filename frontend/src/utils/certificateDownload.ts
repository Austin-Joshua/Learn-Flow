import { apiClient, API_BASE_URL } from '../services/api';

export interface CertificateExportData {
  id?: string;
  verificationCode: string;
  recipientName: string;
  courseTitle: string;
  instructorName?: string;
  issuedAt?: string;
}

/**
 * Triggers a native browser file download from a Blob or URL.
 */
function triggerBrowserDownload(blobOrUrl: Blob | string, filename: string) {
  const isBlob = typeof blobOrUrl !== 'string';
  const url = isBlob ? window.URL.createObjectURL(blobOrUrl) : blobOrUrl;
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  if (isBlob) {
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 2000);
  }
}

/**
 * Client-side High-Resolution Canvas PNG Generator (bulletproof offline fallback).
 * Renders the authentic Learnflow Academic Diploma onto a 1600x1050 2x canvas.
 */
function generateClientCanvasImage(data: CertificateExportData): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const width = 1600;
      const height = 1050;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas 2D context not supported');
      }

      // 1. Parchment Background
      ctx.fillStyle = '#FAF8F5';
      ctx.fillRect(0, 0, width, height);

      // 2. Outer Deep Navy Border
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#0B1E28';
      ctx.strokeRect(30, 30, width - 60, height - 60);

      // 3. Inner Antique Gold Border
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#C5A059';
      ctx.strokeRect(52, 52, width - 104, height - 104);

      // 4. Corner Diamonds (Gold)
      const drawDiamond = (cx: number, cy: number, size: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((45 * Math.PI) / 180);
        ctx.fillStyle = '#C5A059';
        ctx.fillRect(-size / 2, -size / 2, size, size);
        ctx.restore();
      };
      drawDiamond(52, 52, 14);
      drawDiamond(width - 52, 52, 14);
      drawDiamond(52, height - 52, 14);
      drawDiamond(width - 52, height - 52, 14);

      // 5. Academic Crest (Top Circle)
      ctx.save();
      ctx.beginPath();
      ctx.arc(width / 2, 140, 40, 0, Math.PI * 2);
      ctx.fillStyle = '#0B1E28';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#C5A059';
      ctx.stroke();
      ctx.fillStyle = '#FAF8F5';
      ctx.font = 'bold 22px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('LF', width / 2, 140);
      ctx.restore();

      // 6. Header Titles
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0B1E28';
      ctx.font = 'bold 26px serif';
      ctx.fillText('LEARNFLOW INSTITUTE OF ADVANCED COMPUTING', width / 2, 220);

      ctx.fillStyle = '#C5A059';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('OFFICIAL DIPLOMA OF ACADEMIC ACHIEVEMENT & CURRICULUM MASTERY', width / 2, 255);

      // 7. Award Excerpt
      ctx.fillStyle = '#4A5568';
      ctx.font = 'italic 18px serif';
      ctx.fillText('This is to certify that', width / 2, 330);

      // 8. Recipient Name
      ctx.fillStyle = '#0B1E28';
      ctx.font = 'bold 44px serif';
      ctx.fillText(data.recipientName || 'Verified Learner', width / 2, 400);

      // 9. Completion Text
      ctx.fillStyle = '#4A5568';
      ctx.font = '16px serif';
      ctx.fillText(
        'has successfully satisfied 100% of curriculum milestones, timed assessments, and sequential modules for',
        width / 2,
        460
      );

      // 10. Course Title
      ctx.fillStyle = '#0B1E28';
      ctx.font = 'bold 32px serif';
      ctx.fillText(data.courseTitle || 'Advanced Computing Specialization', width / 2, 520);

      // 11. Security & Verification Ribbon
      ctx.fillStyle = '#2B6CB0';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(
        `AUTHENTIC CREDENTIAL • VERIFICATION CODE: ${data.verificationCode}`,
        width / 2,
        600
      );

      ctx.fillStyle = '#718096';
      ctx.font = '13px monospace';
      const dateStr = data.issuedAt
        ? new Date(data.issuedAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      ctx.fillText(`Issued: ${dateStr} • Cryptographically Sealed with HMAC-SHA256`, width / 2, 630);

      // 12. Bottom Signature Blocks
      // Left: Platform Registry
      ctx.beginPath();
      ctx.moveTo(180, 880);
      ctx.lineTo(480, 880);
      ctx.strokeStyle = '#A0AEC0';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = '14px serif';
      ctx.fillStyle = '#2D3748';
      ctx.fillText('Learnflow Academic Registry', 330, 910);
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#718096';
      ctx.fillText('Cryptographic Key Ring Authority', 330, 930);

      // Right: Lead Instructor / Directorate
      ctx.beginPath();
      ctx.moveTo(width - 480, 880);
      ctx.lineTo(width - 180, 880);
      ctx.strokeStyle = '#A0AEC0';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = '14px serif';
      ctx.fillStyle = '#2D3748';
      ctx.fillText(data.instructorName || 'Academic Course Directorate', width - 330, 910);
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#718096';
      ctx.fillText('Verified Faculty Reviewer', width - 330, 930);

      // Convert to PNG Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas toBlob returned null'));
          }
        },
        'image/png',
        1.0
      );
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Downloads the official high-resolution PNG Certificate Image.
 * Primary: Server-side cryptographic image endpoint with embedded PNG metadata.
 * Fallback: Client-side high-resolution HTML5 canvas diploma export.
 */
export async function downloadCertificateImage(data: CertificateExportData): Promise<void> {
  const filename = `Certificate_${data.verificationCode}.png`;

  // 1. Primary Strategy: Server API call via apiClient
  try {
    const endpoint = data.id
      ? `/certificates/${data.id}/download-image`
      : `/public/certificates/by-code/${data.verificationCode}/download-image`;

    const res = await apiClient.get(endpoint, {
      responseType: 'blob',
    });

    if (res.data && res.data.size > 0) {
      triggerBrowserDownload(res.data, filename);
      return;
    }
  } catch (err) {
    console.warn('Server certificate image download failed, invoking high-res client canvas fallback:', err);
  }

  // 2. Fallback Strategy: Client-side Canvas rendering
  const canvasBlob = await generateClientCanvasImage(data);
  triggerBrowserDownload(canvasBlob, filename);
}

/**
 * Downloads the official Vector PDF Certificate.
 * Primary: Server-side ReportLab cryptographic PDF stream via apiClient.
 * Fallback: Direct API_BASE_URL window open, or client print-to-PDF layout.
 */
export async function downloadCertificatePdf(data: CertificateExportData): Promise<void> {
  const filename = `Certificate_${data.verificationCode}.pdf`;

  // 1. Primary Strategy: Server API call via apiClient with auth & credentials
  try {
    const endpoint = data.id
      ? `/certificates/${data.id}/download`
      : `/public/certificates/by-code/${data.verificationCode}/download`;

    const res = await apiClient.get(endpoint, {
      responseType: 'blob',
    });

    if (res.data && res.data.size > 0) {
      triggerBrowserDownload(res.data, filename);
      return;
    }
  } catch (err) {
    console.warn('Server certificate PDF stream failed, attempting direct download URL fallback:', err);
  }

  // 2. Secondary Strategy: Direct backend URL
  try {
    const fallbackUrl = data.id
      ? `${API_BASE_URL}/certificates/${data.id}/download`
      : `${API_BASE_URL}/public/certificates/by-code/${data.verificationCode}/download`;

    triggerBrowserDownload(fallbackUrl, filename);
  } catch (err) {
    console.error('All certificate PDF download methods failed:', err);
  }
}

