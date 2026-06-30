-- Add links column to events table
-- Links stored as JSONB array: [{ "label": "string", "url": "string" }]

ALTER TABLE events
ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN events.links IS 'Array of external links for the event, e.g. maps, registration, scholarship forms. Format: [{""label"": ""Harita"", ""url"": ""https://...""}]';
