// scripts/lang-switcher.js
(function () {
    const LANG_KEY = 'lang_selected';
    const DEFAULT_LANG = 'es';

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

    document.addEventListener("DOMContentLoaded", updateCarouselCaption);
    document.addEventListener("langChanged", updateCarouselCaption);

    function applyTranslations(obj) {
        if (!obj) return;

        Object.keys(obj).forEach(key => {
            const value = obj[key];

            if (/_alt$/.test(key)) {
                const elId = key.replace(/_alt$/, '');
                const img = document.getElementById(elId);
                if (img) img.alt = value;
                return;
            }

            if (/_desc$/.test(key) || /_title$/.test(key)) {
                const base = key.replace(/_(desc|title)$/, '');
                const slide = document.getElementById(base);

                if (slide && slide.classList.contains('carousel-slide')) {
                    if (/_desc$/.test(key)) slide.dataset.desc = value;
                    if (/_title$/.test(key)) slide.dataset.title = value;
                    return;
                }

                const fallback = document.getElementById(key);
                if (fallback) fallback.innerHTML = value;
                return;
            }

            const el = document.getElementById(key);

            if (!el) {
                const slideCandidate = document.querySelector(`#${CSS.escape(key)}.carousel-slide`);
                if (slideCandidate) {
                    slideCandidate.dataset.title = String(value);
                }
                return;
            }

            if (el.classList && el.classList.contains('carousel-slide')) {
                el.dataset.title = String(value);
                return;
            }

            if (key === 'page_title' || el.tagName.toLowerCase() === 'title') {
                document.title = value;
            }

            el.innerHTML = value;
        });

        document.dispatchEvent(new CustomEvent('langChanged'));
    }

    function setLang(lang) {
        if (lang !== 'es' && lang !== 'en') lang = DEFAULT_LANG;

        const langObj = (lang === 'en') ? window.LANG_EN : window.LANG_ES;
        applyTranslations(langObj);

        document.documentElement.lang = lang;

        const select = document.getElementById('lang-select');
        if (select && select.value !== lang) {
            select.value = lang;
        }

        // 👉 UPDATE FLAG HERE
        const flagEl = document.getElementById('lang-flag');
        if (flagEl) {
            flagEl.textContent = (lang === 'en') ? '🇺🇸' : '🇪🇸';
        }

        localStorage.setItem(LANG_KEY, lang);
    }

    document.addEventListener('DOMContentLoaded', () => {
        const select = document.getElementById('lang-select');
        const savedLang = localStorage.getItem(LANG_KEY);
        const initialLang = (savedLang === 'es' || savedLang === 'en') ? savedLang : DEFAULT_LANG;

        setLang(initialLang);

        if (select) {
            select.addEventListener('change', () => {
                setLang(select.value);
            });
        }
    });
})();