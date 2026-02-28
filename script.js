// Sections array with protected status
const sections = [
    { id: "hero", protected: false },
    { id: "loginSection", protected: false },
    { id: "register", protected: false },
    { id: "nextStage", protected: true },
    { id: "after12", protected: true },
    { id: "degree", protected: true },
    { id: "roadMaps", protected: true },
    { id: "bookMarks", protected: true },
    { id: "myTasks", protected: true }
];

// Bookmark storage
let bookmarks = JSON.parse(localStorage.getItem('mystepBookmarks')) || [];

// Auth state
let isLoggedIn = false;
let currentUser = null;
let resetEmail = "";
let generatedOTP = "";

// Function to check password strength
function checkPasswordStrength(password) {
    let strength = 0;
    let feedback = [];
    
    // Check length
    if (password.length < 8) {
        feedback.push("at least 8 characters");
    } else {
        strength += 1;
    }
    
    // Check for uppercase letters
    if (!/[A-Z]/.test(password)) {
        feedback.push("one uppercase letter");
    } else {
        strength += 1;
    }
    
    // Check for lowercase letters
    if (!/[a-z]/.test(password)) {
        feedback.push("one lowercase letter");
    } else {
        strength += 1;
    }
    
    // Check for numbers
    if (!/[0-9]/.test(password)) {
        feedback.push("one number");
    } else {
        strength += 1;
    }
    
    // Check for special characters
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        feedback.push("one special character");
    } else {
        strength += 1;
    }
    
    return {
        score: strength,
        maxScore: 5,
        feedback: feedback,
        isStrong: strength >= 4,
        message: feedback.length > 0 
            ? `Password needs: ${feedback.join(", ")}`
            : "Password is strong! ✓"
    };
}

// Function to update password strength UI
function updatePasswordStrength(password, elementId) {
    const result = checkPasswordStrength(password);
    const strengthBar = document.getElementById('passwordStrengthBar');
    const strengthText = document.getElementById('passwordStrengthText');
    const signupBtn = document.querySelector('#signupForm button[type="submit"]');
    
    if (!strengthBar || !strengthText) return;
    
    // Update strength bar
    const percentage = (result.score / result.maxScore) * 100;
    strengthBar.style.width = percentage + '%';
    
    // Update bar color based on strength
    if (result.score <= 2) {
        strengthBar.className = 'h-2 rounded-full bg-red-500';
        strengthText.className = 'text-xs text-red-500 mt-1';
    } else if (result.score <= 3) {
        strengthBar.className = 'h-2 rounded-full bg-yellow-500';
        strengthText.className = 'text-xs text-yellow-500 mt-1';
    } else if (result.score <= 4) {
        strengthBar.className = 'h-2 rounded-full bg-blue-500';
        strengthText.className = 'text-xs text-blue-500 mt-1';
    } else {
        strengthBar.className = 'h-2 rounded-full bg-green-500';
        strengthText.className = 'text-xs text-green-500 mt-1';
    }
    
    // Update message
    strengthText.textContent = result.message;
    
    // Disable signup button if password is not strong enough
    if (signupBtn) {
        if (result.isStrong || password.length === 0) {
            signupBtn.disabled = false;
            signupBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            signupBtn.disabled = true;
            signupBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }
    
    return result;
}

// Function to update navbar with user info
function updateNavbarForUser() {
    const navAuthBtn = document.getElementById('navAuthBtn');
    const navContainer = document.querySelector('nav');
    
    // Remove existing user display if any
    const existingUserDisplay = document.getElementById('userDisplay');
    if (existingUserDisplay) {
        existingUserDisplay.remove();
    }
    
    if (isLoggedIn && currentUser) {
        // Update login button to logout
        navAuthBtn.textContent = 'Logout';
        
        // Create user display element
        const userDisplay = document.createElement('div');
        userDisplay.id = 'userDisplay';
        userDisplay.className = 'ml-4 flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 rounded-full';
        userDisplay.innerHTML = `
            <span class="text-2xl">👤</span>
            <span class="font-semibold text-blue-600">${currentUser.name.split(' ')[0]}</span>
        `;
        
        // Insert before the auth button
        navContainer.insertBefore(userDisplay, navAuthBtn);
    } else {
        navAuthBtn.textContent = 'Login';
    }
}

// Function to switch sections with authentication check
function switchSection(id) {
    // Find the section config
    const sectionConfig = sections.find(s => s.id === id);
    
    // If section is protected and user not logged in
    if (sectionConfig && sectionConfig.protected && !isLoggedIn) {
        showLoginRequiredMessage();
        id = 'loginSection'; // Redirect to login
        switchAuthTab('login');
    }
    
    // 1. Hide all sections and remove active classes
    sections.forEach(sec => {
        const el = document.getElementById(sec.id);
        if (el) {
            el.classList.remove("active");
            el.style.display = "none";
        }
    });

    // 2. Show the requested section
    const targetEl = document.getElementById(id);
    if (targetEl) {
        targetEl.classList.add("active");
        targetEl.style.display = "block";
        targetEl.classList.add("fade-in");
    }

    // 3. Update Navbar Highlight
    document.querySelectorAll(".nav-link").forEach(btn => {
        const target = btn.getAttribute("data-target");
        if (target === id) {
            btn.classList.add("nav-link-active");
        } else {
            btn.classList.remove("nav-link-active");
        }
    });

    // 4. Load bookmarks if bookmark section is opened
    if (id === "bookMarks") {
        loadBookmarks();
    }
}

// Initialize click listeners for all nav buttons with auth check
document.querySelectorAll(".nav-link").forEach(btn => {
    btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-target");
        
        // Check if target is protected
        const sectionConfig = sections.find(s => s.id === target);
        if (sectionConfig && sectionConfig.protected && !isLoggedIn) {
            showLoginRequiredMessage();
            switchSection('loginSection');
            switchAuthTab('login');
        } else {
            switchSection(target);
        }
    });
});

