-- AI Assistant Configuration Table
-- Run this in Supabase SQL Editor

-- Create the ai_assistant_config table
CREATE TABLE IF NOT EXISTS ai_assistant_config (
  id SERIAL PRIMARY KEY,
  api_provider VARCHAR(50) NOT NULL DEFAULT 'openrouter',
  api_key TEXT NOT NULL,
  model VARCHAR(100) NOT NULL DEFAULT 'z-ai/glm-4.5-air:free',
  api_base_url VARCHAR(255) NOT NULL DEFAULT 'https://openrouter.ai/api/v1/chat/completions',
  max_tokens INTEGER DEFAULT 2000,
  temperature DECIMAL(2,1) DEFAULT 0.7,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default configuration (you'll need to update the API key)
INSERT INTO ai_assistant_config (api_provider, api_key, model, api_base_url, max_tokens, temperature, is_enabled)
VALUES (
  'openrouter',
  'YOUR_API_KEY_HERE',
  'z-ai/glm-4.5-air:free',
  'https://openrouter.ai/api/v1/chat/completions',
  2000,
  0.7,
  true
)
ON CONFLICT DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_ai_assistant_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ai_assistant_config_updated_at ON ai_assistant_config;
CREATE TRIGGER ai_assistant_config_updated_at
  BEFORE UPDATE ON ai_assistant_config
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_assistant_config_updated_at();

-- Add RLS policies (optional - adjust based on your needs)
ALTER TABLE ai_assistant_config ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read config
CREATE POLICY "Allow authenticated read" ON ai_assistant_config
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to update config
CREATE POLICY "Allow authenticated update" ON ai_assistant_config
  FOR UPDATE TO authenticated USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access" ON ai_assistant_config
  FOR ALL TO service_role USING (true);
