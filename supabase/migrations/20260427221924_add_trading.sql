-- Create trades table
CREATE TYPE trade_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');

CREATE TABLE public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status trade_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create trade_items table
CREATE TABLE public.trade_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES public.user_inventory(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trades
CREATE POLICY "Users can view trades they are involved in." 
ON public.trades FOR SELECT 
USING (auth.uid() = initiator_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create trades." 
ON public.trades FOR INSERT 
WITH CHECK (auth.uid() = initiator_id);

CREATE POLICY "Users can update their own trades (cancel/reject/accept)." 
ON public.trades FOR UPDATE 
USING (auth.uid() = initiator_id OR auth.uid() = receiver_id);

-- RLS Policies for trade_items
CREATE POLICY "Users can view trade items for their trades." 
ON public.trade_items FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.trades 
    WHERE trades.id = trade_items.trade_id 
    AND (trades.initiator_id = auth.uid() OR trades.receiver_id = auth.uid())
  )
);

CREATE POLICY "Users can insert items into their trades." 
ON public.trade_items FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trades 
    WHERE trades.id = trade_items.trade_id 
    AND trades.initiator_id = auth.uid()
  )
);

-- Accept Trade RPC
CREATE OR REPLACE FUNCTION accept_trade(p_trade_id UUID)
RETURNS VOID AS $$
DECLARE
  v_trade RECORD;
  v_item RECORD;
BEGIN
  -- 1. Lock the trade row for update to prevent concurrent acceptances
  SELECT * INTO v_trade FROM public.trades WHERE id = p_trade_id FOR UPDATE;
  
  -- 2. Validate trade status
  IF v_trade.status != 'pending' THEN
    RAISE EXCEPTION 'Trade is no longer pending';
  END IF;

  -- 3. Check if current user is the receiver
  IF v_trade.receiver_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the receiver can accept the trade';
  END IF;

  -- 4. Verify all items are still owned by the respective parties
  FOR v_item IN (SELECT * FROM public.trade_items WHERE trade_id = p_trade_id) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.user_inventory 
      WHERE id = v_item.inventory_id AND user_id = v_item.owner_id
    ) THEN
      RAISE EXCEPTION 'One or more cards are no longer in the owner inventory';
    END IF;
  END LOOP;

  -- 5. Perform the swap
  FOR v_item IN (SELECT * FROM public.trade_items WHERE trade_id = p_trade_id) LOOP
    -- If owner is initiator, move to receiver. If owner is receiver, move to initiator.
    IF v_item.owner_id = v_trade.initiator_id THEN
      UPDATE public.user_inventory SET user_id = v_trade.receiver_id WHERE id = v_item.inventory_id;
    ELSE
      UPDATE public.user_inventory SET user_id = v_trade.initiator_id WHERE id = v_item.inventory_id;
    END IF;
  END LOOP;

  -- 6. Mark trade as accepted
  UPDATE public.trades SET status = 'accepted', updated_at = now() WHERE id = p_trade_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
