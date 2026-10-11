const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 1. Netflix SVG
const netflixSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="112" fill="#141414"/>
  <g transform="translate(156, 96)">
    <path fill="#B1060F" d="M0 0h44.8v320H0z"/>
    <path fill="#B1060F" d="M155.2 0H200v320h-44.8z"/>
    <path fill="#E50914" d="M0 0h44.8l110.4 320H110.4L0 0z"/>
  </g>
</svg>`;
fs.writeFileSync(path.join(uploadsDir, 'netflix_logo.svg'), netflixSvg);

// 2. ChatGPT SVG
const chatgptSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="112" fill="#10A37F"/>
  <g transform="translate(136, 136) scale(0.47)" fill="none" stroke="#FFFFFF" stroke-width="28" stroke-linecap="round" stroke-linejoin="round">
    <path d="M297.8 198.2c-5.8-32.9-27.5-60.6-57.8-73.8-30.3-13.3-65.4-9.3-92.4 10.4-27 19.8-41.5 52.4-38.3 86.1-31.9 9.3-56.5 34.6-64.2 66.2s3.6 65.1 29.5 87.5c-4.4 33.1 9.4 66.3 36.1 86.9 26.7 20.6 62.9 24.3 93.3 9.6 20.4 25.8 52.5 40.5 86 39.5 33.5-1 64.2-18.4 82.2-46.7 32-8.8 57.1-33.8 65.6-65.4 8.5-31.6-1.5-65.7-26.2-89.2 4.4-33.1-9.3-66.2-36-86.7-26.7-20.6-63-24.3-93.4-9.5-20.4-25.9-52.6-40.6-86.1-39.6-1.3 0-2.6.1-3.9.3"/>
    <circle cx="256" cy="256" r="40" fill="#FFFFFF"/>
  </g>
</svg>`;
fs.writeFileSync(path.join(uploadsDir, 'chatgpt_logo.svg'), chatgptSvg);

// 3. Claude SVG
const claudeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="112" fill="#CC785C"/>
  <g transform="translate(256, 256)" fill="#FFFFFF">
    <path d="M0 -150 C10 -60 60 -10 150 0 C60 10 10 60 0 150 C-10 60 -60 10 -150 0 C-60 -10 -10 -60 0 -150 Z"/>
    <circle cx="0" cy="0" r="24" fill="#CC785C"/>
  </g>
</svg>`;
fs.writeFileSync(path.join(uploadsDir, 'claude_logo.svg'), claudeSvg);

// 4. Gemini / Google AI SVG
const geminiSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E1B4B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="geminiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4285F4"/>
      <stop offset="30%" stop-color="#9B72CB"/>
      <stop offset="70%" stop-color="#D96570"/>
      <stop offset="100%" stop-color="#FFAE42"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#g1)"/>
  <path d="M256 64 C256 170 170 256 64 256 C170 256 256 342 256 448 C256 342 342 256 448 256 C342 256 256 170 256 64 Z" fill="url(#geminiGrad)"/>
</svg>`;
fs.writeFileSync(path.join(uploadsDir, 'gemini_logo.svg'), geminiSvg);
fs.writeFileSync(path.join(uploadsDir, 'google_ai_logo.svg'), geminiSvg);

// 5. Grok SVG
const grokSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="112" fill="#000000" stroke="#262626" stroke-width="12"/>
  <g transform="translate(136, 120)" fill="#FFFFFF">
    <path d="M188 0 L240 0 L52 272 L0 272 Z"/>
    <path d="M84 72 L136 72 L240 220 L188 220 Z" fill="#A3A3A3"/>
  </g>
</svg>`;
fs.writeFileSync(path.join(uploadsDir, 'grok_logo.svg'), grokSvg);

// 6. Surfshark SVG
const surfsharkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="sharkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00D1B2"/>
      <stop offset="100%" stop-color="#009688"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="#0A2540"/>
  <g transform="translate(140, 110)" fill="none" stroke="url(#sharkGrad)" stroke-width="36" stroke-linecap="round" stroke-linejoin="round">
    <path d="M116 30 C180 50 200 130 140 180 C80 230 40 200 40 250 C40 280 80 290 120 280"/>
    <path d="M90 100 C150 110 180 150 150 190" stroke="#FFFFFF" stroke-width="22"/>
  </g>
</svg>`;
fs.writeFileSync(path.join(uploadsDir, 'surfshark_logo.svg'), surfsharkSvg);

// 7. CapCut SVG
const capcutSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="112" fill="#000000" stroke="#1F2937" stroke-width="10"/>
  <g transform="translate(126, 146)">
    <path d="M0 40 L110 0 L150 80 L60 110 Z" fill="#FFFFFF"/>
    <path d="M260 40 L150 0 L110 80 L200 110 Z" fill="#FFFFFF"/>
    <path d="M0 180 L110 220 L150 140 L60 110 Z" fill="#FFFFFF"/>
    <path d="M260 180 L150 220 L110 140 L200 110 Z" fill="#FFFFFF"/>
  </g>
</svg>`;
fs.writeFileSync(path.join(uploadsDir, 'capcut_logo.svg'), capcutSvg);

// 8. HeyGen SVG
const heygenSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="hgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#8B5CF6"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#hgGrad)"/>
  <g transform="translate(146, 136)" fill="#FFFFFF">
    <rect x="0" y="0" width="44" height="240" rx="22"/>
    <rect x="176" y="0" width="44" height="240" rx="22"/>
    <rect x="0" y="98" width="220" height="44" rx="22"/>
    <circle cx="110" cy="120" r="28" fill="#6366F1"/>
  </g>
</svg>`;
fs.writeFileSync(path.join(uploadsDir, 'heygen_logo.svg'), heygenSvg);

// 9. Muse AI SVG
const museAiSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="museGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EC4899"/>
      <stop offset="100%" stop-color="#8B5CF6"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="#0F172A"/>
  <g transform="translate(136, 156)">
    <path d="M0 160 L40 40 L100 120 L140 40 L200 120 L240 160" fill="none" stroke="url(#museGrad)" stroke-width="32" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="40" cy="40" r="16" fill="#EC4899"/>
    <circle cx="140" cy="40" r="16" fill="#A855F7"/>
  </g>
</svg>`;
fs.writeFileSync(path.join(uploadsDir, 'muse_ai_logo.svg'), museAiSvg);

console.log('Successfully generated all high-resolution brand SVGs in public/uploads!');
