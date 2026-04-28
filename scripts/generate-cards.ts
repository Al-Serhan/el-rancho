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
  { name: 'silver-bullet', color: '#C0C0C0', shape: 'bullet' },
  { name: 'old-boot', color: '#5C4033', shape: 'boot' },
  { name: 'dynamite', color: '#FF0000', shape: 'stick' },
  { name: 'wanted-poster', color: '#DEB887', shape: 'paper' },
  { name: 'snake-skin', color: '#228B22', shape: 'wiggle' },
  { name: 'lucky-coin', color: '#FFD700', shape: 'coin' },
  { name: 'iron-spur', color: '#4B4B4B', shape: 'spur' },
  { name: 'desert-rose', color: '#FF69B4', shape: 'flower' },
  { name: 'ace-of-spades', color: '#FFFFFF', shape: 'ace' },
  { name: 'buffalo-skull', color: '#FDF5E6', shape: 'skull' },
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
      content = `<rect x="40" y="20" width="20" height="15" fill="${color}" /><rect x="30" y="35" width="40" height="45" fill="${color}" />`;
      break;
    case 'mask':
      content = `<path d="M20 40 L80 40 L50 80 Z" fill="${color}" />`;
      break;
    case 'star':
      content = `<polygon points="50,15 61,35 83,35 66,50 72,72 50,60 28,72 34,50 17,35 39,35" fill="${color}" />`;
      break;
    case 'rect':
      content = `<rect x="25" y="30" width="50" height="40" fill="${color}" />`;
      break;
    case 'rifle':
      content = `<rect x="15" y="45" width="70" height="10" fill="${color}" /><rect x="15" y="45" width="20" height="25" fill="${color}" />`;
      break;
    case 'robot':
      content = `<rect x="30" y="30" width="40" height="40" fill="${color}" /><rect x="35" y="40" width="10" height="10" fill="#000" /><rect x="55" y="40" width="10" height="10" fill="#000" /><rect x="40" y="60" width="20" height="5" fill="#000" />`;
      break;
    case 'bullet':
      content = `<rect x="40" y="30" width="20" height="40" rx="10" fill="${color}" />`;
      break;
    case 'boot':
      content = `<path d="M30 20 L50 20 L50 60 L80 60 L80 80 L30 80 Z" fill="${color}" />`;
      break;
    case 'stick':
      content = `<rect x="45" y="30" width="10" height="40" fill="${color}" /><path d="M50 30 Q50 20 60 20" stroke="#000" fill="none" />`;
      break;
    case 'paper':
      content = `<rect x="30" y="20" width="40" height="60" fill="${color}" /><rect x="35" y="30" width="30" height="30" fill="#0002" />`;
      break;
    case 'wiggle':
      content = `<path d="M30 50 Q40 30 50 50 T70 50" stroke="${color}" stroke-width="10" fill="none" />`;
      break;
    case 'coin':
      content = `<circle cx="50" cy="50" r="25" fill="${color}" stroke="#B8860B" stroke-width="2" />`;
      break;
    case 'spur':
      content = `<circle cx="50" cy="50" r="15" fill="none" stroke="${color}" stroke-width="5" /><path d="M50 35 L50 65 M35 50 L65 50" stroke="${color}" stroke-width="5" />`;
      break;
    case 'flower':
      content = `<circle cx="50" cy="50" r="10" fill="yellow" />${[0,72,144,216,288].map(a => `<circle cx="${50 + 20*Math.cos(a*Math.PI/180)}" cy="${50 + 20*Math.sin(a*Math.PI/180)}" r="15" fill="${color}" />`).join('')}`;
      break;
    case 'ace':
      content = `<rect x="30" y="20" width="40" height="60" rx="5" fill="${color}" /><path d="M50 40 L60 60 L40 60 Z" fill="#000" />`;
      break;
    case 'skull':
      content = `<path d="M30 30 L70 30 L70 60 Q70 80 50 80 Q30 80 30 60 Z" fill="${color}" /><circle cx="40" cy="45" r="5" fill="#000" /><circle cx="60" cy="45" r="5" fill="#000" />`;
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
