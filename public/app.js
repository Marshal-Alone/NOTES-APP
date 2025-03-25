let currentBranch = "";
let currentYear = "";
let currentSemester = "";
let currentSubject = "";

// DOM Elements
const uploadBtn = document.getElementById("uploadBtn");
const uploadModal = document.getElementById("uploadModal");
const yearSection = document.getElementById("yearSection");
const semesterSection = document.getElementById("semesterSection");
const subjectSection = document.getElementById("subjectSection");
const notesSection = document.getElementById("notesSection");
const semesterGrid = document.querySelector(".semester-grid");
const subjectGrid = document.getElementById("subjectGrid");
const notesGrid = document.getElementById("notesGrid");

// Step Navigation
function initializeStepNavigation() {
	document.querySelectorAll(".step").forEach((step, index) => {
		step.style.cursor = "pointer";
		step.addEventListener("click", () => {
			// Only allow clicking completed steps
			if (!step.classList.contains("completed") && !step.classList.contains("active")) {
				return;
			}

			// Reset state based on which step was clicked
			switch (index) {
				case 0: // Branch
					currentYear = "";
					currentSemester = "";
					currentSubject = "";
					yearSection.classList.add("hidden");
					semesterSection.classList.add("hidden");
					subjectSection.classList.add("hidden");
					notesSection.classList.add("hidden");
					break;
				case 1: // Year
					if (!currentBranch) return;
					currentSemester = "";
					currentSubject = "";
					yearSection.classList.remove("hidden");
					semesterSection.classList.add("hidden");
					subjectSection.classList.add("hidden");
					notesSection.classList.add("hidden");
					smoothScrollTo(yearSection);
					break;
				case 2: // Semester
					if (!currentBranch || !currentYear) return;
					currentSubject = "";
					loadSemesters();
					semesterSection.classList.remove("hidden");
					subjectSection.classList.add("hidden");
					notesSection.classList.add("hidden");
					smoothScrollTo(semesterSection);
					break;
				case 3: // Subject
					if (!currentBranch || !currentYear || !currentSemester) return;
					loadSubjects();
					subjectSection.classList.remove("hidden");
					notesSection.classList.add("hidden");
					smoothScrollTo(subjectSection);
					break;
			}
			updateSelectionDisplay();
		});
	});
}

// Modal Close Buttons
document.querySelectorAll(".close").forEach((btn) => {
	btn.onclick = () => {
		uploadModal.classList.add("hidden");
	};
});

// Upload Button Event Listener
uploadBtn.onclick = () => uploadModal.classList.remove("hidden");

// Branch Selection
document.querySelectorAll(".branch-btn").forEach((btn) => {
	btn.addEventListener("click", () => {
		currentBranch = btn.dataset.branch;
		currentYear = "";
		currentSemester = "";
		currentSubject = "";
		yearSection.classList.remove("hidden");
		semesterSection.classList.add("hidden");
		subjectSection.classList.add("hidden");
		notesSection.classList.add("hidden");
		updateSelectionDisplay();
		smoothScrollTo(yearSection);
	});
});

// Year Selection
document.querySelectorAll(".year-btn").forEach((btn) => {
	btn.addEventListener("click", () => {
		if (!currentBranch) {
			alert("Please select a branch first");
			return;
		}
		currentYear = btn.dataset.year;
		currentSemester = "";
		currentSubject = "";
		loadSemesters();
		semesterSection.classList.remove("hidden");
		subjectSection.classList.add("hidden");
		notesSection.classList.add("hidden");
		updateSelectionDisplay();
		smoothScrollTo(semesterSection);
	});
});

// Load Semesters
function loadSemesters() {
	if (!currentBranch || !currentYear) {
		return;
	}
	semesterGrid.innerHTML = "";
	const semesters = getSemesters(currentYear);

	semesters.forEach((semester) => {
		const button = document.createElement("button");
		button.className = "semester-btn";
		button.textContent = semester;
		button.addEventListener("click", () => {
			currentSemester = semester;
			currentSubject = "";
			loadSubjects();
			subjectSection.classList.remove("hidden");
			notesSection.classList.add("hidden");
			updateSelectionDisplay();
			smoothScrollTo(subjectSection);
		});
		semesterGrid.appendChild(button);
	});
}

// Load Subjects
function loadSubjects() {
	if (!currentBranch || !currentYear || !currentSemester) {
		return;
	}
	subjectGrid.innerHTML = "";
	const subjects = getSubjects(currentBranch, currentYear, currentSemester);
	subjects.forEach((subject) => {
		const button = document.createElement("button");
		button.className = "branch-btn";
		button.textContent = subject;
		button.addEventListener("click", () => {
			currentSubject = subject;
			loadNotes();
			notesSection.classList.remove("hidden");
			updateSelectionDisplay();
			smoothScrollTo(notesSection);
		});
		subjectGrid.appendChild(button);
	});
}

