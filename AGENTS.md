# EL RANCHO PROJECT MANIFESTO (AGENTS.md)

## Core Identity
- **Theme**: Wild West / Frontier.
- **Visual Style**: High-contrast pixel art, warm desert palettes (#E2725B, #F4A460), and chunky "8-bit" typography.
- **Tone**: Friendly, rustic, and slightly gamified.

## Technical Requirements
1. **Authentication**: Use Supabase Auth with the Discord Provider. 
2. **Role Mapping**: On first login, fetch the user's Discord roles. 
   - Mapping: 'Sheriff' role = 'Admin', 'Deputy' = 'Moderator', default = 'Farmer'.
3. **Card System Architecture**: 
   - Create a `cards` table (id, name, rarity, image_url, special_attribute).
   - Create a `user_inventory` table to handle card ownership and trades.
4. **UI Constraint**: Use the `image-rendering: pixelated;` CSS property for all avatars and card assets to maintain the pixel-art twist.

## Agent Instructions
- **Master Script Principle**: Always provide full, executable files. No snippets.
- **Planning Mode**: Before implementing the card trading logic, generate a sequence diagram and wait for my 'Y'.
- **Browser Subagent**: Use the browser to verify the Discord Login flow works and that the pixel fonts load correctly.