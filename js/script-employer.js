$(document).ready(function () {
  // Load employer data
  loadEmployerData();

  // Set up event handlers
  setupEmployerEventHandlers();
});

function loadEmployerData() {
  if (!currentUser || currentUser.role !== "employer") return;

  // Load company profile
  $("#companyName, #companyNameDisplay").text(currentUser.profile.companyName);
  $("#companyIndustry").text(currentUser.profile.industry);
  $("#companyLocation").html(
    `<i class="bi bi-geo-alt"></i> ${currentUser.profile.location}`
  );
  $("#companyEmail").val(currentUser.email);

  // Load jobs and applications
  loadEmployerJobs();
  loadRecentApplications();
}

function loadEmployerJobs() {
  const jobs = JSON.parse(localStorage.getItem("jobs")) || [];
  const employerJobs = jobs.filter((job) => job.employerId === currentUser.id);

  const activeJobs = employerJobs.filter((job) => job.status !== "inactive");
  const inactiveJobs = employerJobs.filter((job) => job.status === "inactive");

  // Update stats
  $("#activeJobsCount").text(activeJobs.length);
  $("#applicationsCount").text(getTotalApplications(employerJobs));

  // Display jobs
  displayJobsList(activeJobs, "#activeJobsList");
  displayJobsList(inactiveJobs, "#inactiveJobsList");
}

function getTotalApplications(jobs) {
  const applications = JSON.parse(localStorage.getItem("applications")) || [];
  const jobIds = jobs.map((job) => job.id);
  return applications.filter((app) => jobIds.includes(app.jobId)).length;
}

function displayJobsList(jobs, containerSelector) {
  const container = $(containerSelector);
  container.empty();

  if (jobs.length === 0) {
    container.html(
      '<div class="list-group-item text-muted">No jobs found</div>'
    );
    return;
  }

  jobs.forEach((job) => {
    const applications = getJobApplications(job.id);

    container.append(`
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6>${job.title}</h6>
                        <small class="text-muted">${job.type} • ${
      job.location
    }</small>
                        <div class="mt-1">
                            <span class="badge bg-primary">${
                              applications.length
                            } Applications</span>
                            ${
                              job.salary
                                ? `<span class="badge bg-success ms-1">${job.salary}</span>`
                                : ""
                            }
                        </div>
                    </div>
                    <div class="">
                        <button class="btn btn-sm btn-outline-primary view-job-applications" 
                                data-job-id="${job.id}">View Apps</button>
                        <button class="btn btn-sm btn-outline-warning edit-job" 
                                data-job-id="${job.id}">Edit</button>
                        <button class="btn btn-sm ${
                          job.status === "inactive"
                            ? "btn-success"
                            : "btn-outline-danger"
                        } toggle-job-status" 
                                data-job-id="${job.id}" data-current-status="${
      job.status
    }">
                            ${
                              job.status === "inactive"
                                ? "Activate"
                                : "Deactivate"
                            }
                        </button>
                        <button class="btn btn-sm btn-danger delete-job" 
                                data-job-id="${job.id}">Delete</button>
                    </div>
                </div>
            </div>
        `);
  });
}

function deleteJob(jobId) {
  if (
    !confirm(
      "Are you sure you want to delete this job? This action cannot be undone."
    )
  )
    return;

  const jobs = JSON.parse(localStorage.getItem("jobs")) || [];
  const updatedJobs = jobs.filter((job) => job.id !== jobId);
  localStorage.setItem("jobs", JSON.stringify(updatedJobs));

  // Also remove related applications
  const applications = JSON.parse(localStorage.getItem("applications")) || [];
  const updatedApplications = applications.filter((app) => app.jobId !== jobId);
  localStorage.setItem("applications", JSON.stringify(updatedApplications));

  showAlert("Job deleted successfully", "success");
  loadEmployerJobs();
}

function getJobApplications(jobId) {
  const applications = JSON.parse(localStorage.getItem("applications")) || [];
  return applications.filter((app) => app.jobId === jobId);
}

function loadRecentApplications(filter = "all") {
  const applications = JSON.parse(localStorage.getItem("applications")) || [];
  const jobs = JSON.parse(localStorage.getItem("jobs")) || [];
  const employerJobs = jobs.filter((job) => job.employerId === currentUser.id);
  const jobIds = employerJobs.map((job) => job.id);

  let employerApplications = applications.filter((app) =>
    jobIds.includes(app.jobId)
  );

  if (filter !== "all") {
    employerApplications = employerApplications.filter(
      (app) => app.status === filter
    );
  }

  displayApplicationsList(employerApplications.slice(0, 5));
}

