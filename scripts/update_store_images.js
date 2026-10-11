const fs = require('fs');
const path = require('path');

const storePath = path.join(__dirname, '..', 'data', 'store.json');
const storeData = JSON.parse(fs.readFileSync(storePath, 'utf8'));

// Map titles to high-res SVG assets
const logoMap = {
  'claude ai team plan': '/uploads/claude_logo.svg',
  'claude ai pro plan': '/uploads/claude_logo.svg',
  'heygen creator plan': '/uploads/heygen_logo.svg',
  'google ai pro': '/uploads/google_ai_logo.svg',
  'muse ai': '/uploads/muse_ai_logo.svg',
  'super grok subscription': '/uploads/grok_logo.svg',
  'netflix': '/uploads/netflix_logo.svg',
  'surfshark vpn': '/uploads/surfshark_logo.svg',
  'chat gpt': '/uploads/chatgpt_logo.svg',
  'gemini pro': '/uploads/gemini_logo.svg',
  'capcut': '/uploads/capcut_logo.svg',
};

storeData.products = storeData.products.map(p => {
  const titleLower = (p.title || '').toLowerCase().trim();
  const matchedLogo = logoMap[titleLower];

  const updatedImages = matchedLogo ? [matchedLogo] : p.images;

  return {
    ...p,
    images: updatedImages,
    imageFit: p.imageFit || 'contain',
    imageZoom: p.imageZoom ?? 95,
  };
});

fs.writeFileSync(storePath, JSON.stringify(storeData, null, 2), 'utf8');
console.log('Successfully updated store.json with crisp SVGs and contain/zoom defaults!');
