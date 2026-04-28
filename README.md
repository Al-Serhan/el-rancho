# 🌵 El Rancho: The Frontier Card Game

Welcome to **El Rancho**, an immersive 8-bit Wild West card collection and trading platform. Stake your claim, build your hand, and become a legend of the West.

## 🎭 Immersive Features

### 🏰 The Saloon Dashboard
A fully themed, cinematic experience featuring:
- **Atmospheric Overlays**: Classic film grain and scanline effects for a retro feel.
- **Interactive Tiles**: Stylized signs and wanted posters for navigation.
- **Identity Sidebar**: Synced profile information including your custom Discord avatar, role, and a reputation system.

### 🃏 Frontier Card System
- **29 Unique Cards**: Collect artifacts like *Calamity Jane’s Rifle*, *The Saloon Clanker*, and the *Ace of Spades*.
- **Rarity Tiers**: Visual distinction with rarity-colored borders (Common, Uncommon, Rare, Epic, and Legendary).
- **Custom Art**: Programmatically generated 8-bit SVG graphics for every item.
- **Lore & Attributes**: Each card features flavorful descriptions and gameplay-enhancing special attributes.

### 🤝 Trading Post
- **Atomic Swaps**: A secure, asynchronous trading system where users can propose and accept card swaps.
- **Database Integrity**: Powered by PostgreSQL RPC functions to ensure items are swapped securely and instantly.

### 🎲 The Saloon (Poker Room)
- **5-Card Draw**: A classic poker minigame to bet your hard-earned gold.
- **Gold Currency**: Start with 100 gold and climb the ranks.
- **Secure Payouts**: Logic handled via Next.js Server Actions to prevent client-side tampering.

### 🥇 Hall of Fame
- **Global Leaderboard**: See who has the heaviest satchel across the whole frontier.
- **Real-time Rankings**: Ranked by total gold count.

### 🤖 Dynamic Discord Sync
- **Server Integration**: Automatically syncs your website role with your role in **Sheriff Jones' Server**.
- **Hierarchy Mapping**: The site dynamically detects your highest-ranking Discord role and updates your profile upon login.

---

## 🛠️ Tech Stack

- **Frontend**: [Next.js 15](https://nextjs.org/) (App Router), [Tailwind CSS](https://tailwindcss.com/)
- **Backend**: [Supabase](https://supabase.com/) (Auth, Database, Storage)
- **Visuals**: Framer Motion (Animations), custom SVG generation
- **Integration**: Discord API & Bot Token for server-role synchronization

---

## 🚀 Quick Start (For Cowboys)

1.  **Claim Your Pack**: Head to **My Vault** and claim your starting 3 cards.
2.  **Check the News**: Stay updated with the **Frontier News** on the main dashboard.
3.  **Trade Cards**: Visit the **Trading Post** to swap your duplicates for rare items.
4.  **Bet Big**: Test your luck in the **Saloon**'s poker room.

Happy trails, partner! 🤠🏜️🌵
