-- Contract completion triggers insert point_transactions.type = 'care_given' (and historically
-- 'care_received' for owners). If the table was created with a different CHECK (e.g. only
-- earned/spent), inserts fail with 23514 on point_transactions_type_check.

ALTER TABLE public.point_transactions DROP CONSTRAINT IF EXISTS point_transactions_type_check;

ALTER TABLE public.point_transactions
  ADD CONSTRAINT point_transactions_type_check CHECK (
    type IN (
      'care_given',
      'care_received',
      'earned',
      'spent',
      'given',
      'received',
      'bonus',
      'adjustment',
      'refund'
    )
  );
