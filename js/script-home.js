let visibleJobs = 6;
let allJobs = [];
let filteredJobs = [];

$(document).ready(function () {
  loadJobs();
    updateStatistics();
  setupHomeEventHandlers();
});

function loadJobs() {
  allJobs = JSON.parse(localStorage.getItem("jobs")) || [];
  filteredJobs = [...allJobs];
  displayJobs(filteredJobs.slice(0, visibleJobs));
}

function displayJobs(jobsToDisplay) {
  const container = $("#jobResults");
  container.empty();

  if (jobsToDisplay.length === 0) {
    container.html('<p class="text-muted">No jobs found</p>');
    return;
  }

  const users = JSON.parse(localStorage.getItem("users")) || [];

  jobsToDisplay.forEach((job) => {
    const employer = users.find((u) => u.id === job.employerId);
    const employerName = employer
      ? employer.profile.companyName
      : "Unknown Company";

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
                    </div>
                </div>
            </div>
        `);
  });

  if (filteredJobs.length > visibleJobs) {
    if (!$("#loadMoreJobs").length) {
      $("#jobResults").append(`
                <div class="text-center mt-3">
                    <button id="loadMoreJobs" class="btn btn-primary">Load More</button>
                </div>
            `);
    } else {
      $("#loadMoreJobs").show();
    }
  } else {
    $("#loadMoreJobs").hide();
  }
}

function searchJobs() {
  const keyword = $("#searchKeyword").val().toLowerCase();
  const location = $("#searchLocation").val().toLowerCase();
  const jobType = $("#searchJobType").val();
  const category = $("#searchCategory").val();

  filteredJobs = allJobs.filter((job) => {
    const matchesKeyword = keyword
      ? job.title.toLowerCase().includes(keyword) ||
        job.description.toLowerCase().includes(keyword)
      : true;

    const matchesLocation = location
      ? job.location.toLowerCase().includes(location)
      : true;

    const matchesJobType = jobType ? job.type === jobType : true;

    const matchesCategory = category ? job.category === category : true;

    return (
      matchesKeyword && matchesLocation && matchesJobType && matchesCategory
    );
  });

  visibleJobs = 6;
  displayJobs(filteredJobs.slice(0, visibleJobs));
}

function loadMoreJobs() {
  visibleJobs += 6;
  displayJobs(filteredJobs.slice(0, visibleJobs));
}

function showJobDetails(jobId) {
  const jobs = JSON.parse(localStorage.getItem("jobs")) || [];
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const job = jobs.find((j) => j.id === jobId);

  if (!job) return;

  const employer = users.find((u) => u.id === job.employerId);

  $("#jobDetailsContent").html(`
        <div>
            <h4>${job.title}</h4>
            <p class="text-muted">${
              employer ? employer.profile.companyName : "Unknown Company"
            }</p>
            
            <div class="d-flex flex-wrap gap-2 mb-4">
                <span class="badge bg-primary">${job.type}</span>
                <span class="text-muted"><i class="bi bi-geo-alt"></i> ${
                  job.location
                }</span>
                <span class="text-muted"><i class="bi bi-cash"></i> ${
                  job.salary
                }</span>
            </div>
            
            <h5>Job Description</h5>
            <p>${job.description}</p>
            
            <h5 class="mt-4">Requirements</h5>
            <ul>
                ${job.requirements
                  .split("\n")
                  .map((req) => `<li>${req}</li>`)
                  .join("")}
            </ul>
            
            <div class="row mt-4">
                <div class="col-md-6">
                    <h5>Job Overview</h5>
                    <table class="table table-bordered">
                        <tr>
                            <td>Posted Date:</td>
                            <td>${new Date(
                              job.postedAt
                            ).toLocaleDateString()}</td>
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
                    ${
                      employer
                        ? `
                        <p><strong>${employer.profile.companyName}</strong></p>
                        <p>${
                          employer.profile.description ||
                          "No description available"
                        }</p>
                        <p><strong>Website:</strong> <a href="${
                          employer.profile.website
                        }" target="_blank">${employer.profile.website}</a></p>
                        <p><strong>Email:</strong> ${employer.email}</p>
                    `
                        : "<p>Company information not available</p>"
                    }
                </div>
            </div>
        </div>
    `);

  $("#jobDetailsModal").data("job-id", jobId);
  $("#jobDetailsModal").modal("show");
}

function updateStatistics() {
  // Fetch jobs data
  const storedJobs = localStorage.getItem("jobs");
  let jobs = [];
  if (storedJobs) {
    jobs = JSON.parse(storedJobs);
  }
  $("#allJobsCount").text(jobs.length);

  // Fetch users data
  const storedUsers = localStorage.getItem("users");
  let users = [];
  if (storedUsers) {
    users = JSON.parse(storedUsers);
  }

  // Filter for job seekers and employers
  const jobSeekers = users.filter((user) => user.role === "job_seeker");
  const employers = users.filter((user) => user.role === "employer");

  $("#jobSeekerCount").text(jobSeekers.length);
  $("#jobEmployerCount").text(employers.length);
}

function setupHomeEventHandlers() {
  // Search jobs
  $("#searchJobsBtn").on("click", searchJobs);

  // Load more jobs
  $(document).on("click", "#loadMoreJobs", loadMoreJobs);

  // View job details
  $(document).on("click", ".view-details", function () {
    showJobDetails($(this).data("job-id"));
  });

  // Apply for job (if logged in as seeker)
  $(document).on("click", "#applyJobBtn", function () {
    showAlert("Please login as a job seeker to apply for jobs", "danger");
    setTimeout(() => {
            window.location.href = "jobseekerlogin.html";
        }, 2500);
    return;
  });
}


