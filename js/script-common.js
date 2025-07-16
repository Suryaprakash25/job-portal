// Common functionality used across all pages
let currentUser = null;

// Initialize localStorage with default data if empty
async function initializeLocalStorage() {
    try {
        if (!localStorage.getItem("initialized")) {
            const [usersResponse, jobsResponse, appsResponse] = await Promise.all([
                fetch('data/users.json'),
                fetch('data/jobs.json'),
                fetch('data/applications.json')
            ]);
            
            const usersData = await usersResponse.json();
            const jobsData = await jobsResponse.json();
            const appsData = await appsResponse.json();
            
            localStorage.setItem("users", JSON.stringify(usersData.users));
            localStorage.setItem("jobs", JSON.stringify(jobsData.jobs));
            localStorage.setItem("applications", JSON.stringify(appsData.applications));
            localStorage.setItem("initialized", "true");
        }
    } catch (error) {
        console.error("Error initializing localStorage:", error);
        if (!localStorage.getItem("users")) localStorage.setItem("users", JSON.stringify([]));
        if (!localStorage.getItem("jobs")) localStorage.setItem("jobs", JSON.stringify([]));
        if (!localStorage.getItem("applications")) localStorage.setItem("applications", JSON.stringify([]));
    }
}

// Create the alert HTML structure if it doesn't exist
if ($('#alertMessage').length === 0) {
    $('body').prepend(`
        <div id="alertMessage" class="alert-message alert alert-dismissible fade show" role="alert" style="display: none;">
            <span id="alertText" class="p-2 me-3"></span>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `);
}

// Show alert message function
function showAlert(message, type = 'success') {
    const $alert = $('#alertMessage');
    const $alertText = $('#alertText');
    
    // Remove all alert type classes and add the new one
    $alert.removeClass('alert-success alert-danger alert-warning alert-info')
           .addClass(`alert-${type}`);
    
    $alertText.text(message);
    $alert.fadeIn();
    
    // Hide the alert after 5 seconds
    setTimeout(() => {
        $alert.fadeOut();
    }, 5000);
}

// Handle close button click
$(document).on('click', '#alertMessage .btn-close', function() {
    $('#alertMessage').fadeOut();
});

// Check authentication status
function checkAuth() {
    currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const currentPath = window.location.pathname.split("/").pop();

    if (!currentUser && (currentPath === "seekerdashboard.html" || currentPath === "employerdashboard.html")) {
        window.location.href = "index.html";
        return;
    }

    if (currentUser) {
        if (currentUser.role === "job_seeker" && currentPath === "jobseekerlogin.html") {
            window.location.href = "seekerdashboard.html";
        } else if (currentUser.role === "employer" && currentPath === "jobemployerlogin.html") {
            window.location.href = "employerdashboard.html";
        }
    }
}

// Logout functionality
function setupLogout() {
    $("#logoutBtn").on("click", function (e) {
        e.preventDefault();
        localStorage.removeItem("currentUser");
        showAlert("Logged out successfully", "success");
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1000);
    });
}

// Initialize common functionality when DOM is ready
$(document).ready(async function() {
    await initializeLocalStorage();
    checkAuth();
    setupLogout();

    // Show/hide scroll up button based on scroll position
    $(window).scroll(function() {
        if ($(this).scrollTop() > 300) {
            $('#scrollUpBtn').removeClass('d-none');
        } else {
            $('#scrollUpBtn').addClass('d-none');
        }
    });
    
    // Smooth scroll to top when button is clicked
    $('#scrollUpBtn').click(function() {
        $('html, body').animate({scrollTop: 0}, 'Smooth');
        return false;
    });
});