function displayApplicationsList(applications) {
  const container = $("#applicationsList");
  container.empty();

  if (applications.length === 0) {
    container.html('<p class="text-muted">No applications found</p>');
    return;
  }

  const jobs = JSON.parse(localStorage.getItem("jobs")) || [];
  const users = JSON.parse(localStorage.getItem("users")) || [];

  applications.forEach((app) => {
    const job = jobs.find((j) => j.id === app.jobId);
    const seeker = users.find((u) => u.id === app.jobSeekerId);

    if (job && seeker) {
      const statusClass = getStatusBadgeClass(app.status);

      container.append(`
                <div class="card mb-2">
                    <div class="card-body p-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-1">${seeker.profile.name}</h6>
                                <small class="text-muted">Applied for ${
                                  job.title
                                }</small>
                                <div class="mt-1">
                                    <span class="badge ${statusClass}">${
        app.status || "Pending"
      }</span>
                                </div>
                            </div>
                            <div>
                                <button class="btn btn-sm btn-outline-primary view-application" 
                                        data-app-id="${app.id}">View</button>
                            </div>
                        </div>
                    </div>
                </div>
            `);
    }
  });
}

function getStatusBadgeClass(status) {
  switch (status) {
    case "Applied":
      return "status-applied";
    case "Reviewed":
      return "bg-info";
    case "Shortlisted":
      return "bg-primary";
    case "Interview Scheduled":
      return "status-interview";
    case "Offer Extended":
      return "status-offer";
    case "Hired":
      return "bg-success";
    case "Rejected":
      return "status-rejected";
    default:
      return "bg-secondary";
  }
}

function showApplicationDetails(appId) {
  const applications = JSON.parse(localStorage.getItem("applications")) || [];
  const jobs = JSON.parse(localStorage.getItem("jobs")) || [];
  const users = JSON.parse(localStorage.getItem("users")) || [];

  const application = applications.find((app) => app.id === appId);
  if (!application) return;

  const job = jobs.find((j) => j.id === application.jobId);
  const seeker = users.find((u) => u.id === application.jobSeekerId);

  if (!job || !seeker) return;

  $("#applicationDetailsContent").html(`
        <div class="row">
            <div class="col-md-6">
                <h5>Job Details</h5>
                <p><strong>Title:</strong> ${job.title}</p>
                <p><strong>Type:</strong> ${job.type}</p>
                <p><strong>Location:</strong> ${job.location}</p>
                <p><strong>Salary:</strong> ${job.salary}</p>
            </div>
            <div class="col-md-6">
                <h5>Applicant Details</h5>
                <p><strong>Name:</strong> ${seeker.profile.name}</p>
                <p><strong>Title:</strong> ${seeker.profile.title}</p>
                <p><strong>Location:</strong> ${seeker.profile.location}</p>
                <p><strong>Skills:</strong> ${seeker.profile.skills.join(
                  ", "
                )}</p>
                ${
                  seeker.profile.resumeLink
                    ? `<p><strong>Resume:</strong> <a href="${seeker.profile.resumeLink}" target="_blank">View Resume</a></p>`
                    : ""
                }
            </div>
        </div>
        <div class="mt-4">
            <h5>Application Status</h5>
            <p>Applied on: ${new Date(
              application.appliedAt
            ).toLocaleDateString()}</p>
            <div class="mb-3">
                <label for="applicationStatus" class="form-label">Update Status:</label>
                <select class="form-select" id="applicationStatus">
                    <option value="Applied" ${
                      application.status === "Applied" ? "selected" : ""
                    }>Applied</option>
                    <option value="Reviewed" ${
                      application.status === "Reviewed" ? "selected" : ""
                    }>Reviewed</option>
                    <option value="Shortlisted" ${
                      application.status === "Shortlisted" ? "selected" : ""
                    }>Shortlisted</option>
                    <option value="Interview Scheduled" ${
                      application.status === "Interview Scheduled"
                        ? "selected"
                        : ""
                    }>Interview Scheduled</option>
                    <option value="Offer Extended" ${
                      application.status === "Offer Extended" ? "selected" : ""
                    }>Offer Extended</option>
                    <option value="Hired" ${
                      application.status === "Hired" ? "selected" : ""
                    }>Hired</option>
                    <option value="Rejected" ${
                      application.status === "Rejected" ? "selected" : ""
                    }>Rejected</option>
                </select>
            </div>
        </div>
    `);

  // Store the jobId along with appId for refreshing the correct job applications
  $("#applicationModal").data("app-id", appId);
  $("#applicationModal").data("job-id", job.id);
  $("#applicationModal").modal("show");
}

