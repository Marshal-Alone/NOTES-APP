const express = require("express");
const fileUpload = require("express-fileupload");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
	fileUpload({
		limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
	})
);

// Database setup with better error handling
const db = new sqlite3.Database("notes.db", async (err) => {
	if (err) {
		console.error("Error opening database:", err);
		process.exit(1);
	}
	console.log("Connected to database successfully");

	try {
		// Create notes table if it doesn't exist
		await new Promise((resolve, reject) => {
			db.run(
				`CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                author_name TEXT NOT NULL,
                branch TEXT NOT NULL,
                year INTEGER NOT NULL,
                semester TEXT NOT NULL,
                subject TEXT NOT NULL,
                filename TEXT NOT NULL,
                device_id TEXT,
                avg_rating FLOAT DEFAULT 0,
                total_ratings INTEGER DEFAULT 0,
                upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
				(err) => {
					if (err) reject(err);
					else resolve();
				}
			);
		});

		// Create blocked_devices table
		await new Promise((resolve, reject) => {
			db.run(
				`CREATE TABLE IF NOT EXISTS blocked_devices (
					device_id TEXT PRIMARY KEY,
					blocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					reason TEXT
				)`,
				(err) => {
					if (err) reject(err);
					else resolve();
				}
			);
		});

		// Create ratings table
		await new Promise((resolve, reject) => {
			db.run(
				`CREATE TABLE IF NOT EXISTS ratings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                note_id INTEGER NOT NULL,
                device_id TEXT NOT NULL,
                rating INTEGER NOT NULL,
                rated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(note_id) REFERENCES notes(id),
                UNIQUE(note_id, device_id)
            )`,
				(err) => {
					if (err) reject(err);
					else resolve();
				}
			);
		});

		console.log("Database initialized successfully with correct schema");
	} catch (error) {
		console.error("Error initializing database:", error);
		process.exit(1);
	}
});

// Handle database errors
db.on("error", (err) => {
	console.error("Database error:", err);
});

// Routes
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Get notes with ratings
app.get("/api/notes/:branch/:year/:semester/:subject", (req, res) => {
	const { branch, year, semester, subject } = req.params;
	db.all(
		`SELECT notes.*, 
            ROUND(avg_rating, 1) as rating,
            total_ratings as num_ratings
        FROM notes 
        WHERE branch = ? AND year = ? AND semester = ? AND subject = ?
        ORDER BY upload_date DESC`,
		[branch, year, semester, subject],
		(err, notes) => {
			if (err) {
				return res.status(500).json({ error: "Server error" });
			}
			res.json(notes);
		}
	);
});

// Upload note
app.post("/api/upload", async (req, res) => {
	try {
		if (!req.files || !req.files.pdf) {
			return res.status(400).json({ error: "No file uploaded" });
		}

		const { title, authorName, branch, year, semester, subject, deviceId } = req.body;

		// Validate required fields
		if (!title || !authorName || !branch || !year || !semester || !subject) {
			return res.status(400).json({
				error: "Missing required fields. Please provide all necessary information.",
			});
		}

		// Validate device ID if provided
		if (deviceId && typeof deviceId !== "string") {
			return res.status(400).json({
				error: "Invalid device ID format",
			});
		}

		const pdf = req.files.pdf;
		const fileName = `${Date.now()}-${pdf.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
		const uploadPath = path.join(__dirname, "uploads", fileName);

		// Create uploads directory if it doesn't exist
		const uploadsDir = path.join(__dirname, "uploads");
		if (!require("fs").existsSync(uploadsDir)) {
			require("fs").mkdirSync(uploadsDir, { recursive: true });
		}
		// Ensure directory permissions
		require("fs").chmodSync(uploadsDir, 0o777);

		// Move the file
		await pdf.mv(uploadPath);

		// Insert into database
		await new Promise((resolve, reject) => {
			db.run(
				"INSERT INTO notes (title, author_name, branch, year, semester, subject, filename, device_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
				[title, authorName, branch, year, semester, subject, fileName, deviceId],
				function (err) {
					if (err) {
						console.error("Database insert error:", err);
						reject(err);
					} else {
						console.log("File uploaded successfully:", fileName);
						resolve(this.lastID);
					}
				}
			);
		});

		res.json({
			message: "Note uploaded successfully",
		});
	} catch (error) {
		console.error("Upload error:", error);
		res.status(500).json({
			error: "Error processing upload",
			details: error.message,
		});
	}
});

// Rate note
app.post("/api/rate/:noteId", async (req, res) => {
	const { noteId } = req.params;
	const { rating, deviceId } = req.body;

	if (!deviceId || !rating || rating < 1 || rating > 5) {
		return res.status(400).json({ error: "Invalid rating or device ID" });
	}

	try {
		// Check if user already rated
		const existingRating = await new Promise((resolve, reject) => {
			db.get(
				"SELECT id FROM ratings WHERE note_id = ? AND device_id = ?",
				[noteId, deviceId],
				(err, row) => {
					if (err) reject(err);
					else resolve(row);
				}
			);
		});

		if (existingRating) {
			return res.status(400).json({ error: "You have already rated this note" });
		}

		// Add new rating
		await new Promise((resolve, reject) => {
			db.run(
				"INSERT INTO ratings (note_id, device_id, rating) VALUES (?, ?, ?)",
				[noteId, deviceId, rating],
				(err) => {
					if (err) reject(err);
					else resolve();
				}
			);
		});

		// Update average rating
		await new Promise((resolve, reject) => {
			db.run(
				`UPDATE notes 
                SET avg_rating = (
                    SELECT AVG(rating) 
                    FROM ratings 
                    WHERE note_id = ?
                ),
                total_ratings = (
                    SELECT COUNT(*) 
                    FROM ratings 
                    WHERE note_id = ?
                )
                WHERE id = ?`,
				[noteId, noteId, noteId],
				(err) => {
					if (err) reject(err);
					else resolve();
				}
			);
		});

		res.json({ message: "Rating added successfully" });
	} catch (error) {
		console.error("Rating error:", error);
		res.status(500).json({ error: "Error processing rating" });
	}
});

// Download note
app.get("/api/download/:id", (req, res) => {
	db.get("SELECT filename FROM notes WHERE id = ?", [req.params.id], (err, note) => {
		if (err || !note) {
			return res.status(404).json({ error: "Note not found" });
		}
		res.download(path.join(__dirname, "uploads", note.filename));
	});
});

// Middleware to check if device is blocked
const checkBlockedDevice = async (req, res, next) => {
	const deviceId = req.body.deviceId || req.query.deviceId;
	if (!deviceId) return next();

	try {
		const blockedDevice = await new Promise((resolve, reject) => {
			db.get("SELECT * FROM blocked_devices WHERE device_id = ?", [deviceId], (err, row) => {
				if (err) reject(err);
				else resolve(row);
			});
		});

		if (blockedDevice) {
			return res.status(403).json({
				error: "This device is blocked",
				reason: blockedDevice.reason,
				blockedAt: blockedDevice.blocked_at,
			});
		}
		next();
	} catch (error) {
		console.error("Blocked device check error:", error);
		next();
	}
};

// Apply device blocking check to all routes
app.use(checkBlockedDevice);

// Basic authentication middleware for developer access
const auth = (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith("Basic ")) {
		res.set("WWW-Authenticate", 'Basic realm="Developer Access"');
		return res.status(401).json({ error: "Unauthorized" });
	}

	const credentials = Buffer.from(authHeader.split(" ")[1], "base64").toString().split(":");
	const [username, password] = credentials;

	// Replace with your actual developer credentials
	if (username === "developer" && password === "securepassword") {
		return next();
	}

	res.set("WWW-Authenticate", 'Basic realm="Developer Access"');
	return res.status(401).json({ error: "Unauthorized" });
};

// Get device ID for a specific note
app.get("/api/dev/note-device/:id", auth, async (req, res) => {
	const { id } = req.params;

	try {
		const note = await new Promise((resolve, reject) => {
			db.get("SELECT device_id FROM notes WHERE id = ?", [id], (err, row) => {
				if (err) reject(err);
				else resolve(row);
			});
		});

		if (!note) {
			return res.status(404).json({ error: "Note not found" });
		}

		res.json({ device_id: note.device_id });
	} catch (error) {
		console.error("Device ID lookup error:", error);
		res.status(500).json({ error: "Error getting device ID" });
	}
});

// Developer endpoints for managing blocked devices
app.post("/api/dev/block-device", auth, async (req, res) => {
	const { deviceId, noteId, reason } = req.body;

	if (!deviceId && !noteId) {
		return res.status(400).json({ error: "Either device ID or note ID is required" });
	}

	let targetDeviceId = deviceId;

	if (noteId) {
		const note = await new Promise((resolve, reject) => {
			db.get("SELECT device_id FROM notes WHERE id = ?", [noteId], (err, row) => {
				if (err) reject(err);
				else resolve(row);
			});
		});

		if (!note) {
			return res.status(404).json({ error: "Note not found" });
		}

		if (!note.device_id) {
			return res.status(400).json({ error: "This note has no associated device ID" });
		}

		targetDeviceId = note.device_id;
	}

	try {
		await new Promise((resolve, reject) => {
			db.run(
				"INSERT OR REPLACE INTO blocked_devices (device_id, reason) VALUES (?, ?)",
				[deviceId, reason || null],
				(err) => {
					if (err) reject(err);
					else resolve();
				}
			);
		});
		res.json({ message: "Device blocked successfully" });
	} catch (error) {
		console.error("Block device error:", error);
		res.status(500).json({ error: "Failed to block device" });
	}
});

app.delete("/api/dev/unblock-device/:deviceId", auth, async (req, res) => {
	const { deviceId } = req.params;
	if (!deviceId) {
		return res.status(400).json({ error: "Device ID is required" });
	}

	try {
		await new Promise((resolve, reject) => {
			db.run("DELETE FROM blocked_devices WHERE device_id = ?", [deviceId], (err) => {
				if (err) reject(err);
				else resolve();
			});
		});
		res.json({ message: "Device unblocked successfully" });
	} catch (error) {
		console.error("Unblock device error:", error);
		res.status(500).json({ error: "Failed to unblock device" });
	}
});

// Developer endpoint to view device IDs
app.get("/api/dev/device-ids", auth, (req, res) => {
	db.all(
		`SELECT id, title, device_id, upload_date
         FROM notes
         ORDER BY upload_date DESC`,
		(err, rows) => {
			if (err) {
				return res.status(500).json({ error: "Database error" });
			}
			res.json(rows);
		}
	);
});

// Start server
app.listen(port, () => {
	console.log(`Server running on port ${port}`);
	console.log("Developer access:");
	console.log("Username: developer");
	console.log("Password: securepassword");
});