// Handle auth button click
function handleAuthClick() {
    if (isLoggedIn) {
        logout();
    } else {
        switchSection('loginSection');
        switchAuthTab('login');
    }
}

// Switch between login/signup tabs
function switchAuthTab(tab) {
    document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
    document.getElementById('tabSignup').classList.toggle('active', tab === 'signup');

    document.getElementById('loginForm').classList.toggle('active', tab === 'login');
    document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
    document.getElementById('signupForm').classList.toggle('active', tab === 'signup');
    document.getElementById('signupForm').classList.toggle('hidden', tab !== 'signup');

    // Hide other forms
    document.getElementById('forgotForm').classList.add('hidden');
    document.getElementById('otpForm').classList.add('hidden');
    document.getElementById('resetForm').classList.add('hidden');

    // Clear messages
    clearAllMessages();
}

// Show forgot password form
function showForgotPassword(event) {
    event.preventDefault();
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('active');
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('forgotForm').classList.remove('hidden');
    document.getElementById('forgotForm').classList.add('active');
    clearAllMessages();
}

// Toggle password visibility
function togglePassword(inputId, element) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        element.textContent = '🔒';
    } else {
        input.type = 'password';
        element.textContent = '👁️';
    }
}

// Clear all messages
function clearAllMessages() {
    document.querySelectorAll('.message').forEach(msg => {
        msg.classList.remove('show', 'error', 'success');
        msg.textContent = '';
    });
}

// Show message
function showMessage(elementId, text, isSuccess = false) {
    const msg = document.getElementById(elementId);
    msg.textContent = text;
    msg.classList.add('show');
    msg.classList.add(isSuccess ? 'success' : 'error');
    msg.classList.remove(isSuccess ? 'error' : 'success');
}

// Handle Login
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Check if user exists in localStorage
    const userData = localStorage.getItem('user_' + email);

    if (userData) {
        const user = JSON.parse(userData);
        if (user.password === password) {
            // Login successful
            isLoggedIn = true;
            currentUser = user;
            
            // Update navbar with user info
            updateNavbarForUser();
            
            showMessage('loginMessage', `Welcome back, ${user.name}! Redirecting...`, true);

            setTimeout(() => {
                switchSection('hero');
            }, 1500);
            return;
        }
    }

    showMessage('loginMessage', 'Invalid email or password');
}

