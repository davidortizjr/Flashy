CREATE TABLE IF NOT EXISTS users (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS decks (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  source         TEXT NOT NULL DEFAULT 'photo', -- 'photo' | 'text'
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cards (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  deck_id        TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  position       INTEGER NOT NULL DEFAULT 0,
  front          TEXT NOT NULL,
  back           TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_decks_user_id ON decks(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON cards(deck_id);