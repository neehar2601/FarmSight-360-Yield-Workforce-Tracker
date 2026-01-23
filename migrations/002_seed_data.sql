-- ============================================
-- FarmSight 360 - Seed Data
-- PostgreSQL 14+
-- Version: 1.0
-- Date: 2026-01-23
-- ============================================

-- Insert default crop types
INSERT INTO crops (name) VALUES
    ('Tomatoes'),
    ('Potatoes'),
    ('Onions'),
    ('Spinach'),
    ('Wheat'),
    ('Rice'),
    ('Sugarcane'),
    ('Cotton'),
    ('Corn'),
    ('Carrots');

COMMIT;
