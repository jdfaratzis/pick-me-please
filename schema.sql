-- Drop tables if they exist to ensure a clean setup (optional, for development)
DROP TABLE IF EXISTS app_settings;
DROP TABLE IF EXISTS requests;

-- Table for storing song requests
CREATE TABLE requests (
    id SERIAL PRIMARY KEY,
    spotify_track_id VARCHAR(255) NULL,
    song_name VARCHAR(255) NOT NULL,
    artist_names TEXT NULL,
    album_name VARCHAR(255) NULL,
    album_artwork_url VARCHAR(512) NULL,
    tiktok_username VARCHAR(100) NULL,
    genre_remix_notes TEXT NULL,
    other_notes TEXT NULL,
    vip_code VARCHAR(50) NULL,
    is_vip BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Playing', 'Rejected', 'Standby', 'Archived')),
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Table for application-level settings (like request acceptance status)
CREATE TABLE app_settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value TEXT NULL -- Store boolean as 'true'/'false' string, or use BOOLEAN type if preferred
);

-- Initial setting for request acceptance status (ensures the key exists on first run)
-- This allows the application to know if requests are open or closed on startup.
INSERT INTO app_settings (setting_key, setting_value) VALUES ('requests_open', 'true')
ON CONFLICT (setting_key) DO NOTHING; -- Avoids error if key already exists
