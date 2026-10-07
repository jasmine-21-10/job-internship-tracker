let allJobs = [];
// Show Add Application form
function showForm() {
    document.getElementById("applicationForm").style.display = "block";
}

async function saveApplication() {

    let company = document.getElementById("company").value;
    let role = document.getElementById("role").value;
    let location = document.getElementById("location").value;
    let status = document.getElementById("status").value;
    let date = document.getElementById("date").value;

    if (company === "" || role === "") {
        alert("Please enter Company Name and Job Role.");
        return;
    }

    try {

        const response = await fetch(
            "http://127.0.0.1:5000/api/applications",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    company: company,
                    role: role,
                    location: location,
                    status: status,
                    date: date
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error);
        }

        alert("Application saved successfully! ✅");

        document.getElementById("applicationForm").style.display = "none";

        document.getElementById("company").value = "";
        document.getElementById("role").value = "";
        document.getElementById("location").value = "";
        document.getElementById("date").value = "";

        loadApplications();

    } catch (error) {

        console.error("Error:", error);

        alert("Could not save application.");

    }
}

async function loadApplications() {

    try {

        const response = await fetch(
            "http://127.0.0.1:5000/api/applications"
        );

        const applications = await response.json();
        updateStats(applications);

        const tableBody = document.getElementById(
            "applicationsTableBody"
        );

        tableBody.innerHTML = "";

        if (applications.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td>No applications yet</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                </tr>
            `;

            return;
        }
        applications.forEach((application, index) => {

    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${application.company}</td>
        <td>${application.role}</td>
        <td>${application.location}</td>
        <td>
   <select 
    class="status-dropdown status-${application.status.toLowerCase()}"
    onchange="changeStatus(${index}, this.value)"
>
    <option value="Applied" ${application.status === "Applied" ? "selected" : ""}>
        Applied
    </option>

    <option value="Interview" ${application.status === "Interview" ? "selected" : ""}>
        Interview
    </option>

    <option value="Selected" ${application.status === "Selected" ? "selected" : ""}>
        Selected
    </option>

    <option value="Rejected" ${application.status === "Rejected" ? "selected" : ""}>
        Rejected
    </option>
</select>
</td>
        <td>${application.date}</td>

        <td>
            <button onclick="editApplication(${index})">
                ✏️ Edit
            </button>

            <button onclick="deleteApplication(${index})">
                🗑️ Delete
            </button>
        </td>
    `;

    tableBody.appendChild(row);

});

    } catch (error) {

        console.error("Error loading applications:", error);

    }
}
function updateStats(applications) {

    const total = applications.length;

    const applied = applications.filter(
        app => app.status === "Applied"
    ).length;

    const interview = applications.filter(
        app => app.status === "Interview"
    ).length;

    const selected = applications.filter(
        app => app.status === "Selected"
    ).length;


    document.getElementById("totalApplications").textContent = total;

    document.getElementById("appliedCount").textContent = applied;

    document.getElementById("interviewCount").textContent = interview;

    document.getElementById("selectedCount").textContent = selected;
}

// Load jobs from Flask API
async function loadJobs() {

    try {

        const response = await fetch("http://127.0.0.1:5000/api/jobs");

        if (!response.ok) {
            throw new Error("API error");
        }
        const jobs = await response.json();

console.log("Jobs loaded:", jobs);

allJobs = jobs;

displayJobs(jobs);

    } catch (error) {

        console.error("Error loading jobs:", error);

        alert("Unable to load jobs. Make sure Flask is running.");

    }
}


// Display jobs in table
function displayJobs(jobs) {

    const tableBody = document.getElementById("jobsTableBody");

    if (!tableBody) {
        console.error("jobsTableBody not found.");
        return;
    }

    tableBody.innerHTML = "";

    jobs.forEach(job => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${job.company_name || "Unknown Company"}</td>
            <td>${job.title || "Unknown Role"}</td>
            <td>${job.location || "Not Specified"}</td>
            <td>${job.formatted_work_type || "Not Specified"}</td>
            <td>${job.remote_allowed ? "Remote" : "On-site"}</td>
            <td>
                <a href="${job.job_posting_url}" target="_blank">
                    View Job
                </a>
            </td>
        `;

        tableBody.appendChild(row);

    });
}


document.addEventListener("DOMContentLoaded", function () {

    loadJobs();

    loadApplications();

});
function filterJobs() {

    const search = document
        .getElementById("jobSearch")
        .value
        .toLowerCase();

    const location = document
        .getElementById("locationFilter")
        .value
        .toLowerCase();

    const workType = document
        .getElementById("workTypeFilter")
        .value;


    const filteredJobs = allJobs.filter(job => {

        const title = (job.title || "").toLowerCase();

        const company = (job.company_name || "").toLowerCase();

        const jobLocation = (job.location || "").toLowerCase();

        const type = job.formatted_work_type || "";


        const matchesSearch =
            title.includes(search) ||
            company.includes(search);

        const matchesLocation =
            jobLocation.includes(location);

        const matchesWorkType =
            workType === "" || type === workType;


        return (
            matchesSearch &&
            matchesLocation &&
            matchesWorkType
        );

    });


    displayJobs(filteredJobs);
}
async function deleteApplication(index) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this application?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        const response = await fetch(
            `http://127.0.0.1:5000/api/applications/${index}`,
            {
                method: "DELETE"
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error);
        }

        alert("Application deleted successfully! 🗑️");

        loadApplications();

    } catch (error) {

        console.error("Delete error:", error);

        alert("Could not delete application.");

    }
}
async function changeStatus(index, newStatus) {

    try {

        // Get current applications
        const response = await fetch(
            "http://127.0.0.1:5000/api/applications"
        );

        const applications = await response.json();

        // Get the selected application
        const application = applications[index];

        // Update its status
        application.status = newStatus;

        // Send updated application to Flask
        const updateResponse = await fetch(
            `http://127.0.0.1:5000/api/applications/${index}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(application)
            }
        );

        const result = await updateResponse.json();

        if (!updateResponse.ok) {
            throw new Error(result.error);
        }

        console.log("Status updated:", result);

        // Reload applications and counters
        loadApplications();

    } catch (error) {

        console.error("Status update error:", error);

        alert("Could not update application status.");

    }
}