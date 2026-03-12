// scripts/lang-switcher.js  (REPLACE your old file with this)
(function () {
    const LANG_KEY = 'lang_selected'; // localStorage key
    const DEFAULT = 'es';

    // Fix: initialize caption on page load and after language switch
    function updateCarouselCaption() {
        const activeSlide = document.querySelector('.carousel-slide');
        if (!activeSlide) return;

        const title = activeSlide.dataset.title || '';
        const desc = activeSlide.dataset.desc || '';

        const titleEl = document.getElementById('carousel_caption_title');
        const descEl = document.getElementById('carousel_caption_desc');

        if (titleEl) titleEl.textContent = title;
        if (descEl) descEl.textContent = desc;
    }

    // run when page loads
    document.addEventListener("DOMContentLoaded", updateCarouselCaption);

    // run when language changes
    document.addEventListener("langChanged", updateCarouselCaption);

    function applyTranslations(obj) {
        if (!obj) return;
        Object.keys(obj).forEach(key => {
            const value = obj[key];

            // alt keys: "<id>_alt"
            if (/_alt$/.test(key)) {
                const elId = key.replace(/_alt$/, '');
                const img = document.getElementById(elId);
                if (img) img.alt = value;
                return;
            }

            // desc/title for slides: "<slideId>_desc" or "<slideId>_title"
            if (/_desc$/.test(key) || /_title$/.test(key)) {
                const base = key.replace(/_(desc|title)$/, '');
                const slide = document.getElementById(base);
                if (slide && slide.classList.contains('carousel-slide')) {
                    if (/_desc$/.test(key)) slide.dataset.desc = value;
                    if (/_title$/.test(key)) slide.dataset.title = value;
                    return;
                }
                // fallback: set innerHTML on element with the key
                const fallback = document.getElementById(key);
                if (fallback) fallback.innerHTML = value;
                return;
            }

            // target element by id
            const el = document.getElementById(key);

            if (!el) {
                // If no element by id, try to set a slide's data-title (for keys like "slide_2_1")
                const slideCandidate = document.querySelector(`#${CSS.escape(key)}.carousel-slide`);
                if (slideCandidate) {
                    // set dataset.title (safe, won't destroy DOM)
                    slideCandidate.dataset.title = String(value);
                    return;
                }
                return;
            }

            // protect carousel-slide list items: set data-title (don't replace innerHTML)
            if (el.classList && el.classList.contains('carousel-slide')) {
                el.dataset.title = String(value);
                return;
            }

            // <title> fallback: update document title
            if (key === 'page_title' || el.tagName.toLowerCase() === 'title') {
                document.title = value;
            }

            // default: set innerHTML (this preserves markup like <strong>)
            el.innerHTML = value;
        });

        // notify other scripts (carousel) that language changed so they can refresh captions/dots if needed
        document.dispatchEvent(new CustomEvent('langChanged'));
    }

    function setLang(lang) {
        const langObj = (lang === 'en') ? window.LANG_EN : window.LANG_ES;
        applyTranslations(langObj);

        // update lang-toggle label: show available alternate
        const btn = document.getElementById('lang-toggle');
        const label = document.getElementById('lang-toggle-text');

        if (btn) {
            btn.setAttribute('aria-pressed', (lang === 'en').toString());
        }

        if (label) {
            label.textContent = (lang === 'en') ? 'EN' : 'ES';
        }

        localStorage.setItem(LANG_KEY, lang);
    }

    // initial load
    document.addEventListener('DOMContentLoaded', () => {
        let lang = localStorage.getItem(LANG_KEY) || DEFAULT;

        // fallback if LANG objects not present yet
        if (lang === 'es' && !window.LANG_ES && window.LANG_EN) {
            lang = 'en';
        } else if (lang === 'en' && !window.LANG_EN && window.LANG_ES) {
            lang = 'es';
        }

        setLang(lang);

        // wire toggle button
        const btn = document.getElementById('lang-toggle');
        if (btn) {
            btn.addEventListener('click', () => {
                const current = (localStorage.getItem(LANG_KEY) === 'en') ? 'en' : 'es';
                const next = (current === 'en') ? 'es' : 'en';
                setLang(next);
            });
        }
    });
})();