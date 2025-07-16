// Job Seeker Dashboard specific functionality
let visibleJobs = 6;

$(document).ready(function() {
    loadSeekerData();
    setupSeekerEventHandlers();
});

function loadSeekerData() {
    if (!currentUser || currentUser.role !== "job_seeker") return;
    
    // Load profile data
    $("#userName, #profileName").text(currentUser.profile.name);
    $("#profileTitle").text(currentUser.profile.title);
    $("#profileLocation").html(`<i class="bi bi-geo-alt"></i> ${currentUser.profile.location}`);
    $("#skillsList").html(
        currentUser.profile.skills.map(skill => `<span class="badge bg-primary me-1 mb-1">${skill}</span>`).join("")
    );
    calculateProfileCompletion();
    
    // Load applications and jobs
    loadUserApplications();
    loadRecommendedJobs();
    loadAllJobs();
}

function calculateProfileCompletion() {
    let completion = 0;
    const fields = ["name", "title", "location", "skills", "resume", "resumeLink"];
    
    fields.forEach(field => {
        if (currentUser.profile[field] && 
            (Array.isArray(currentUser.profile[field]) 
                ? currentUser.profile[field].length > 0 
                : currentUser.profile[field].trim() !== "")) {
            completion += 100 / fields.length;
        }
    });
    
    $("#profileCompletion").css("width", `${completion}%`);
    $("#completionPercent").text(Math.round(completion));
}

function loadUserApplications() {
    const applications = JSON.parse(localStorage.getItem("applications")) || [];
    const userApplications = applications.filter(
        app => app.jobSeekerId === currentUser.id && app.status !== "Withdrawn"
    );
    const withdrawnApplications = applications.filter(
        app => app.jobSeekerId === currentUser.id && app.status === "Withdrawn"
    );
    
    displayApplications(userApplications, "#applicationsList");
    displayApplications(withdrawnApplications, "#withdrawnApplications", true);
}

function displayApplications(applications, containerSelector, isWithdrawn = false) {
    const container = $(containerSelector);
    container.empty();
    const jobs = JSON.parse(localStorage.getItem("jobs")) || [];

    if (applications.length === 0) {
        container.html(`<p class="text-muted">${isWithdrawn ? "No withdrawn applications." : "You haven't applied for any jobs yet."}</p>`);
        return;
    }

    applications.forEach(app => {
        const job = jobs.find(j => j.id === app.jobId);
        if (job) {
            const statusClass = getStatusBadgeClass(app.status);
            
            container.append(`
                <div class="list-group-item ${isWithdrawn ? "withdrawn-item" : ""}">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${job.title}</h6>
                            <small class="text-muted">${job.type} • ${job.location}</small>
                            <small class="d-block mt-1">Status: <span class="badge  ${statusClass}">${app.status || "Pending"}</span></small>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-outline-primary view-details" data-job-id="${job.id}">View Job</button>
                            ${!isWithdrawn && app.status === "Applied" 
                                ? `<button class="btn btn-sm btn-outline-danger ms-2 withdraw-application" data-app-id="${app.id}">Withdraw</button>`
                                : isWithdrawn 
                                    ? `<button class="btn btn-sm btn-success ms-2 reapply-application" data-app-id="${app.id}" data-job-id="${job.id}">Reapply</button>`
                                    : ''}
                        </div>
                    </div>
                </div>
            `);
        }
    });
}

function getStatusBadgeClass(status) {
    switch(status) {
        case "Applied": return 'status-applied';
        case "Reviewed": return 'bg-info';
        case "Shortlisted": return 'bg-primary';
        case "Interview Scheduled": return 'status-interview';
        case "Offer Extended": return 'status-offer';
        case "Hired": return 'bg-success';
        case "Rejected": return 'status-rejected';
        default: return 'bg-secondary';
    }
}

function loadRecommendedJobs() {
    const jobs = JSON.parse(localStorage.getItem("jobs")) || [];
    const userSkills = currentUser.profile.skills || [];
    
    const recommendedJobs = jobs.filter(job => {
        return userSkills.some(skill => 
            job.title.toLowerCase().includes(skill.toLowerCase()) || 
            job.description.toLowerCase().includes(skill.toLowerCase())
        );
    }).slice(0, 8);
    
    displayJobCards(recommendedJobs, "#recommendedJobs", 
        recommendedJobs.length === 0 ? '<p class="text-muted">No recommended jobs found based on your skills</p>' : '');
}

