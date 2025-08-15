-- ============================================================================
-- Claude Split Bill App - Database Migration
-- ============================================================================
-- This file creates all the necessary tables, relationships, indexes, and
-- Row Level Security policies for the Claude Split Bill App.
--
-- Run this in your Supabase SQL Editor to set up the complete database schema.
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
-- Note: This extends Supabase's built-in auth.users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- ============================================================================
-- 2. FRIENDSHIPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT unique_friendship UNIQUE(requester_id, addressee_id),
  CONSTRAINT no_self_friendship CHECK(requester_id != addressee_id)
);

-- Create indexes for friendships table
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON public.friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

-- ============================================================================
-- 3. HANGOUTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.hangouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  location_name TEXT,
  location_address TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  hangout_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for hangouts table
CREATE INDEX IF NOT EXISTS idx_hangouts_created_by ON public.hangouts(created_by);
CREATE INDEX IF NOT EXISTS idx_hangouts_status ON public.hangouts(status);
CREATE INDEX IF NOT EXISTS idx_hangouts_date ON public.hangouts(hangout_date);
CREATE INDEX IF NOT EXISTS idx_hangouts_location ON public.hangouts(latitude, longitude);

-- ============================================================================
-- 4. HANGOUT_PARTICIPANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.hangout_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hangout_id UUID NOT NULL REFERENCES public.hangouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  participation_status TEXT NOT NULL DEFAULT 'active' CHECK (participation_status IN ('invited', 'active', 'left')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT unique_hangout_participant UNIQUE(hangout_id, user_id)
);

-- Create indexes for hangout_participants table
CREATE INDEX IF NOT EXISTS idx_hangout_participants_hangout ON public.hangout_participants(hangout_id);
CREATE INDEX IF NOT EXISTS idx_hangout_participants_user ON public.hangout_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_hangout_participants_status ON public.hangout_participants(participation_status);

-- ============================================================================
-- 5. BILLS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hangout_id UUID NOT NULL REFERENCES public.hangouts(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  paid_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  tip_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'settled', 'cancelled')),
  bill_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT unique_hangout_bill UNIQUE(hangout_id),
  CONSTRAINT positive_amounts CHECK (subtotal >= 0 AND tax_amount >= 0 AND tip_amount >= 0 AND total_amount >= 0)
);

-- Create indexes for bills table
CREATE INDEX IF NOT EXISTS idx_bills_hangout ON public.bills(hangout_id);
CREATE INDEX IF NOT EXISTS idx_bills_created_by ON public.bills(created_by);
CREATE INDEX IF NOT EXISTS idx_bills_paid_by ON public.bills(paid_by);
CREATE INDEX IF NOT EXISTS idx_bills_status ON public.bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_date ON public.bills(bill_date);

-- ============================================================================
-- 6. BILL_ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bill_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_price DECIMAL(10,2) NOT NULL,
  total_quantity INTEGER NOT NULL DEFAULT 1,
  total_amount DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT positive_price CHECK (item_price >= 0),
  CONSTRAINT positive_quantity CHECK (total_quantity > 0),
  CONSTRAINT valid_total_amount CHECK (total_amount = item_price * total_quantity)
);

-- Create indexes for bill_items table
CREATE INDEX IF NOT EXISTS idx_bill_items_bill ON public.bill_items(bill_id);

-- ============================================================================
-- 7. ITEM_ASSIGNMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.item_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_item_id UUID NOT NULL REFERENCES public.bill_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  assigned_amount DECIMAL(10,2) NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT unique_item_assignment UNIQUE(bill_item_id, user_id),
  CONSTRAINT positive_assigned_quantity CHECK (quantity > 0),
  CONSTRAINT positive_assigned_amount CHECK (assigned_amount >= 0)
);

-- Create indexes for item_assignments table
CREATE INDEX IF NOT EXISTS idx_item_assignments_bill_item ON public.item_assignments(bill_item_id);
CREATE INDEX IF NOT EXISTS idx_item_assignments_user ON public.item_assignments(user_id);

-- ============================================================================
-- 8. PARTICIPANT_BALANCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.participant_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  total_owed DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  balance_remaining DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'settled')),
  last_payment_date TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT unique_participant_balance UNIQUE(bill_id, user_id),
  CONSTRAINT valid_balance CHECK (balance_remaining = total_owed - amount_paid),
  CONSTRAINT non_negative_amounts CHECK (total_owed >= 0 AND amount_paid >= 0 AND balance_remaining >= 0)
);

-- Create indexes for participant_balances table
CREATE INDEX IF NOT EXISTS idx_participant_balances_bill ON public.participant_balances(bill_id);
CREATE INDEX IF NOT EXISTS idx_participant_balances_user ON public.participant_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_participant_balances_status ON public.participant_balances(payment_status);