function showJobApplications(jobId) {
  const jobs = JSON.parse(localStorage.getItem("jobs")) || [];
  const job = jobs.find((j) => j.id === jobId);
  if (!job) return;

  const applications = getJobApplications(jobId);
  const users = JSON.parse(localStorage.getItem("users")) || [];

  // Update the title
  $("#jobApplicationsTitle").text(`Applications for ${job.title}`);
  $("#jobApplicationsContainer").data("job-id", jobId);
  const container = $("#jobApplicationsContent");
  container.empty();

  if (applications.length === 0) {
    container.html('<p class="text-muted">No applications for this job</p>');
  } else {
    applications.forEach((app) => {
      const seeker = users.find((u) => u.id === app.jobSeekerId);
      if (seeker) {
        const statusClass = getStatusBadgeClass(app.status);

        container.append(`
                    <div class="card mb-2">
                        <div class="card-body p-3">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-1">${seeker.profile.name}</h6>
                                    <small class="text-muted">${
                                      seeker.profile.title
                                    }</small>
                                    <div class="mt-1">
                                        <span class="badge ${statusClass}">${app.status || "Pending"}</span>
                                    </div>
                                </div>
                                <div>
                                    <button class="btn btn-sm btn-outline-primary view-application" 
                                            data-app-id="${
                                              app.id
                                            }">View</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `);
      }
    });
  }

  // Show the container instead of modal
  $("#jobApplicationsContainer").removeClass("d-none");

  // Scroll to the applications section
  $("html, body").animate(
    {
      scrollTop: $("#jobApplicationsContainer").offset().top - 20,
    },
    500
  );
}

function editJob(jobId) {
  const jobs = JSON.parse(localStorage.getItem("jobs")) || [];
  const job = jobs.find((j) => j.id === jobId);

  if (job) {
    $("#jobId").val(job.id);
    $("#jobTitle").val(job.title);
    $("#jobType").val(job.type);
    $("#jobLocation").val(job.location);
    $("#jobSalary").val(job.salary);
    $("#jobDescription").val(job.description);
    $("#jobRequirements").val(job.requirements);

    $("#postJobModalTitle").text("Edit Job");
    $("#postJobModal").modal("show");
  }
}

function toggleJobStatus(jobId, currentStatus) {
  const jobs = JSON.parse(localStorage.getItem("jobs")) || [];
  const jobIndex = jobs.findIndex((j) => j.id === jobId);

  if (jobIndex !== -1) {
    jobs[jobIndex].status =
      currentStatus === "inactive" ? "active" : "inactive";
    localStorage.setItem("jobs", JSON.stringify(jobs));
    loadEmployerJobs();
    showAlert(
      `Job ${
        currentStatus === "inactive" ? "activated" : "deactivated"
      } successfully`,
      "success"
    );
  }
}

function saveJob() {
  const jobData = {
    id: $("#jobId").val() || "job_" + Date.now(),
    employerId: currentUser.id,
    title: $("#jobTitle").val(),
    type: $("#jobType").val(),
    location: $("#jobLocation").val(),
    salary: $("#jobSalary").val(),
    description: $("#jobDescription").val(),
    requirements: $("#jobRequirements").val(),
    status: "active",
    postedAt: new Date().toISOString(),
  };

  const jobs = JSON.parse(localStorage.getItem("jobs")) || [];

  if ($("#jobId").val()) {
    // Update existing job
    const index = jobs.findIndex((j) => j.id === $("#jobId").val());
    if (index !== -1) {
      jobs[index] = jobData;
      showAlert("Job updated successfully", "success");
    }
  } else {
    // Add new job
    jobs.push(jobData);
    showAlert("Job posted successfully", "success");
  }

  localStorage.setItem("jobs", JSON.stringify(jobs));
  $("#postJobModal").modal("hide");
  loadEmployerJobs();
}

