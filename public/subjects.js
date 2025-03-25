const subjectsByBranchAndYear = {
	CSE: {
		1: {
			"SEM 1": [
				"Engineering Mathematics-I",
				"Engineering Physics",
				"Engineering Chemistry",
				"Basic Electrical Engineering",
				"Engineering Graphics",
			],
			"SEM 2": [
				"Engineering Mathematics-II",
				"Basic Electronics",
				"Programming in C",
				"Environmental Science",
				"Engineering Mechanics",
			],
		},
		2: {
			"SEM 3": [
				"Data Structures",
				"Digital Logic Design",
				"Discrete Mathematics",
				"Object-Oriented Programming",
				"Computer Organization",
			],
			"SEM 4": [
				"Design and Analysis of Algorithms",
				"Operating Systems",
				"Database Management Systems",
				"Computer Networks",
				"Theory of Computation",
			],
		},
		3: {
			"SEM 5": [
				"Software Engineering",
				"Compiler Design",
				"Web Technologies",
				"Artificial Intelligence",
				"Cloud Computing",
			],
			"SEM 6": [
				"Machine Learning",
				"Information Security",
				"Mobile Computing",
				"Big Data Analytics",
				"Internet of Things",
			],
		},
		4: {
			"SEM 7": [
				"Distributed Systems",
				"Natural Language Processing",
				"Image Processing",
				"Project Management",
				"Blockchain Technology",
			],
			"SEM 8": [
				"Deep Learning",
				"Quantum Computing",
				"Data Mining",
				"Major Project",
				"Technical Seminar",
			],
		},
	},
	ME: {
		1: {
			"SEM 1": [
				"Engineering Mathematics-I",
				"Engineering Physics",
				"Engineering Chemistry",
				"Basic Electrical Engineering",
				"Engineering Graphics",
			],
			"SEM 2": [
				"Engineering Mathematics-II",
				"Materials Science",
				"Workshop Practice",
				"Environmental Science",
				"Engineering Mechanics",
			],
		},
		2: {
			"SEM 3": [
				"Thermodynamics",
				"Fluid Mechanics",
				"Manufacturing Processes",
				"Strength of Materials",
				"Machine Drawing",
			],
			"SEM 4": [
				"Heat Transfer",
				"Theory of Machines",
				"Materials Technology",
				"Industrial Engineering",
				"Mechanical Measurements",
			],
		},
		3: {
			"SEM 5": [
				"Design of Machine Elements",
				"Production Technology",
				"Internal Combustion Engines",
				"CAD/CAM",
				"Industrial Automation",
			],
			"SEM 6": [
				"Refrigeration and Air Conditioning",
				"Machine Tool Design",
				"Robotics",
				"Quality Engineering",
				"Operations Research",
			],
		},
		4: {
			"SEM 7": [
				"Power Plant Engineering",
				"Automobile Engineering",
				"Product Design",
				"Project Management",
				"Industrial Safety",
			],
			"SEM 8": [
				"Energy Systems",
				"Advanced Manufacturing",
				"Mechatronics",
				"Major Project",
				"Technical Seminar",
			],
		},
	},
	// Add more branches with similar semester structure
};

// Get semesters for a year
function getSemesters(year) {
	return Object.keys(Object.values(subjectsByBranchAndYear)[0][year]);
}

// Get subjects for a branch, year, and semester
function getSubjects(branch, year, semester) {
	return subjectsByBranchAndYear[branch][year][semester];
}
