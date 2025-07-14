-- Add frequency field to recurring_transactions table
-- This allows users to set different frequencies for recurring transactions

-- Add frequency enum type
CREATE TYPE frequency_type AS ENUM ('monthly', 'quarterly', 'yearly');

-- Add frequency column to recurring_transactions table
ALTER TABLE recurring_transactions 
ADD COLUMN frequency frequency_type NOT NULL DEFAULT 'monthly';

-- Add month_of_year and day_of_year columns for yearly/quarterly frequencies
ALTER TABLE recurring_transactions 
ADD COLUMN month_of_year INTEGER CHECK (month_of_year BETWEEN 1 AND 12),
ADD COLUMN day_of_year INTEGER CHECK (day_of_year BETWEEN 1 AND 366);

-- Update existing records to have monthly frequency
UPDATE recurring_transactions SET frequency = 'monthly' WHERE frequency IS NULL;

-- Add check constraint to ensure proper date fields are set based on frequency
ALTER TABLE recurring_transactions 
ADD CONSTRAINT check_frequency_date_fields CHECK (
  (frequency = 'monthly' AND month_of_year IS NULL AND day_of_year IS NULL) OR
  (frequency = 'quarterly' AND month_of_year IS NOT NULL AND day_of_month IS NOT NULL AND day_of_year IS NULL) OR
  (frequency = 'yearly' AND month_of_year IS NOT NULL AND day_of_month IS NOT NULL AND day_of_year IS NULL)
);

-- Create index for performance
CREATE INDEX idx_recurring_transactions_frequency ON recurring_transactions(frequency);