-- JCEA Editorial System — SQLite schema
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  affiliation TEXT DEFAULT '',
  country TEXT DEFAULT '',
  orcid TEXT DEFAULT '',
  roles TEXT NOT NULL DEFAULT 'author', -- comma-separated: author,reviewer,editor,eic,admin
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS manuscripts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT UNIQUE,                  -- e.g. JCEA-2026-0007, assigned on submit
  title TEXT NOT NULL DEFAULT '',
  abstract TEXT NOT NULL DEFAULT '',
  keywords TEXT NOT NULL DEFAULT '[]', -- JSON array
  categories TEXT NOT NULL DEFAULT '[]',
  cover_letter TEXT NOT NULL DEFAULT '',
  recommended_reviewers TEXT NOT NULL DEFAULT '[]', -- JSON [{name,affiliation,email,reason}]
  status TEXT NOT NULL DEFAULT 'draft',
  -- draft | submitted | under_review | revision_requested | revised | accepted | rejected | withdrawn | published
  corresponding_author_id INTEGER NOT NULL REFERENCES users(id),
  handling_editor_id INTEGER REFERENCES users(id),
  consent_podcast INTEGER NOT NULL DEFAULT 0,
  consent_summary INTEGER NOT NULL DEFAULT 0,
  consent_viz INTEGER NOT NULL DEFAULT 0,
  checklist TEXT NOT NULL DEFAULT '{}', -- plagiarism/ethics/funding confirmations
  funding TEXT DEFAULT '',
  ethics_statement TEXT DEFAULT '',
  round INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  submitted_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS manuscript_authors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  manuscript_id INTEGER NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  affiliation TEXT DEFAULT '',
  country TEXT DEFAULT '',
  orcid TEXT DEFAULT '',
  is_corresponding INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS manuscript_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  manuscript_id INTEGER NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'manuscript', -- manuscript | supplementary | revision | review_attachment
  filename TEXT NOT NULL,
  stored_path TEXT NOT NULL,
  size INTEGER NOT NULL DEFAULT 0,
  mime TEXT DEFAULT '',
  round INTEGER NOT NULL DEFAULT 1,
  uploaded_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reviewer_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  manuscript_id INTEGER NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
  reviewer_user_id INTEGER REFERENCES users(id),
  reviewer_name TEXT NOT NULL,
  reviewer_email TEXT DEFAULT '',
  reviewer_affiliation TEXT DEFAULT '',
  source TEXT NOT NULL DEFAULT 'manual', -- intuitionist | manual | author_recommended
  intuitionist_data TEXT DEFAULT NULL,   -- JSON snapshot of candidate record
  status TEXT NOT NULL DEFAULT 'invited', -- invited | accepted | declined | completed | cancelled
  round INTEGER NOT NULL DEFAULT 1,
  due_date TEXT,
  invited_at TEXT NOT NULL DEFAULT (datetime('now')),
  responded_at TEXT,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id INTEGER NOT NULL UNIQUE REFERENCES reviewer_assignments(id) ON DELETE CASCADE,
  manuscript_id INTEGER NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
  round INTEGER NOT NULL DEFAULT 1,
  recommendation TEXT, -- accept | minor_revision | major_revision | reject
  comments_general TEXT DEFAULT '',
  comments_sections TEXT DEFAULT '', -- specific comments by section
  comments_confidential TEXT DEFAULT '',
  score_novelty INTEGER,
  score_rigor INTEGER,
  score_significance INTEGER,
  score_clarity INTEGER,
  conflict_declared INTEGER NOT NULL DEFAULT 0,
  file_id INTEGER REFERENCES manuscript_files(id),
  status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress | submitted
  submitted_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  manuscript_id INTEGER NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
  round INTEGER NOT NULL DEFAULT 1,
  decision TEXT NOT NULL, -- accept | minor_revision | major_revision | reject
  letter TEXT DEFAULT '',
  decided_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS editorial_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  manuscript_id INTEGER NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
  actor_user_id INTEGER REFERENCES users(id),
  type TEXT NOT NULL, -- submitted | status_change | editor_assigned | reviewer_invited | reviewer_responded | review_submitted | decision | revision_uploaded | published | ai_event
  description TEXT NOT NULL DEFAULT '',
  meta TEXT DEFAULT '{}',
  visible_to_author INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS issues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  volume INTEGER NOT NULL,
  number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  title TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'planning', -- planning | in_progress | published
  published_at TEXT,
  UNIQUE(volume, number)
);

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  manuscript_id INTEGER REFERENCES manuscripts(id),
  issue_id INTEGER REFERENCES issues(id),
  title TEXT NOT NULL,
  authors_display TEXT NOT NULL DEFAULT '', -- "Jane Kim, Taro Sato"
  authors_json TEXT NOT NULL DEFAULT '[]',  -- [{name, affiliation, orcid}]
  abstract TEXT DEFAULT '',
  keywords TEXT NOT NULL DEFAULT '[]',
  pages TEXT DEFAULT '',
  doi TEXT DEFAULT '',
  doi_status TEXT NOT NULL DEFAULT 'none', -- none | prepared | registered
  doi_metadata TEXT DEFAULT NULL, -- JSON prepared for KoreaScience
  koreascience_url TEXT DEFAULT '',
  pdf_url TEXT DEFAULT '',
  article_type TEXT DEFAULT 'Research Article',
  order_in_issue INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  manuscript_id INTEGER REFERENCES manuscripts(id) ON DELETE CASCADE,
  article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- podcast | summary | visualization
  status TEXT NOT NULL DEFAULT 'pending', -- pending | generating | generated | approved | rejected | failed
  content TEXT DEFAULT NULL,   -- JSON: summary struct, podcast script, or viz descriptors
  file_path TEXT DEFAULT NULL, -- audio file for podcasts
  error TEXT DEFAULT NULL,
  created_by INTEGER REFERENCES users(id),
  approved_by INTEGER REFERENCES users(id),
  approved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cms_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  html TEXT NOT NULL DEFAULT '',
  nav_order INTEGER NOT NULL DEFAULT 100,
  show_in_nav INTEGER NOT NULL DEFAULT 0,
  updated_by INTEGER REFERENCES users(id),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS board_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Editorial Board',
  affiliation TEXT DEFAULT '',
  country TEXT DEFAULT '',
  email TEXT DEFAULT '',
  research_areas TEXT NOT NULL DEFAULT '[]',
  photo_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 100,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  published INTEGER NOT NULL DEFAULT 1,
  published_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_ms_status ON manuscripts(status);
CREATE INDEX IF NOT EXISTS idx_ms_author ON manuscripts(corresponding_author_id);
CREATE INDEX IF NOT EXISTS idx_ra_ms ON reviewer_assignments(manuscript_id);
CREATE INDEX IF NOT EXISTS idx_ra_reviewer ON reviewer_assignments(reviewer_user_id);
CREATE INDEX IF NOT EXISTS idx_ev_ms ON editorial_events(manuscript_id);
CREATE INDEX IF NOT EXISTS idx_articles_issue ON articles(issue_id);
CREATE INDEX IF NOT EXISTS idx_ai_ms ON ai_assets(manuscript_id);
