import * as fs from 'fs';
import * as path from 'path';

const CARDS = [
  { name: 'tumbleweed', color: '#D2B48C', shape: 'circle' },
  { name: 'rusty-revolver', color: '#8B4513', shape: 'pistol' },
  { name: 'cactus-juice', color: '#32CD32', shape: 'bottle' },
  { name: 'bandit-mask', color: '#B22222', shape: 'mask' },
  { name: 'sheriff-star', color: '#FFD700', shape: 'star' },
  { name: 'gold-ingot', color: '#FFD700', shape: 'rect' },
  { name: 'ghost-town-map', color: '#F5F5DC', shape: 'rect' },
  { name: 'calamity-jane-rifle', color: '#8B4513', shape: 'rifle' },
  { name: 'saloon-clanker', color: '#C0C0C0', shape: 'robot' },
];

function generateSVG(name: string, color: string, shape: string) {
  let content = '';
  
  switch(shape) {
    case 'circle':
      content = `<circle cx="50" cy="50" r="30" fill="${color}" />`;
      break;
    case 'pistol':
      content = `<rect x="30" y="40" width="40" height="15" fill="${color}" /><rect x="60" y="40" width="10" height="30" fill="${color}" />`;
      break;
    case 'bottle':
      content = `<rect x="40" y="30" width="20" height="10" fill="${color}" /><rect x="35" y="40" width="30" height="40" fill="${color}" />`;
      break;
    case 'mask':
      content = `<path d="M20 40 L80 40 L50 80 Z" fill="${color}" />`;
      break;
    case 'star':
      content = `<polygon points="50,15 61,35 83,35 66,50 72,72 50,60 28,72 34,50 17,35 39,35" fill="${color}" />`;
      break;
    case 'rect':
      content = `<rect x="30" y="30" width="40" height="40" fill="${color}" />`;
      break;
    case 'rifle':
      content = `<rect x="20" y="45" width="60" height="8" fill="${color}" /><rect x="20" y="45" width="15" height="20" fill="${color}" />`;
      break;
    case 'robot':
      content = `<rect x="30" y="30" width="40" height="40" fill="${color}" /><rect x="35" y="40" width="10" height="10" fill="#000" /><rect x="55" y="40" width="10" height="10" fill="#000" /><rect x="40" y="60" width="20" height="5" fill="#000" />`;
      break;
  }

  return `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="image-rendering: pixelated;">
  <rect width="100" height="100" fill="none" />
  ${content}
</svg>`;
}

const outputDir = path.join(process.cwd(), 'public/cards');

CARDS.forEach(card => {
  const svg = generateSVG(card.name, card.color, card.shape);
  fs.writeFileSync(path.join(outputDir, `${card.name}.svg`), svg);
  console.log(`✅ Generated ${card.name}.svg`);
});
