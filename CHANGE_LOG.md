# Change Log

## [2026-04-28] - Poker Game & Leaderboard

### Added
- **Database Migration**: Added `gold_coins` column to `profiles` (default 100).
- **Poker Room**: New 5-Card Draw poker minigame at `/dashboard/poker`.
- **Leaderboard**: Public ranking of top cowboys by gold at `/dashboard/leaderboard`.
- **Server Action**: Secure `resolvePokerGame` action to handle bets and payouts.
- **Components**: `PokerTable` client component for game state management.

### Changed
- **Dashboard**: Added "Poker Room" and "Leaderboard" tiles. Displaying current gold in sidebar.
- **Navbar**: Integrated Poker and Leaderboard tabs.
- **Type Safety**: Updated `Profile` interface with `gold_coins`.

## [2026-04-27] - Card Trading System Implementation

### Added
- **Database Migration**: Created `supabase/migrations/20260427221924_add_trading.sql` containing `trades` and `trade_items` tables and the `accept_trade` RPC.
- **Trading Dashboard**: New page at `/dashboard/trades` for managing card swaps.
- **Components**: 
  - `TradeProposer`: Interactive UI for creating trade proposals.
  - `TradeInbox`: UI for viewing and accepting/rejecting incoming trade requests.
- **Type Definitions**: Established `src/types/database.ts` for consistent data structures across the application.

### Changed
- **Dashboard**: Added a link to the "Trading Post" from the main sheriff's office.
- **Type Safety**: Refactored components to remove `any` types and ensure strict TypeScript compliance.

### Fixed
- **ESLint**: Resolved unescaped entity warnings and explicit `any` errors in trading components.