// Handle Signup with password strength validation
function handleSignup(event) {
    event.preventDefault();

    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const mobile = document.getElementById('signupMobile').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;

    // Check password strength
    const passwordStrength = checkPasswordStrength(password);
    if (!passwordStrength.isStrong) {
        showMessage('signupMessage', 'Please create a stronger password: ' + passwordStrength.message);
        return;
    }

    // Validation
    if (mobile.length !== 10) {
        showMessage('signupMessage', 'Mobile number must be 10 digits');
        return;
    }

    if (password !== confirmPassword) {
        showMessage('signupMessage', 'Passwords do not match');
        return;
    }

    // Check if user already exists
    if (localStorage.getItem('user_' + email)) {
        showMessage('signupMessage', 'Email already registered');
        return;
    }

    // Save user
    const user = {
        name,
        email,
        mobile,
        password
    };
    localStorage.setItem('user_' + email, JSON.stringify(user));

    showMessage('signupMessage', 'Account created successfully! Please login.', true);

    // Clear form and switch to login after delay
    setTimeout(() => {
        switchAuthTab('login');
        document.getElementById('signupName').value = '';
        document.getElementById('signupEmail').value = '';
        document.getElementById('signupMobile').value = '';
        document.getElementById('signupPassword').value = '';
        document.getElementById('signupConfirmPassword').value = '';
        // Reset password strength indicator
        const strengthBar = document.getElementById('passwordStrengthBar');
        const strengthText = document.getElementById('passwordStrengthText');
        if (strengthBar) strengthBar.style.width = '0%';
        if (strengthText) strengthText.textContent = '';
    }, 2000);
}

// Handle Forgot Password
function handleForgotPassword(event) {
    event.preventDefault();
    const email = document.getElementById('forgotEmail').value.trim();

    // Check if user exists
    if (!localStorage.getItem('user_' + email)) {
        showMessage('forgotMessage', 'Email not registered');
        return;
    }

    // Generate OTP
    resetEmail = email;
    generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();

    // Show OTP in alert (simulating email)
    alert(`Your OTP is: ${generatedOTP}`);

    // Switch to OTP form
    document.getElementById('forgotForm').classList.remove('active');
    document.getElementById('forgotForm').classList.add('hidden');
    document.getElementById('otpForm').classList.remove('hidden');
    document.getElementById('otpForm').classList.add('active');
    clearAllMessages();
}

// Handle OTP Verification
function handleVerifyOTP(event) {
    event.preventDefault();
    const otp = document.getElementById('otpInput').value.trim();

    if (otp === generatedOTP) {
        // Switch to reset password form
        document.getElementById('otpForm').classList.remove('active');
        document.getElementById('otpForm').classList.add('hidden');
        document.getElementById('resetForm').classList.remove('hidden');
        document.getElementById('resetForm').classList.add('active');
        clearAllMessages();
    } else {
        showMessage('otpMessage', 'Invalid OTP');
    }
}

// Handle Reset Password
function handleResetPassword(event) {
    event.preventDefault();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;

    if (newPassword !== confirmPassword) {
        showMessage('resetMessage', 'Passwords do not match');
        return;
    }

    // Check password strength for reset
    const passwordStrength = checkPasswordStrength(newPassword);
    if (!passwordStrength.isStrong) {
        showMessage('resetMessage', 'Please create a stronger password: ' + passwordStrength.message);
        return;
    }

    // Update password
    const user = JSON.parse(localStorage.getItem('user_' + resetEmail));
    user.password = newPassword;
    localStorage.setItem('user_' + resetEmail, JSON.stringify(user));

    showMessage('resetMessage', 'Password reset successfully!', true);

    // Switch to login after delay
    setTimeout(() => {
        switchAuthTab('login');
        document.getElementById('forgotEmail').value = '';
        document.getElementById('otpInput').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';
    }, 2000);
}

