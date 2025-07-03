-- Create the app_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_settings (
    id INT PRIMARY KEY DEFAULT 1, -- Ensures only one row for settings
    latest_movie_ids JSONB DEFAULT '[]'::JSONB, -- Stores an array of movie IDs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert a default row if it doesn't exist (for initial setup)
INSERT INTO app_settings (id, latest_movie_ids)
VALUES (1, '[]'::JSONB)
ON CONFLICT (id) DO NOTHING;

-- Optional: Add a trigger to update 'updated_at' on every row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON app_settings;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON app_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
