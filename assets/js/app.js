'use strict';

// ----- Ensure we stay on the correct view on reload (used by Google Translate EN reset) -----
document.addEventListener('DOMContentLoaded', () => {

    const activeView = localStorage.getItem('v2i_active_view') || 'landing';
    switchView(activeView, true);
});

// ----- View Routing -----
function switchView(name, initialLoad = false) {
    // Hide all views
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
    });

    // Show target view
    const target = document.getElementById('view-' + name);
    if (target) target.classList.add('active');

    // Update Nav Links
    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.remove('active');
        const text = l.textContent.trim().toLowerCase();
        // Support icons/text matching
        if ((name === 'landing' && text === 'overview') || text === name) {
            l.classList.add('active');
        }
    });

    // Save state for reloads
    localStorage.setItem('v2i_active_view', name);

    // Scroll to top smoothly if not initial load
    if (!initialLoad) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ----- Navigation Scroll Effect -----
window.addEventListener('scroll', () => {
    const nav = document.getElementById('main-nav');
    if (window.scrollY > 20) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

// ----- Dropdown Language Menu Logic -----
function toggleLangMenu() {
    const menu = document.getElementById('lang-menu');
    menu.classList.toggle('show');
}

// Close dropdown if clicked outside
document.addEventListener('click', function (event) {
    const isClickInside = event.target.closest('.nav-lang-selector');
    if (!isClickInside) {
        const dropdown = document.getElementById('lang-menu');
        if (dropdown && dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        }
    }
});

// ----- Google Translate Integration Logic -----
function changeLanguage(langCode, label, event) {
    if (event) event.preventDefault();

    // Update button label
    document.getElementById('current-lang-label').innerText = label;

    // Update active state in dropdown
    const options = document.querySelectorAll('.lang-option');
    options.forEach(opt => opt.classList.remove('active'));
    if (event) event.target.classList.add('active');

    // Close dropdown
    document.getElementById('lang-menu').classList.remove('show');

    if (langCode === 'en') {
        // Reset to original English
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + location.hostname;
        // We reload to wipe the injected translation, and our DOMContentLoaded listener brings us right back to the active view!
        location.reload();
    } else {
        // Trigger Google Translate select dropdown hidden in the DOM
        const selectField = document.querySelector("select.goog-te-combo");
        if (selectField) {
            selectField.value = langCode;
            selectField.dispatchEvent(new Event('change'));
        }
    }
}

// ----- Compare Tab Filtering Logic -----
function filterPolicies(category, btn) {
    // Update active styling on tabs
    const tabs = document.querySelectorAll('.m3-tab');
    tabs.forEach(t => t.classList.remove('active'));
    btn.classList.add('active');

    // Filter the rows
    const rows = document.querySelectorAll('#policy-table tbody tr');
    rows.forEach(row => {
        if (category === 'all' || row.dataset.category === category) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// ----- Intersection Observer (Fade up animations) -----
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Optional: stop observing once animated
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-up').forEach(el => {
    observer.observe(el);
});

// ----- Quiz Logic -----
function selectQuiz(element, isCorrect) {
    // Reset all options
    const options = document.querySelectorAll('#quiz-options .m3-radio-option');
    options.forEach(opt => {
        opt.classList.remove('selected-correct', 'selected-wrong');
        const icon = opt.querySelector('.material-symbols-rounded');
        if (icon) {
            icon.textContent = 'radio_button_unchecked';
            icon.style.color = 'var(--text-disabled)';
        }
    });

    // Set selected state
    const icon = element.querySelector('.material-symbols-rounded');
    const feedback = document.getElementById('quiz-feedback');
    feedback.style.display = 'block';

    if (isCorrect) {
        element.classList.add('selected-correct');
        if (icon) {
            icon.textContent = 'check_circle';
            icon.style.color = 'inherit';
        }

        feedback.style.backgroundColor = 'var(--g-green-light)';
        feedback.style.color = 'var(--g-green)';
        feedback.textContent = 'Correct! The ECI is an autonomous body responsible for administering union and state election processes.';
    } else {
        element.classList.add('selected-wrong');
        if (icon) {
            icon.textContent = 'cancel';
            icon.style.color = 'inherit';
        }

        feedback.style.backgroundColor = 'var(--g-red-light)';
        feedback.style.color = 'var(--g-red)';
        feedback.textContent = 'Incorrect. The correct answer is to superintend, direct, and control elections.';
    }
}

// ----- Login & Verification Wizard Logic -----
function moveToNext(current, nextFieldId) {
    if (current.value.length === current.maxLength) {
        const next = document.getElementById(nextFieldId);
        if (next) next.focus();
    }
}

function simulateOTP() {
    const btn = document.getElementById('send-otp-btn');
    if (btn) {
        btn.innerHTML = '<span class="material-symbols-rounded icon-spin notranslate" translate="no">autorenew</span> Sending...';
        btn.style.opacity = '0.8';
    }

    setTimeout(() => {
        const phoneSection = document.getElementById('phone-input-section');
        const otpSection = document.getElementById('otp-input-section');
        if (phoneSection) phoneSection.style.display = 'none';
        if (otpSection) otpSection.style.display = 'block';
    }, 1200);
}

function verifyOTP() {
    // Automatically move to KYC step when last OTP digit is entered
    setTimeout(() => {
        const step1 = document.getElementById('login-step-1');
        const step2 = document.getElementById('login-step-2');
        if (step1) step1.style.display = 'none';
        if (step2) step2.style.display = 'block';

        const dot1 = document.getElementById('dot-1');
        const dot2 = document.getElementById('dot-2');
        if (dot1) dot1.classList.remove('active');
        if (dot2) dot2.classList.add('active');
    }, 500);
}

function simulateKYC() {
    const btn = document.getElementById('verify-kyc-btn');
    if (btn) {
        btn.innerHTML = '<span class="material-symbols-rounded icon-spin notranslate" translate="no">autorenew</span> Verifying...';
        btn.style.opacity = '0.8';
    }

    setTimeout(() => {
        const step2 = document.getElementById('login-step-2');
        const step3 = document.getElementById('login-step-3');
        if (step2) step2.style.display = 'none';
        if (step3) step3.style.display = 'block';

        const dot2 = document.getElementById('dot-2');
        const dot3 = document.getElementById('dot-3');
        if (dot2) dot2.classList.remove('active');
        if (dot3) dot3.classList.add('active');

        // Change Nav Button to Profile & Stop the pulsing
        const navBtn = document.getElementById('nav-login-btn');
        if (navBtn) {
            navBtn.className = 'nav-lang-btn'; // Switch to the cleaner, outlined style
            navBtn.innerHTML = '<span class="material-symbols-rounded notranslate" translate="no" style="font-size:18px; color:var(--g-green);">verified_user</span> Profile';
        }

        // Auto Redirect to Dashboard
        setTimeout(() => {
            switchView('dashboard');
        }, 2500);
    }, 1500);
}

/**
 * Simulate Google OAuth login flow for demonstration.
 */
function simulateGoogleLogin() {
    const btn = document.querySelector('.btn-google');
    if (btn) {
        btn.innerHTML = '<span class="material-symbols-rounded icon-spin notranslate" translate="no" style="font-size:18px;">autorenew</span> Authenticating...';
        btn.style.opacity = '0.8';
    }

    setTimeout(() => {
        // Move to KYC step directly for Google Login
        const step1 = document.getElementById('login-step-1');
        const step2 = document.getElementById('login-step-2');
        if (step1) step1.style.display = 'none';
        if (step2) step2.style.display = 'block';

        const dot1 = document.getElementById('dot-1');
        const dot2 = document.getElementById('dot-2');
        if (dot1) dot1.classList.remove('active');
        if (dot2) dot2.classList.add('active');

        // Track action using Google Analytics (if integrated)
        if (typeof trackVoterAction === 'function') {
            trackVoterAction('Login', 'Google');
        }
    }, 1500);
}

// ----- Trial EVM Logic -----
function castTrialVote(rowElement) {
    if (rowElement.classList.contains('disabled')) return;

    const machine = document.getElementById('evm-machine');
    if (!machine) return;
    const rows = machine.querySelectorAll('.evm-row');

    // Disable all rows
    rows.forEach(r => {
        if (r !== rowElement) {
            r.classList.add('disabled');
        }
    });

    // Activate clicked row
    rowElement.classList.add('voted');
    const indicator = document.getElementById('evm-ready-indicator');
    if (indicator) {
        indicator.style.background = '#37474f'; // Turn off ready light
        indicator.style.boxShadow = 'none';
    }

    // Delay to simulate the EVM red light holding before confirming
    setTimeout(() => {
        // Show success screen
        const container = document.getElementById('evm-container');
        if (!container) return;

        // Store original HTML for reset functionality
        if (!container.dataset.originalHtml) {
            container.dataset.originalHtml = container.innerHTML;
        }

        container.innerHTML = `
      <div style="padding: 40px 24px; text-align: center; animation: fadeIn 0.4s var(--ease-google);">
        <div style="width:80px; height:80px; background:var(--g-green-light); color:var(--g-green); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px;">
          <span class="material-symbols-rounded notranslate" translate="no" style="font-size: 48px;">check_circle</span>
        </div>
        <h3 style="font-family:'Google Sans', sans-serif; font-size:1.5rem; font-weight:500; color:var(--text-primary); margin-bottom:12px;">Vote Recorded</h3>
        <p style="color:var(--text-secondary); line-height:1.6; max-width: 300px; margin: 0 auto;">
          Your trial vote was successfully simulated. Remember, your real vote is powerful—use it wisely on election day!
        </p>
        <button class="btn-secondary" style="margin: 24px auto 0;" onclick="resetTrialVote()">
          <span class="material-symbols-rounded notranslate" translate="no" style="font-size:18px;">refresh</span> Practice Again
        </button>
      </div>
    `;
    }, 1200);
}

function resetTrialVote() {
    const container = document.getElementById('evm-container');
    if (container && container.dataset.originalHtml) {
        container.innerHTML = container.dataset.originalHtml;
    }
}
