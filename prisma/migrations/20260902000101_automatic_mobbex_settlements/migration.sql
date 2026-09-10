-- PostgreSQL requires this enum value to be committed before it can be used.
-- Keep this migration isolated; the following migration consumes AUTOMATIC.
ALTER TYPE "SettlementFrequency" ADD VALUE IF NOT EXISTS 'AUTOMATIC';
