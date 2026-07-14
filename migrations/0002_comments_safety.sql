CREATE TRIGGER comments_rate_limit_before_insert
BEFORE INSERT ON comments
WHEN EXISTS (
  SELECT 1
  FROM comments
  WHERE ip_hash = NEW.ip_hash
    AND datetime(created_at) >= datetime('now', '-45 seconds')
)
BEGIN
  SELECT RAISE(ABORT, 'comment_rate_limited');
END;

CREATE TRIGGER comments_parent_guard_before_insert
BEFORE INSERT ON comments
WHEN NEW.parent_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM comments AS parent
    WHERE parent.id = NEW.parent_id
      AND parent.resource_type = NEW.resource_type
      AND parent.resource_id = NEW.resource_id
      AND parent.status = 'published'
      AND parent.parent_id IS NULL
  )
BEGIN
  SELECT RAISE(ABORT, 'invalid_parent');
END;
