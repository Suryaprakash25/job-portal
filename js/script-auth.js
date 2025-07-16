// Authentication functionality
$(document).ready(function() {
    setupAuthEventHandlers();
});

function seekerLogin(e) {
    e.preventDefault();
    const email = $("#loginEmail").val();
    const password = $("#loginPassword").val();

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find(u => u.email === email && u.password === password && u.role === "job_seeker");

    if (user) {
        localStorage.setItem("currentUser", JSON.stringify(user));
        showAlert("Login successful! Redirecting to dashboard...", "success");
        setTimeout(() => {
            window.location.href = "seekerdashboard.html";
        }, 1500);
    } else {
        showAlert("Invalid email or password", "danger");
    }
}

function seekerRegister(e) {
    e.preventDefault();
    const name = $("#registerName").val();
    const email = $("#registerEmail").val();
    const password = $("#registerPassword").val();
    const confirmPassword = $("#confirmPassword").val();

    if (password !== confirmPassword) {
        showAlert("Passwords do not match", "danger");
        return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];

    if (users.some(u => u.email === email)) {
        showAlert("Email already registered", "danger");
        return;
    }

    const newUser = {
        id: "user_" + Date.now(),
        email,
        password,
        role: "job_seeker",
        profile: {
            name,
            title: "",
            location: "",
            skills: [],
            resume: "",
            resumeLink: "",
        },
    };

    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("currentUser", JSON.stringify(newUser));
    showAlert("Registration successful! Redirecting to dashboard...", "success");
    setTimeout(() => {
        window.location.href = "seekerdashboard.html";
    }, 1500);
}

function employerLogin(e) {
    e.preventDefault();
    const email = $("#employerEmail").val();
    const password = $("#employerPassword").val();

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find(u => u.email === email && u.password === password && u.role === "employer");

    if (user) {
        localStorage.setItem("currentUser", JSON.stringify(user));
        showAlert("Login successful! Redirecting to dashboard...", "success");
        setTimeout(() => {
            window.location.href = "employerdashboard.html";
        }, 1500);
    } else {
        showAlert("Invalid email or password", "danger");
    }
}

function employerRegister(e) {
    e.preventDefault();
    const companyName = $("#companyName").val();
    const email = $("#employerRegEmail").val();
    const password = $("#employerRegPassword").val();
    const confirmPassword = $("#employerConfirmPassword").val();

    if (password !== confirmPassword) {
        showAlert("Passwords do not match", "danger");
        return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];

    if (users.some(u => u.email === email)) {
        showAlert("Email already registered", "danger");
        return;
    }

    const newUser = {
        id: "emp_" + Date.now(),
        email,
        password,
        role: "employer",
        profile: {
            companyName,
            industry: "",
            location: "",
            website: "",
            description: "",
        },
    };

    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("currentUser", JSON.stringify(newUser));
    showAlert("Registration successful! Redirecting to dashboard...", "success");
    setTimeout(() => {
        window.location.href = "employerdashboard.html";
    }, 1500);
}

function setupAuthEventHandlers() {
    // Seeker login
    $("#loginForm").on("submit", seekerLogin);
    
    // Seeker register
    $("#registerForm").on("submit", seekerRegister);
    
    // Employer login
    $("#employerLoginForm").on("submit", employerLogin);
    
    // Employer register
    $("#employerRegisterForm").on("submit", employerRegister);
}