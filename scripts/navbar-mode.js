// scripts/navbar-mode.js
(function () {
    const BREAKPOINT = 880; // px (change if you want)
    const header = document.getElementById('siteHeader');
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = header.querySelector('.nav-links');
    const toggleLabel = header.querySelector('.nav-toggle-label');

    if (!header) return;

    // set aria attributes initially
    if (navToggle) {
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.addEventListener('change', () => {
            navToggle.setAttribute('aria-expanded', navToggle.checked ? 'true' : 'false');
        });
    }

    // function that applies header mode
    function applyMode(isMobile) {
        if (isMobile) {
            header.classList.remove('header--desktop');
            header.classList.add('header--mobile');
            // enable hamburger (navToggle already in DOM)
            if (navToggle) navToggle.style.display = 'block';
            if (toggleLabel) toggleLabel.style.display = 'block';
        } else {
            header.classList.remove('header--mobile');
            header.classList.add('header--desktop');
            // Close mobile menu if open
            if (navToggle && navToggle.checked) navToggle.checked = false, navToggle.setAttribute('aria-expanded', 'false');
            // ensure nav-links are visible on desktop
            navLinks.style.maxHeight = null;
            // hide hamburger UI on desktop
            if (navToggle) navToggle.style.display = 'none';
            if (toggleLabel) toggleLabel.style.display = 'none';
        }
    }

    // initial run
    function check() {
        const w = window.innerWidth;
        applyMode(w <= BREAKPOINT);
    }

    // run on load
    check();

    // run on resize (debounced)
    let rTimer;
    window.addEventListener('resize', () => {
        clearTimeout(rTimer);
        rTimer = setTimeout(check, 90);
    });

    // optional: close the mobile menu when clicking a nav link
    header.querySelectorAll('.nav-links a').forEach(a => {
        a.addEventListener('click', () => {
            if (navToggle && navToggle.checked) {
                navToggle.checked = false;
                navToggle.setAttribute('aria-expanded', 'false');
            }
        });
    });

})();