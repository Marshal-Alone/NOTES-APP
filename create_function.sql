-- Drop existing tables


-- Create notes table
CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author_name TEXT NOT NULL,
    branch TEXT NOT NULL,
    year INTEGER NOT NULL,
    semester TEXT NOT NULL,
    subject TEXT NOT NULL,
    filename TEXT NOT NULL,
    device_id TEXT NOT NULL,
    avg_rating FLOAT DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create ratings table
CREATE TABLE ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_id INTEGER NOT NULL,
    device_id TEXT NOT NULL,
    rating INTEGER NOT NULL,
    rated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(note_id) REFERENCES notes(id),
    UNIQUE(note_id, device_id)
);

-- Create blocked_devices table
CREATE TABLE blocked_devices (
    device_id TEXT PRIMARY KEY,
    blocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reason TEXT
);