function updateApplicationStatus(appId) {
  const newStatus = $("#applicationStatus").val();
  const applications = JSON.parse(localStorage.getItem("applications")) || [];
  const appIndex = applications.findIndex((app) => app.id === appId);
  const jobId = $("#applicationModal").data("job-id");

  if (appIndex !== -1) {
    applications[appIndex].status = newStatus;
    localStorage.setItem("applications", JSON.stringify(applications));
    showAlert(`Application status updated to ${newStatus}`, "success");

    // Refresh both the recent applications and the job applications view
    loadRecentApplications();

    // If we're viewing job applications, refresh that view too
    if (jobId) {
      showJobApplications(jobId);
    }

    $("#applicationModal").modal("hide");
  }
}

function saveCompanyProfile() {
  currentUser.profile.companyName = $("#companyNameInput").val();
  currentUser.profile.industry = $("#companyIndustryInput").val();
  currentUser.profile.location = $("#companyLocationInput").val();
  currentUser.profile.website = $("#companyWebsite").val();
  currentUser.profile.description = $("#companyDescription").val();

  const users = JSON.parse(localStorage.getItem("users")) || [];
  const updatedUsers = users.map((user) => {
    if (user.id === currentUser.id) return currentUser;
    return user;
  });

  localStorage.setItem("users", JSON.stringify(updatedUsers));
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  $("#companyModal").modal("hide");
  loadEmployerData();
  showAlert("Company profile updated successfully", "success");
}


/// export function
function exportJobApplications(jobId) {
    const applications = JSON.parse(localStorage.getItem("applications")) || [];
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const jobs = JSON.parse(localStorage.getItem("jobs")) || [];
    
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    const jobApplications = applications.filter(app => app.jobId === jobId);
    
    // CSV header
    let csvContent = "Name,Email,Location,Status,Applied Date\n";
    
    // Add each application as a row
    jobApplications.forEach(app => {
        const seeker = users.find(u => u.id === app.jobSeekerId);
        if (seeker) {
            csvContent += `"${seeker.profile.name || ''}",`;
            csvContent += `"${seeker.email || ''}",`;
            csvContent += `"${seeker.profile.location || ''}",`;
            csvContent += `"${app.status || 'Applied'}",`;
            csvContent += `"${new Date(app.appliedAt).toLocaleDateString() || ''}"\n`;
        }
    });

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${job.title.replace(/[^a-z0-9]/gi, '_')}_applications.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function setupEmployerEventHandlers() {
  // Save job
  $("#saveJob").on("click", saveJob);

  // Save company profile
  $("#saveCompanyProfile").on("click", saveCompanyProfile);

  // Edit job
  $(document).on("click", ".edit-job", function () {
    editJob($(this).data("job-id"));
  });

  // Toggle job status
  $(document).on("click", ".toggle-job-status", function () {
    toggleJobStatus($(this).data("job-id"), $(this).data("current-status"));
  });

  // Delete job
  $(document).on("click", ".delete-job", function () {
    deleteJob($(this).data("job-id"));
  });

  // View job applications
  $(document).on("click", ".view-job-applications", function () {
    showJobApplications($(this).data("job-id"));
  });

  // View application details
  $(document).on("click", ".view-application", function () {
    showApplicationDetails($(this).data("app-id"));
  });

  // Filter applications
  $(document).on("click", ".filter-application", function (e) {
    e.preventDefault();
    loadRecentApplications($(this).data("status"));
  });

  // Update application status
  $(document).on("click", ".update-application-status", function () {
    updateApplicationStatus($("#applicationModal").data("app-id"));
  });

  //manage applications close
  $("#closeJobApplications").on("click", function () {
    $("#jobApplicationsContainer").addClass("d-none");
  });
  //export applications
  $("#exportApplicationsBtn").on("click", function() {
    const jobId = $("#jobApplicationsContainer").data("job-id");
    if (jobId) {
        exportJobApplications(jobId);
    }
});

  // Reset job form when modal is closed
  $("#postJobModal").on("hidden.bs.modal", function () {
    $("#jobForm")[0].reset();
    $("#jobId").val("");
    $("#postJobModalTitle").text("Post New Job");
  });

  // Load company data when company modal is shown
  $("#companyModal").on("show.bs.modal", function () {
    $("#companyNameInput").val(currentUser.profile.companyName);
    $("#companyEmail").val(currentUser.email);
    $("#companyIndustryInput").val(currentUser.profile.industry);
    $("#companyLocationInput").val(currentUser.profile.location);
    $("#companyWebsite").val(currentUser.profile.website);
    $("#companyDescription").val(currentUser.profile.description);
  });
}
