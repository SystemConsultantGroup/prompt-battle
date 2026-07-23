CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS problems (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  time_limit_sec INTEGER NOT NULL,
  target_html TEXT NOT NULL,
  target_css TEXT NOT NULL,
  target_js TEXT NOT NULL,
  detail_weight REAL NOT NULL DEFAULT 0.3,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS criteria (
  id INTEGER PRIMARY KEY,
  problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