// Load Notes
async function loadNotes() {
	try {
		const response = await fetch(
			`/api/notes/${currentBranch}/${currentYear}/${encodeURIComponent(
				currentSemester
			)}/${encodeURIComponent(currentSubject)}`
		);
		const notes = await response.json();

		notesGrid.innerHTML = "";
		if (notes.length === 0) {
			notesGrid.innerHTML =
				'<div class="note-card"><p>No notes available for this subject yet.</p></div>';
			return;
		}

		notes.forEach((note) => {
			const noteCard = document.createElement("div");
			noteCard.className = "note-card";
			noteCard.innerHTML = `
                <h3>${note.title}</h3>
                <p>Uploaded by: ${note.author_name}</p>
                <div class="note-details">
                    <div class="rating-info">
                        <span class="stars">${"★".repeat(Math.round(note.rating || 0))}${"☆".repeat(
				5 - Math.round(note.rating || 0)
			)}</span>
                        <span class="rating-count">(${note.num_ratings || 0} ratings)</span>
                    </div>
                    <div class="note-actions">
                        <button onclick="downloadNote(${note.id})">Download PDF</button>
                        <div class="rate-note">
                            <select onchange="rateNote(${
															note.id
														}, this.value)" class="rating-select">
                                <option value="">Rate</option>
                                <option value="1">★</option>
                                <option value="2">★★</option>
                                <option value="3">★★★</option>
                                <option value="4">★★★★</option>
                                <option value="5">★★★★★</option>
                            </select>
                        </div>
                    </div>
                </div>
            `;
			notesGrid.appendChild(noteCard);
		});
	} catch (error) {
		console.error("Error loading notes:", error);
		notesGrid.innerHTML =
			'<div class="note-card"><p>Error loading notes. Please try again.</p></div>';
	}
}

// Download Note
async function downloadNote(noteId) {
	try {
		const response = await fetch(`/api/download/${noteId}`);
		if (!response.ok) throw new Error("Download failed");

		const blob = await response.blob();
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "note.pdf";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	} catch (error) {
		console.error("Error downloading note:", error);
		alert("Failed to download note");
	}
}

// Generate device ID
function getDeviceId() {
	let deviceId = localStorage.getItem("deviceId");
	if (!deviceId) {
		deviceId = "device_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
		localStorage.setItem("deviceId", deviceId);
	}
	return deviceId;
}

// Rate Note
async function rateNote(noteId, rating) {
	if (!rating) return;

	try {
		const deviceId = getDeviceId();
		const response = await fetch(`/api/rate/${noteId}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				rating: parseInt(rating),
				deviceId,
			}),
		});

		const data = await response.json();
		if (response.ok) {
			loadNotes();
		} else {
			alert(data.error);
		}
	} catch (error) {
		console.error("Rating error:", error);
		alert("Failed to submit rating");
	}
}

// Handle File Upload
document.getElementById("uploadForm").onsubmit = async (e) => {
	e.preventDefault();

	if (!currentBranch || !currentYear || !currentSemester || !currentSubject) {
		alert("Please select a branch, year, semester, and subject first");
		return;
	}

	const formData = new FormData(e.target);
	const authorName = formData.get("authorName")?.trim();
	const title = formData.get("title")?.trim();
	const file = formData.get("pdf");

	if (!authorName || !title || !file) {
		alert("Please fill in all fields and select a PDF file");
		return;
	}

	if (file.size > 50 * 1024 * 1024) {
		alert("File size must be less than 50MB");
		return;
	}

	if (!file.name.toLowerCase().endsWith(".pdf")) {
		alert("Please upload a PDF file");
		return;
	}

	formData.append("branch", currentBranch);
	formData.append("year", currentYear);
	formData.append("semester", currentSemester);
	formData.append("subject", currentSubject);

	try {
		const response = await fetch("/api/upload", {
			method: "POST",
			body: formData,
		});
		const data = await response.json();
		if (response.ok) {
			uploadModal.classList.add("hidden");
			alert("Note uploaded successfully!");
			e.target.reset();
			loadNotes();
		} else {
			alert(data.error || "Upload failed");
		}
	} catch (error) {
		console.error("Upload error:", error);
		alert("Upload failed. Please try again.");
	}
};

// Update Selection Display
function updateSelectionDisplay() {
	let html = "";
	const steps = document.querySelectorAll(".step");

	steps.forEach((step, index) => {
		step.classList.remove("active", "completed");
		if (
			(index === 0 && !currentBranch) ||
			(index === 1 && currentBranch && !currentYear) ||
			(index === 2 && currentYear && !currentSemester) ||
			(index === 3 && currentSemester && !currentSubject)
		) {
			step.classList.add("active");
		}

		if (
			(index === 0 && currentBranch) ||
			(index === 1 && currentYear) ||
			(index === 2 && currentSemester) ||
			(index === 3 && currentSubject)
		) {
			step.classList.add("completed");
		}
	});

	if (currentBranch) {
		html += `<div class="selection-step"><span>Branch: ${currentBranch}</span></div>`;
		if (currentYear) {
			html += `<div class="selection-step"><span>Year: ${currentYear}</span></div>`;
			if (currentSemester) {
				html += `<div class="selection-step"><span>Semester: ${currentSemester}</span></div>`;
				if (currentSubject) {
					html += `<div class="selection-step"><span>Subject: ${currentSubject}</span></div>`;
				}
			}
		}
	}

	document.querySelectorAll(".selection-display").forEach((display) => {
		display.innerHTML = html || "Select your branch to begin";
	});

	// Update section states with animations
	document.querySelectorAll("section:not(.hero)").forEach((section) => {
		section.classList.remove("active-section", "inactive-section");
		setTimeout(() => {
			if (!currentBranch && section.classList.contains("branch-selection")) {
				section.classList.add("active-section");
			} else if (currentBranch && !currentYear && section.id === "yearSection") {
				section.classList.add("active-section");
			} else if (currentYear && !currentSemester && section.id === "semesterSection") {
				section.classList.add("active-section");
			} else if (currentSemester && !currentSubject && section.id === "subjectSection") {
				section.classList.add("active-section");
			} else if (section !== notesSection) {
				section.classList.add("inactive-section");
			}
		}, 50);
	});
}

// Utility Functions
function smoothScrollTo(element) {
	window.scrollTo({
		top: element.offsetTop - 100,
		behavior: "smooth",
	});
}

// Initialize
updateSelectionDisplay();
