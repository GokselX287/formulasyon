CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alias TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  occupation TEXT,
  marital_status TEXT,
  referral_source TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS formulations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  presenting_problem TEXT,
  client_goal TEXT,
  therapist_goal TEXT,
  danisan_hedefleri_json TEXT,
  narrative TEXT,
  clinical_notes TEXT,
  rupture_notes TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS formulation_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  formulation_id INTEGER NOT NULL REFERENCES formulations(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_items_formulation_category
  ON formulation_items(formulation_id, category);

CREATE TABLE IF NOT EXISTS flexibility_scores (
  formulation_id INTEGER PRIMARY KEY REFERENCES formulations(id) ON DELETE CASCADE,
  defusion INTEGER DEFAULT 5,
  acceptance INTEGER DEFAULT 5,
  present_moment INTEGER DEFAULT 5,
  self_as_context INTEGER DEFAULT 5,
  values_clarity INTEGER DEFAULT 5,
  committed_action INTEGER DEFAULT 5,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS formulation_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  formulation_id INTEGER NOT NULL REFERENCES formulations(id) ON DELETE CASCADE,
  snapshot_json TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seanslar (
  id TEXT PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tarih TEXT NOT NULL,
  sure INTEGER DEFAULT 50,
  konu TEXT,
  notlar TEXT,
  odev TEXT,
  durum TEXT DEFAULT 'katildi',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  start TEXT NOT NULL,
  end_time TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pending_files (
  id TEXT PRIMARY KEY,
  ad_soyad TEXT NOT NULL,
  randevu_tarihi TEXT NOT NULL,
  not_text TEXT,
  status TEXT DEFAULT 'pending',
  drop_reason TEXT,
  dropped_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sms_log (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  name TEXT,
  message TEXT NOT NULL,
  trigger_type TEXT DEFAULT 'manual',
  status TEXT DEFAULT 'queued',
  error TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  sent_at TEXT
);

CREATE TABLE IF NOT EXISTS clinical_tags (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