-- ============================================================================
-- 9. PAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  transaction_id TEXT,
  notes TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT no_self_payment CHECK (from_user_id != to_user_id),
  CONSTRAINT positive_payment_amount CHECK (amount > 0)
);

-- Create indexes for payments table
CREATE INDEX IF NOT EXISTS idx_payments_bill ON public.payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_payments_from_user ON public.payments(from_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_to_user ON public.payments(to_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- ============================================================================
-- 10. HANGOUT_ACTIVITIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.hangout_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hangout_id UUID NOT NULL REFERENCES public.hangouts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'hangout_created', 'participant_added', 'participant_removed',
    'bill_scanned', 'item_added', 'item_removed',
    'item_assigned', 'item_unassigned', 'payment_made',
    'bill_settled', 'hangout_completed'
  )),
  activity_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for hangout_activities table
CREATE INDEX IF NOT EXISTS idx_hangout_activities_hangout ON public.hangout_activities(hangout_id);
CREATE INDEX IF NOT EXISTS idx_hangout_activities_user ON public.hangout_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_hangout_activities_type ON public.hangout_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_hangout_activities_created ON public.hangout_activities(created_at);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for tables with updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hangouts_updated_at BEFORE UPDATE ON public.hangouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON public.bills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hangouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hangout_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hangout_activities ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR USERS TABLE
-- ============================================================================

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- RLS POLICIES FOR FRIENDSHIPS TABLE
-- ============================================================================

-- Users can view friendships they're involved in
CREATE POLICY "Users can view own friendships" ON public.friendships
  FOR SELECT USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- Users can create friend requests
CREATE POLICY "Users can create friend requests" ON public.friendships
  FOR INSERT WITH CHECK (requester_id = auth.uid());

-- Users can update friendships they're involved in
CREATE POLICY "Users can update own friendships" ON public.friendships
  FOR UPDATE USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- ============================================================================
-- RLS POLICIES FOR HANGOUTS TABLE
-- ============================================================================

