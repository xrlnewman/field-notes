CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('article', 'project', 'guestbook')),
  resource_id TEXT NOT NULL,
  parent_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden')),
  ip_hash TEXT NOT NULL
);

CREATE INDEX idx_comments_resource_created
  ON comments (resource_type, resource_id, status, created_at);

CREATE INDEX idx_comments_parent
  ON comments (parent_id);

CREATE INDEX idx_comments_ip_created
  ON comments (ip_hash, created_at);