// Logout
function logout() {
    isLoggedIn = false;
    currentUser = null;
    
    // Update navbar
    updateNavbarForUser();
    
    // Switch to hero section after logout
    switchSection('hero');
    
    // Show logout message
    const messageDiv = document.createElement('div');
    messageDiv.className = 'fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 fade-in';
    messageDiv.innerHTML = '✅ Logged out successfully';
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Check for existing session on page load
function checkExistingSession() {
    // You could implement persistent login using localStorage/sessionStorage
    // For now, we'll start logged out
    isLoggedIn = false;
    currentUser = null;
    updateNavbarForUser();
}

// Check login status on page load
window.addEventListener('DOMContentLoaded', () => {
    // Check for existing session
    checkExistingSession();

    // Add password strength indicator to signup form
    addPasswordStrengthIndicator();
    
    // Add real-time password validation
    const passwordInput = document.getElementById('signupPassword');
    if (passwordInput) {
        passwordInput.addEventListener('input', function(e) {
            updatePasswordStrength(e.target.value, 'signupPassword');
        });
    }

    // Load saved user data from register form
    const stored = localStorage.getItem("mystepUser");
    if (!stored) return;

    try {
        const user = JSON.parse(stored);
        if (user.fullName) document.getElementById("regName").value = user.fullName;
        if (user.dob) document.getElementById("regBirth").value = user.dob;
        if (user.nationality) document.getElementById("regNationality").value = user.nationality;
        if (user.status) document.getElementById("regStatus").value = user.status;
        if (user.gender) {
            document.querySelectorAll("input[name='regGender']").forEach(radio => {
                if (radio.value === user.gender) {
                    radio.checked = true;
                }
            });
        }
    } catch (e) {
        console.error("Could not parse mystepUser from localStorage", e);
    }

    // Initialize task checklist
    buildTaskChecklist();
});

// Function to add password strength indicator to signup form
function addPasswordStrengthIndicator() {
    const passwordGroup = document.querySelector('#signupForm .password-input').parentNode;
    
    // Create strength indicator container
    const strengthContainer = document.createElement('div');
    strengthContainer.className = 'mt-2';
    strengthContainer.innerHTML = `
        <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div id="passwordStrengthBar" class="h-2 rounded-full bg-gray-500" style="width: 0%"></div>
        </div>
        <p id="passwordStrengthText" class="text-xs mt-1"></p>
    `;
    
    passwordGroup.appendChild(strengthContainer);
}

// Add bookmark function with auth check
function addBookmark(item, type) {
    if (!isLoggedIn) {
        showLoginRequiredMessage();
        switchSection('loginSection');
        return;
    }
    
    const bookmark = {
        id: Date.now(),
        title: item,
        type: type,
        date: new Date().toLocaleDateString()
    };

    bookmarks.push(bookmark);
    localStorage.setItem('mystepBookmarks', JSON.stringify(bookmarks));

    // Show feedback
    alert('✅ Bookmark added!');

    // If on bookmarks page, refresh the list
    if (document.getElementById('bookMarks').classList.contains('active')) {
        loadBookmarks();
    }
}

// Load bookmarks function
function loadBookmarks() {
    const bookmarkList = document.getElementById('bookmarkList');
    if (!bookmarkList) return;

    bookmarkList.innerHTML = '';

    if (bookmarks.length === 0) {
        bookmarkList.innerHTML = '<p class="text-gray-500">No bookmarks yet. Start adding some!</p>';
        return;
    }

    bookmarks.forEach(bookmark => {
        const div = document.createElement('div');
        div.className = 'bg-white rounded-xl p-4 shadow flex justify-between items-center';
        div.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-2xl">${bookmark.type === 'exam' ? '📝' : '📚'}</span>
                <div>
                    <p class="font-semibold text-left">${bookmark.title}</p>
                    <p class="text-xs text-gray-500 text-left">Added: ${bookmark.date}</p>
                </div>
            </div>
            <button onclick="removeBookmark(${bookmark.id})" class="text-red-500 hover:text-red-700">
                ❌
            </button>
        `;
        bookmarkList.appendChild(div);
    });
}

// Remove bookmark function
function removeBookmark(id) {
    bookmarks = bookmarks.filter(b => b.id !== id);
    localStorage.setItem('mystepBookmarks', JSON.stringify(bookmarks));
    loadBookmarks();
}

// Handle register submit
function handleRegisterSubmit() {
    // Get values
    const nameEl = document.getElementById("regName");
    const dobEl = document.getElementById("regBirth");
    const nationalityEl = document.getElementById("regNationality");
    const statusEl = document.getElementById("regStatus");
    const genderEls = document.querySelectorAll("input[name='regGender']");

    const fullName = nameEl ? nameEl.value.trim() : "";
    const dob = dobEl ? dobEl.value.trim() : "";
    const nationality = nationalityEl ? nationalityEl.value.trim() : "";
    const status = statusEl ? statusEl.value : "";

    let gender = "Male";
    genderEls.forEach(radio => {
        if (radio.checked) gender = radio.value;
    });

    // Clear old errors
    document.getElementById("regNameError").textContent = "";
    document.getElementById("regBirthError").textContent = "";
    document.getElementById("regNationalityError").textContent = "";

    // Basic validation
    let isValid = true;

    if (!fullName) {
        document.getElementById("regNameError").textContent = "Full name is required.";
        isValid = false;
    }
    if (!dob) {
        document.getElementById("regBirthError").textContent = "Date of birth is required.";
        isValid = false;
    }
    if (!nationality) {
        document.getElementById("regNationalityError").textContent = "Nationality is required.";
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    // Build user object and save to localStorage
    const userProfile = {
        fullName,
        dob,
        gender,
        nationality,
        status,
        updatedAt: new Date().toISOString()
    };

    try {
        localStorage.setItem("mystepUser", JSON.stringify(userProfile));

        // Animation flow
        const card = document.getElementById("register-card");
        card.classList.add("fade-out-left");

        card.addEventListener("animationend", () => {
            card.style.display = "none";
            const stage = document.getElementById("logged-and-stage");
            stage.classList.remove("hidden");
            stage.classList.add("fade-in");
        }, {
            once: true
        });
    } catch (e) {
        console.error("Could not save to localStorage", e);
        alert("Something went wrong while saving your profile. Please try again.");
    }
}

// Select stage after registration
function selectStage(stageId) {
    const container = document.getElementById("logged-and-stage");
    container.classList.add("fade-out-left");

    container.addEventListener("animationend", () => {
        const sectionMap = {
            after10: "nextStage",
            after12: "after12",
            degree: "degree"
        };
        switchSection(sectionMap[stageId] || stageId);
    }, {
        once: true
    });
}

// ---------- AFTER 10th ----------
const after10Data = {
    science: {
        title: "Science Stream Roadmap",
        exams: [{
                name: "JEE Main & Advanced",
                link: "https://jeemain.nta.nic.in/"
            },
            {
                name: "NEET",
                link: "https://neet.nta.nic.in/"
            },
            {
                name: "BITSAT",
                link: "https://admissions.bits-pilani.ac.in/"
            },
            {
                name: "EAMCET",
                link: "https://eapcet.tgche.ac.in/"
            }
        ],
        skills: ["Strong Math & Physics", "Logical Thinking", "Problem Solving", "Basic Coding"]
    },
    commerce: {
        title: "Commerce Stream Roadmap",
        exams: [{
                name: "CA Foundation",
                link: "https://www.icai.org/post/foundation-nset"
            },
            {
                name: "CS Foundation",
                link: "https://www.icsi.edu/home/"
            },
            {
                name: "CMA",
                link: "https://www.icmai.in/icmai/"
            },
            {
                name: "BBA Entrance / CUET",
                link: "https://cuet.nta.nic.in/"
            }
        ],
        skills: ["Accounting Basics", "Business Knowledge", "Communication Skills", "Financial Awareness"]
    },
    arts: {
        title: "Arts Stream Roadmap",
        exams: [{
                name: "CUET",
                link: "https://cuet.nta.nic.in/"
            },
            {
                name: "CLAT",
                link: "https://consortiumofnlus.ac.in/"
            },
            {
                name: "Design / Media Exams",
                link: "https://geu.ac.in/blog/design-entrance-exams-india/"
            },
            {
                name: "UPSC (later stage)",
                link: "https://upsconline.nic.in/"
            }
        ],
        skills: ["Critical Thinking", "Writing Skills", "Public Speaking", "General Awareness"]
    }
};

function clearStreamHighlight() {
    document.querySelectorAll(".streamCard").forEach(card => card.classList.remove("border-blue-500"));
}

function selectStream(key) {
    if (!isLoggedIn) {
        showLoginRequiredMessage();
        switchSection('loginSection');
        return;
    }
    
    clearStreamHighlight();
    const data = after10Data[key];
    if (!data) return;

    document.getElementById(key === "science" ? "scienceCard" : key === "commerce" ? "commerceCard" : "artsCard")
        .classList.add("border-blue-500");

    document.getElementById("streamTitle").textContent = data.title;

    const examList = document.getElementById("streamExamList");
    examList.innerHTML = "";

    data.exams.forEach(exam => {
        const li = document.createElement("li");
        li.className = "flex justify-between items-center";
        li.innerHTML = `
            <span>• <a href="${exam.link}" target="_blank" class="text-blue-600 hover:underline">${exam.name}</a></span>
            <button onclick="addBookmark('${exam.name}','exam')" class="text-yellow-500 hover:scale-110 transition ml-2">
                ⭐
            </button>
        `;
        examList.appendChild(li);
    });

    const skillsList = document.getElementById("streamSkillsList");
    skillsList.innerHTML = "";
    data.skills.forEach(skill => {
        const li = document.createElement("li");
        li.className = "flex justify-between items-center";
        li.innerHTML = `
            <span>• ${skill}</span>
            <button onclick="addBookmark('${skill}','skill')" class="text-yellow-500 hover:scale-110 transition ml-2">
                ⭐
            </button>
        `;
        skillsList.appendChild(li);
    });

    document.getElementById("after10Panel").classList.remove("hidden");
}

// ---------- AFTER 12th ----------
const after12Roadmap = {
    mpc: {
        title: "MPC – Engineering & Technology",
        timeline: ["Prepare for JEE / EAMCET", "Choose Engineering Branch", "Develop Coding & Project Skills", "Select College & Plan Internships"],
        exams: [{
                name: "JEE Main",
                link: "https://jeemain.nta.nic.in/"
            },
            {
                name: "JEE Advanced",
                link: "https://jeeadv.ac.in/"
            },
            {
                name: "BITSAT",
                link: "https://admissions.bits-pilani.ac.in/"
            },
            {
                name: "EAPCET",
                link: "https://eapcet.tgche.ac.in/"
            }
        ],
        careers: ["CSE", "ECE", "Mechanical", "Civil", "AI & Data Science"]
    },
    bipc: {
        title: "BiPC – Medical & Life Sciences",
        timeline: ["Prepare for NEET and similar exams", "Choose Medical / Allied Field", "Complete Core Degree (MBBS / BDS / B.Pharm)", "Plan Specialization / Higher Studies"],
        exams: [{
                name: "NEET",
                link: "https://neet.nta.nic.in/"
            },
            {
                name: "AIIMS",
                link: "https://aiimsexams.ac.in/"
            },
            {
                name: "JIPMER",
                link: "https://jipmer.edu.in/"
            }
        ],
        careers: ["MBBS", "BDS", "Pharmacy", "Biotechnology"]
    },
    commerce: {
        title: "Commerce – Finance & Business",
        timeline: ["Join B.Com / BBA", "Prepare for CA / CMA alongside", "Internships in Finance / Business", "Plan MBA / Professional Courses"],
        exams: [{
                name: "CA Foundation",
                link: "https://www.icai.org/post/foundation-nset"
            },
            {
                name: "CMA",
                link: "https://www.icmai.in/icmai/"
            },
            {
                name: "CUET",
                link: "https://cuet.nta.nic.in/"
            }
        ],
        careers: ["CA", "Investment Banking", "Business Analyst"]
    },
    arts: {
        title: "Arts – Law & Public Services",
        timeline: ["Explore BA / BA LLB", "Build CLAT / UPSC oriented base", "Internships in Legal / Media fields", "Attempt Competitive Exams / Higher Studies"],
        exams: [{
                name: "CLAT",
                link: "https://consortiumofnlus.ac.in/"
            },
            {
                name: "CUET",
                link: "https://cuet.nta.nic.in/"
            },
            {
                name: "UPSC (later)",
                link: "https://upsconline.nic.in/"
            }
        ],
        careers: ["Lawyer", "IAS Officer", "Journalist"]
    }
};

function clearPathCards() {
    document.querySelectorAll(".pathCard").forEach(card => card.classList.remove("border-blue-500"));
}

function selectPath(path) {
    if (!isLoggedIn) {
        showLoginRequiredMessage();
        switchSection('loginSection');
        return;
    }
    
    clearPathCards();
    const idMap = {
        mpc: "mpc",
        bipc: "bipc",
        commerce: "after12Commerce",
        arts: "after12Arts"
    };
    document.getElementById(idMap[path]).classList.add("border-blue-500");

    const data = after12Roadmap[path];
    if (!data) return;

    document.getElementById("pathTitle").textContent = data.title;

    const tContainer = document.getElementById("timeline");
    tContainer.innerHTML = "";
    data.timeline.forEach((step, i) => {
        const div = document.createElement("div");
        div.className = "mb-8 relative fade-in";
        div.innerHTML = `
            <div class="absolute -left-4 w-8 h-8 bg-blue-500 text-white flex items-center justify-center rounded-full">${i + 1}</div>
            <p class="ml-4 text-gray-700">${step}</p>
        `;
        tContainer.appendChild(div);
    });

    const examList = document.getElementById("after12ExamList");
    examList.innerHTML = "";
    data.exams.forEach(exam => {
        const li = document.createElement("li");
        li.className = "flex justify-between items-center";
        li.innerHTML = `
            <span>• <a href="${exam.link}" target="_blank" class="text-blue-600 hover:underline">${exam.name}</a></span>
            <button onclick="addBookmark('${exam.name}','exam')" class="text-yellow-500 hover:scale-110 transition ml-2">
                ⭐
            </button>
        `;
        examList.appendChild(li);
    });

    const careerOptions = document.getElementById("careerOptions");
    careerOptions.innerHTML = "";
    data.careers.forEach(c => {
        const span = document.createElement("span");
        span.className = "px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100";
        span.textContent = c;
        careerOptions.appendChild(span);
    });

    buildChecklist(data.timeline, "after12Checklist", "after12ProgressBar", "after12ProgressText");
    document.getElementById("after12Panel").classList.remove("hidden");
}

// ---------- DEGREE ----------
const degreeData = {
    btech: {
        title: "B.Tech – 4 Year Engineering Roadmap",
        years: ["Year 1: Learn fundamentals (Maths, Programming, Basics)", "Year 2: Core branch subjects + Mini Projects", "Year 3: Internships + Advanced Technologies", "Year 4: Major Project + Placements or GATE prep"],
        skills: ["DSA", "Web/App Development", "Internships", "Communication Skills"]
    },
    mbbs: {
        title: "MBBS – 5.5 Year Medical Roadmap",
        years: ["Year 1: Anatomy & Physiology", "Year 2: Pathology & Pharmacology", "Year 3: Clinical Exposure", "Internship Year: Hospital Training"],
        skills: ["Clinical Skills", "Patient Communication", "Medical Ethics"]
    },
    bba: {
        title: "BBA – Business Roadmap",
        years: ["Year 1: Management Fundamentals", "Year 2: Marketing & Finance", "Year 3: Internship + Specialization"],
        skills: ["Leadership", "Business Analytics", "Public Speaking"]
    },
    law: {
        title: "LLB – Law Career Roadmap",
        years: ["Year 1: Legal Foundations", "Year 2: Criminal & Civil Law", "Year 3: Court Internships"],
        skills: ["Argumentation", "Research", "Drafting Skills"]
    }
};

function clearDegreeCards() {
    document.querySelectorAll(".degreeCard").forEach(card => card.classList.remove("border-blue-500"));
}

function selectDegree(degree) {
    if (!isLoggedIn) {
        showLoginRequiredMessage();
        switchSection('loginSection');
        return;
    }
    
    clearDegreeCards();
    document.getElementById(degree).classList.add("border-blue-500");

    const data = degreeData[degree];
    if (!data) return;

    document.getElementById("degreeTitle").textContent = data.title;

    const yearTimeline = document.getElementById("yearTimeline");
    yearTimeline.innerHTML = "";
    data.years.forEach((year, i) => {
        const div = document.createElement("div");
        div.className = "mb-8 relative fade-in";
        div.innerHTML = `
            <div class="absolute -left-4 w-8 h-8 bg-blue-600 text-white flex items-center justify-center rounded-full">${i + 1}</div>
            <p class="ml-4 text-gray-700 font-medium">${year}</p>
        `;
        yearTimeline.appendChild(div);
    });

    const skillsList = document.getElementById("skillsList");
    skillsList.innerHTML = "";
    data.skills.forEach(skill => {
        const li = document.createElement("li");
        li.className = "flex justify-between items-center";
        li.innerHTML = `
            <span>• ${skill}</span>
            <button onclick="addBookmark('${skill}','skill')" class="text-yellow-500 hover:scale-110 transition ml-2">
                ⭐
            </button>
        `;
        skillsList.appendChild(li);
    });

    buildChecklist(data.years, "checklist", "degreeProgressBar", "degreeProgressText");
    document.getElementById("degreePanel").classList.remove("hidden");
}

// ---------- SHARED CHECKLIST ----------
function buildChecklist(steps, checklistId, barId, textId) {
    const container = document.getElementById(checklistId);
    container.innerHTML = "";

    steps.forEach(step => {
        const label = document.createElement("label");
        label.className = "flex items-center space-x-3 cursor-pointer";
        label.innerHTML = `
            <input type="checkbox" class="w-4 h-4" onchange="updateProgress('${checklistId}','${barId}','${textId}')">
            <span>${step}</span>
        `;
        container.appendChild(label);
    });

    updateProgress(checklistId, barId, textId);
}

function updateProgress(checklistId, barId, textId) {
    const total = document.querySelectorAll(`#${checklistId} input`).length;
    const checked = document.querySelectorAll(`#${checklistId} input:checked`).length;
    const percent = total ? Math.round((checked / total) * 100) : 0;

    const bar = document.getElementById(barId);
    const text = document.getElementById(textId);

    if (bar) bar.style.width = percent + "%";
    if (text) text.textContent = percent + "%";
}

// Show login required message
function showLoginRequiredMessage() {
    // Create a temporary message
    const messageDiv = document.createElement('div');
    messageDiv.className = 'fixed top-20 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 fade-in';
    messageDiv.innerHTML = '⚠️ Please login first to access this section';
    document.body.appendChild(messageDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// ---------- MY TASKS ----------
const mockTests = [
    "JEE Main & Advanced",
    "NEET",
    "BITSAT",
    "EAMCET"
];

function buildTaskChecklist() {
    const container = document.getElementById("taskChecklist");
    if (!container) return;

    container.innerHTML = "";
    mockTests.forEach(test => {
        const label = document.createElement("label");
        label.className = "flex items-center space-x-4 p-4 bg-white rounded-2xl shadow cursor-pointer hover:shadow-md transition";
        label.innerHTML = `
            <input type="checkbox" class="w-5 h-5 accent-blue-600" onchange="updateTaskProgress()">
            <span class="text-gray-700 font-medium">${test} Mock Test</span>
        `;
        container.appendChild(label);
    });
}

function updateTaskProgress() {
    const total = document.querySelectorAll("#taskChecklist input").length;
    const checked = document.querySelectorAll("#taskChecklist input:checked").length;
    const percent = total ? Math.round((checked / total) * 100) : 0;

    const bar = document.getElementById("taskProgressBar");
    const text = document.getElementById("taskProgressText");

    if (bar) bar.style.width = percent + "%";
    if (text) text.textContent = percent + "%";
}