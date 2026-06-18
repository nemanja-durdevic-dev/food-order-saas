CREATE TABLE IF NOT EXISTS daily_order_counters (
  date date PRIMARY KEY DEFAULT CURRENT_DATE,
  last_number integer NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION increment_order_number()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_number integer;
BEGIN
  INSERT INTO daily_order_counters (date, last_number)
  VALUES (CURRENT_DATE, 1)
  ON CONFLICT (date)
  DO UPDATE SET last_number = daily_order_counters.last_number + 1
  RETURNING last_number INTO new_number;

  RETURN new_number;
END;
$$;
