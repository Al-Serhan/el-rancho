export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  role: string | null;
  gold_coins: number;
}

export interface Card {
  id: string;
  name: string;
  rarity: string;
  image_url: string | null;
  special_attribute: string | null;
  description: string | null;
}

export interface UserInventory {
  id: string;
  user_id: string;
  card_id: string;
  acquired_at: string;
  cards: Card;
}

export type TradeStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface Trade {
  id: string;
  initiator_id: string;
  receiver_id: string;
  status: TradeStatus;
  created_at: string;
  updated_at: string;
  initiator?: { username: string | null };
  trade_items?: TradeItem[];
}

export interface TradeItem {
  id: string;
  trade_id: string;
  inventory_id: string;
  owner_id: string;
  user_inventory?: UserInventory;
}
