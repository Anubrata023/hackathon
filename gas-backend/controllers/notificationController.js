const { getDB } = require('../database/db');

// ── Get all notifications for logged-in user ──────────────────────────────────
exports.getMyNotifications = (req, res) => {
  const db   = getDB();
  const rows = db.prepare(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
  ).all(req.user.id);

  const unread = rows.filter(n => !n.is_read).length;
  res.json({ success: true, notifications: rows, unread_count: unread });
};

// ── Mark single notification as read ─────────────────────────────────────────
exports.markAsRead = (req, res) => {
  const db = getDB();
  const n  = db.prepare('SELECT id FROM notifications WHERE id = ? AND user_id = ?')
               .get(req.params.id, req.user.id);

  if (!n) return res.status(404).json({ success: false, message: 'Notification not found' });

  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Marked as read' });
};

// ── Mark ALL notifications as read ────────────────────────────────────────────
exports.markAllAsRead = (req, res) => {
  const db = getDB();
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ success: true, message: 'All notifications marked as read' });
};

// ── Delete a notification ─────────────────────────────────────────────────────
exports.deleteNotification = (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user.id);
  res.json({ success: true, message: 'Notification deleted' });
};