-- Users can view hangouts they participate in
CREATE POLICY "Users can view participated hangouts" ON public.hangouts
  FOR SELECT USING (
    id IN (
      SELECT hangout_id 
      FROM public.hangout_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Users can create hangouts
CREATE POLICY "Users can create hangouts" ON public.hangouts
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Users can update hangouts they created
CREATE POLICY "Users can update own hangouts" ON public.hangouts
  FOR UPDATE USING (created_by = auth.uid());

-- ============================================================================
-- RLS POLICIES FOR HANGOUT_PARTICIPANTS TABLE
-- ============================================================================

-- Users can view participants of hangouts they're in
CREATE POLICY "Users can view hangout participants" ON public.hangout_participants
  FOR SELECT USING (
    hangout_id IN (
      SELECT hangout_id 
      FROM public.hangout_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Hangout creators can add participants
CREATE POLICY "Creators can add participants" ON public.hangout_participants
  FOR INSERT WITH CHECK (
    hangout_id IN (
      SELECT id 
      FROM public.hangouts 
      WHERE created_by = auth.uid()
    )
  );

-- Users can join hangouts they're invited to
CREATE POLICY "Users can join hangouts" ON public.hangout_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES FOR BILLS TABLE
-- ============================================================================

-- Users can view bills from hangouts they participate in
CREATE POLICY "Users can view participated bills" ON public.bills
  FOR SELECT USING (
    hangout_id IN (
      SELECT hangout_id 
      FROM public.hangout_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Users can create bills for hangouts they participate in
CREATE POLICY "Users can create bills" ON public.bills
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    hangout_id IN (
      SELECT hangout_id 
      FROM public.hangout_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Bill creators can update their bills
CREATE POLICY "Users can update own bills" ON public.bills
  FOR UPDATE USING (created_by = auth.uid());

-- ============================================================================
-- RLS POLICIES FOR BILL_ITEMS TABLE
-- ============================================================================

-- Users can view items from bills they participate in
CREATE POLICY "Users can view bill items" ON public.bill_items
  FOR SELECT USING (
    bill_id IN (
      SELECT b.id 
      FROM public.bills b
      JOIN public.hangout_participants hp ON b.hangout_id = hp.hangout_id
      WHERE hp.user_id = auth.uid()
    )
  );

-- Users can add items to bills they participate in
CREATE POLICY "Users can add bill items" ON public.bill_items
  FOR INSERT WITH CHECK (
    bill_id IN (
      SELECT b.id 
      FROM public.bills b
      JOIN public.hangout_participants hp ON b.hangout_id = hp.hangout_id
      WHERE hp.user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES FOR ITEM_ASSIGNMENTS TABLE
-- ============================================================================

-- Users can view assignments from bills they participate in
CREATE POLICY "Users can view item assignments" ON public.item_assignments
  FOR SELECT USING (
    bill_item_id IN (
      SELECT bi.id 
      FROM public.bill_items bi
      JOIN public.bills b ON bi.bill_id = b.id
      JOIN public.hangout_participants hp ON b.hangout_id = hp.hangout_id
      WHERE hp.user_id = auth.uid()
    )
  );

-- Users can create assignments for bills they participate in
CREATE POLICY "Users can create item assignments" ON public.item_assignments
  FOR INSERT WITH CHECK (
    bill_item_id IN (
      SELECT bi.id 
      FROM public.bill_items bi
      JOIN public.bills b ON bi.bill_id = b.id
      JOIN public.hangout_participants hp ON b.hangout_id = hp.hangout_id
      WHERE hp.user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES FOR PARTICIPANT_BALANCES TABLE
-- ============================================================================

-- Users can view their own balances
CREATE POLICY "Users can view own balances" ON public.participant_balances
  FOR SELECT USING (user_id = auth.uid());

-- System can manage balances (this might need adjustment based on your app logic)
CREATE POLICY "System can manage balances" ON public.participant_balances
  FOR ALL USING (
    bill_id IN (
      SELECT b.id 
      FROM public.bills b
      JOIN public.hangout_participants hp ON b.hangout_id = hp.hangout_id
      WHERE hp.user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES FOR PAYMENTS TABLE
-- ============================================================================

-- Users can view payments they sent or received
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

-- Users can create payments they're sending
CREATE POLICY "Users can create payments" ON public.payments
  FOR INSERT WITH CHECK (from_user_id = auth.uid());

-- Users can update payments they created
CREATE POLICY "Users can update own payments" ON public.payments
  FOR UPDATE USING (from_user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES FOR HANGOUT_ACTIVITIES TABLE
-- ============================================================================

-- Users can view activities from hangouts they participate in
CREATE POLICY "Users can view hangout activities" ON public.hangout_activities
  FOR SELECT USING (
    hangout_id IN (
      SELECT hangout_id 
      FROM public.hangout_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Users can create activities for hangouts they participate in
CREATE POLICY "Users can create hangout activities" ON public.hangout_activities
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    hangout_id IN (
      SELECT hangout_id 
      FROM public.hangout_participants 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- ============================================================================

-- Function to calculate participant balances based on item assignments
CREATE OR REPLACE FUNCTION calculate_participant_balance(p_bill_id UUID, p_user_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_owed DECIMAL := 0;
BEGIN
  SELECT COALESCE(SUM(assigned_amount), 0)
  INTO total_owed
  FROM public.item_assignments ia
  JOIN public.bill_items bi ON ia.bill_item_id = bi.id
  WHERE bi.bill_id = p_bill_id AND ia.user_id = p_user_id;
  
  RETURN total_owed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update participant balances when assignments change
CREATE OR REPLACE FUNCTION update_participant_balances()
RETURNS TRIGGER AS $$
DECLARE
  bill_id_var UUID;
  user_id_var UUID;
  new_total DECIMAL;
  current_paid DECIMAL;
BEGIN
  -- Get the bill_id and user_id from the assignment
  IF TG_OP = 'DELETE' THEN
    SELECT bi.bill_id INTO bill_id_var
    FROM public.bill_items bi
    WHERE bi.id = OLD.bill_item_id;
    user_id_var := OLD.user_id;
  ELSE
    SELECT bi.bill_id INTO bill_id_var
    FROM public.bill_items bi
    WHERE bi.id = NEW.bill_item_id;
    user_id_var := NEW.user_id;
  END IF;
  
  -- Calculate new total owed
  new_total := calculate_participant_balance(bill_id_var, user_id_var);
  
  -- Get current amount paid
  SELECT COALESCE(amount_paid, 0) INTO current_paid
  FROM public.participant_balances
  WHERE bill_id = bill_id_var AND user_id = user_id_var;
  
  -- Upsert the balance record
  INSERT INTO public.participant_balances (bill_id, user_id, total_owed, amount_paid, balance_remaining)
  VALUES (bill_id_var, user_id_var, new_total, COALESCE(current_paid, 0), new_total - COALESCE(current_paid, 0))
  ON CONFLICT (bill_id, user_id)
  DO UPDATE SET
    total_owed = new_total,
    balance_remaining = new_total - participant_balances.amount_paid;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update balances when assignments change
CREATE TRIGGER update_balances_on_assignment_change
  AFTER INSERT OR UPDATE OR DELETE ON public.item_assignments
  FOR EACH ROW EXECUTE FUNCTION update_participant_balances();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add a comment to track migration
COMMENT ON SCHEMA public IS 'Claude Split Bill App - Database schema created on ' || NOW();