function loadAllJobs() {
    const jobs = JSON.parse(localStorage.getItem("jobs")) || [];
    let filtered = [...jobs];
    
    const keyword = $("#seekerJobSearch").val().toLowerCase();
    const location = $("#seekerJobLocation").val();
    const jobType = $("#seekerJobType").val();
    
    if (keyword) {
        filtered = filtered.filter(job => 
            job.title.toLowerCase().includes(keyword) || 
            job.description.toLowerCase().includes(keyword)
        );
    }
    
    if (location) {
        filtered = filtered.filter(job => 
            job.location.toLowerCase().includes(location.toLowerCase())
        );
    }
    
    if (jobType) {
        filtered = filtered.filter(job => job.type === jobType);
    }
    
    displayJobCards(filtered.slice(0, visibleJobs), "#allJobsList");
    
    if (filtered.length > visibleJobs) {
        if (!$("#loadMoreAllJobs").length) {
            $("#allJobsList").after(`
                <div class="text-center mt-3">
                    <button id="loadMoreAllJobs" class="btn btn-primary">Load More Jobs</button>
                </div>
            `);
        } else {
            $("#loadMoreAllJobs").show();
        }
    } else {
        $("#loadMoreAllJobs").hide();
    }
}

function displayJobCards(jobs, containerSelector, emptyMessage = '<p class="text-muted">No jobs found matching your criteria</p>') {
    const container = $(containerSelector);
    container.empty();
    const users = JSON.parse(localStorage.getItem("users")) || [];

    if (jobs.length === 0) {
        container.html(emptyMessage);
        return;
    }

    jobs.forEach(job => {
        const employer = users.find(u => u.id === job.employerId);
        const employerName = employer ? employer.profile.companyName : "Unknown Company";

        container.append(`
            <div class="col">
                <div class="card h-100 job-card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h5 class="card-title mb-1">${job.title}</h5>
                                <p class="text-muted small mb-2">${employerName}</p>
                            </div>
                            <span class="badge bg-primary">${job.type}</span>
                        </div>
                        <p class="card-text text-truncate">${job.description}</p>
                        <div class="d-flex align-items-center mb-3">
                            <small class="text-muted"><i class="bi bi-geo-alt"></i> ${job.location}</small>
                            <small class="text-muted ms-3"><i class="bi bi-cash"></i> ${job.salary}</small>
                        </div>
                        <button class="btn btn-outline-primary w-100 view-details" data-job-id="${job.id}">View Details</button>
                        <button class="btn btn-success w-100 mt-2 apply-job" data-job-id="${job.id}">Apply</button>
                    </div>
                </div>
            </div>
        `);
    });
}

function saveProfile() {
    currentUser.profile.name = $("#editName").val();
    currentUser.profile.title = $("#editTitle").val();
    currentUser.profile.location = $("#editLocation").val();
    currentUser.profile.skills = $("#editSkills").val().split(",").map(skill => skill.trim());
    currentUser.profile.resume = $("#editResume").val();
    currentUser.profile.resumeLink = $("#editResumeLink").val();

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const updatedUsers = users.map(user => {
        if (user.id === currentUser.id) return currentUser;
        return user;
    });

    localStorage.setItem("users", JSON.stringify(updatedUsers));
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    $("#profileModal").modal("hide");
    loadSeekerData();
    showAlert("Profile updated successfully!", "success");
}

function withdrawApplication(appId) {
    if (!confirm("Are you sure you want to withdraw this application?")) return;

    const applications = JSON.parse(localStorage.getItem("applications")) || [];
    const appIndex = applications.findIndex(app => app.id === appId);
    
    if (appIndex !== -1) {
        applications[appIndex].status = "Withdrawn";
        localStorage.setItem("applications", JSON.stringify(applications));
        showAlert("Application withdrawn successfully!", "success");
        loadUserApplications();
    }
}

function reapplyApplication(appId, jobId) {
    if (!confirm("Are you sure you want to reapply for this job?")) return;

    const applications = JSON.parse(localStorage.getItem("applications")) || [];
    const appIndex = applications.findIndex(app => app.id === appId);
    
    if (appIndex !== -1) {
        applications[appIndex].status = "Applied";
        applications[appIndex].appliedAt = new Date().toISOString();
        localStorage.setItem("applications", JSON.stringify(applications));
        showAlert("Application resubmitted successfully!", "success");
        loadUserApplications();
    }
}

function showJobDetails(jobId) {
    const jobs = JSON.parse(localStorage.getItem("jobs")) || [];
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const job = jobs.find(j => j.id === jobId);

    if (!job) return;

    const employer = users.find(u => u.id === job.employerId);

    $("#jobDetailsContent").html(`
        <div>
            <h4>${job.title}</h4>
            <p class="text-muted">${employer ? employer.profile.companyName : "Unknown Company"}</p>
            
            <div class="d-flex flex-wrap gap-2 mb-4">
                <span class="badge bg-primary">${job.type}</span>
                <span class="text-muted"><i class="bi bi-geo-alt"></i> ${job.location}</span>
                <span class="text-muted"><i class="bi bi-cash"></i> ${job.salary}</span>
            </div>
            
            <h5>Job Description</h5>
            <p>${job.description}</p>
            
            <h5 class="mt-4">Requirements</h5>
            <ul>
                ${job.requirements.split("\n").map(req => `<li>${req}</li>`).join("")}
            </ul>
            
            <div class="row mt-4">
                <div class="col-md-6">
                    <h5>Job Overview</h5>
                    <table class="table table-bordered">
                        <tr>
                            <td>Posted Date:</td>
                            <td>${new Date(job.postedAt).toLocaleDateString()}</td>
                        </tr>
                        <tr>
                            <td>Location:</td>
                            <td>${job.location}</td>
                        </tr>
                        <tr>
                            <td>Job Type:</td>
                            <td>${job.type}</td>
                        </tr>
                        <tr>
                            <td>Salary:</td>
                            <td>${job.salary}</td>
                        </tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h5>Company Information</h5>
                    ${employer ? `
                        <p><strong>${employer.profile.companyName}</strong></p>
                        <p>${employer.profile.description || "No description available"}</p>
                        <p><strong>Website:</strong> <a href="${employer.profile.website}" target="_blank">${employer.profile.website}</a></p>
                        <p><strong>Email:</strong> ${employer.email}</p>
                    ` : "<p>Company information not available</p>"}
                </div>
            </div>
        </div>
    `);

    // Check if already applied
    const applications = JSON.parse(localStorage.getItem("applications")) || [];
    const hasApplied = applications.some(app => 
        app.jobId === jobId && app.jobSeekerId === currentUser.id
    );

    $("#applyJobModal").off("click").on("click", function() {
        if (hasApplied) {
            showAlert("You've already applied for this job", "info");
            $("#jobDetailsModal").modal("hide");
        } else {
            applyForJob(jobId);
        }
    });

    $("#jobDetailsModal").modal("show");
}

function applyForJob(jobId) {
    const applications = JSON.parse(localStorage.getItem("applications")) || [];
    
    // Check if already applied
    const hasApplied = applications.some(app => 
        app.jobId === jobId && app.jobSeekerId === currentUser.id
    );
    
    if (hasApplied) {
        showAlert("You've already applied for this job", "info");
        return;
    }
    
    const newApplication = {
        id: "app_" + Date.now(),
        jobId,
        jobSeekerId: currentUser.id,
        status: "Applied",
        appliedAt: new Date().toISOString()
    };
    
    applications.push(newApplication);
    localStorage.setItem("applications", JSON.stringify(applications));
    showAlert("Application submitted successfully!", "success");
    $("#jobDetailsModal").modal("hide");
    loadUserApplications();
    loadAllJobs();
}

function setupSeekerEventHandlers() {
    // Save profile
    $("#saveProfile").on("click", saveProfile);

    // Withdraw application
    $(document).on("click", ".withdraw-application", function() {
        withdrawApplication($(this).data("app-id"));
    });

    // Reapply application
    $(document).on("click", ".reapply-application", function() {
        reapplyApplication($(this).data("app-id"), $(this).data("job-id"));
    });

    // Apply for job (from job card)
    $(document).on("click", ".apply-job", function() {
        const jobId = $(this).data("job-id");
        applyForJob(jobId);
    });

    // View job details (from job card)
    $(document).on("click", ".view-details", function() {
        showJobDetails($(this).data("job-id"));
    });

    // Search jobs
    $("#seekerSearchBtn").on("click", function() {
        visibleJobs = 6;
        loadAllJobs();
    });

    // Clear filters
    $("#clearFiltersBtn").on("click", function() {
        $("#seekerJobSearch").val("");
        $("#seekerJobType").val("");
        $("#seekerJobLocation").val("");
        visibleJobs = 6;
        loadAllJobs();
    });

    // Load more jobs
    $(document).on("click", "#loadMoreAllJobs", function() {
        visibleJobs += 6;
        loadAllJobs();
    });

    // Job filter tabs
    $(document).on("click", ".seeker-job-filter", function(e) {
        e.preventDefault();
        currentSeekerJobFilter = $(this).data("filter");
        visibleJobs = 6;
        loadAllJobs();
        $(".seeker-job-filter").removeClass("active");
        $(this).addClass("active");
    });

    // Load profile data when modal is shown
    $("#profileModal").on("show.bs.modal", function() {
        $("#editName").val(currentUser.profile.name);
        $("#editTitle").val(currentUser.profile.title);
        $("#editEmail").val(currentUser.email);
        $("#editLocation").val(currentUser.profile.location);
        $("#editSkills").val(currentUser.profile.skills.join(", "));
        $("#editResume").val(currentUser.profile.resume);
        $("#editResumeLink").val(currentUser.profile.resumeLink);
    });
}