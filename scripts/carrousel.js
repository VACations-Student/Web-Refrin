// scripts/carrousel.js
// Reusable carousel supporting multiple .products-carousel instances on the page.
// Adds robust touch/pointer dragging + resize handling for mobile.

(function () {
  const AUTOPLAY_INTERVAL = 4000;

  function initCarousel(carousel) {
    let isTransitioning = false;
    const track = carousel.querySelector('.carousel-track');
    if (!track) return;

    const slides = Array.from(track.children);
    const prevBtn = carousel.querySelector('.carousel-control.prev');
    const nextBtn = carousel.querySelector('.carousel-control.next');

    const container = carousel.closest('.container') || carousel.parentElement;
    const caption = container ? container.querySelector('.carousel-caption') : null;
    const captionTitle = caption ? caption.querySelector('.caption-title') : null;
    const captionDesc = caption ? caption.querySelector('.caption-desc') : null;
    const dotsWrapper = container ? container.querySelector('.carousel-dots') : null;

    let current = 0;
    let autoplayTimer = null;
    let isPaused = false;

    function updateCaptionAndDots() {
      const active = slides[current];
      if (active && active.dataset) {
        if (captionTitle) captionTitle.textContent = active.dataset.title || '';
        if (captionDesc) captionDesc.textContent = active.dataset.desc || '';
      }

      if (dotsWrapper) {
        const dots = Array.from(dotsWrapper.children);
        dots.forEach((d, i) => {
          d.setAttribute('aria-selected', String(i === current));
          d.classList.toggle('active', i === current);
        });
      }

      slides.forEach((s, i) => {
        s.setAttribute('aria-hidden', i === current ? 'false' : 'true');
        const focusables = s.querySelectorAll('a, button, input, [tabindex]');
        focusables.forEach(el => el.setAttribute('tabindex', i === current ? '0' : '-1'));
      });
    }

    function updateTrackPosition() {
      isTransitioning = true;

      track.style.transform = `translateX(-${current * 100}%)`;

      // wait for CSS transition to finish
      track.addEventListener('transitionend', () => {
        isTransitioning = false;
      }, { once: true });

      updateCaptionAndDots();
    }

    function goTo(index) {
      if (index < 0) index = slides.length - 1;
      if (index >= slides.length) index = 0;
      current = index;
      updateTrackPosition();
    }

    function next() {
      if (isTransitioning) return;
      goTo(current + 1);
    }

    function prev() {
      if (isTransitioning) return;
      goTo(current - 1);
    }

    if (dotsWrapper) {
      dotsWrapper.innerHTML = '';
      slides.forEach((_, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'carousel-dot';
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', i === current ? 'true' : 'false');
        btn.setAttribute('aria-label', `Slide ${i + 1}`);
        btn.addEventListener('click', () => {
          goTo(i);
          restartAutoplay();
        });
        dotsWrapper.appendChild(btn);
      });
    }

    if (nextBtn) nextBtn.addEventListener('click', () => { next(); restartAutoplay(); });
    if (prevBtn) prevBtn.addEventListener('click', () => { prev(); restartAutoplay(); });

    carousel.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowLeft') { prev(); restartAutoplay(); ev.preventDefault(); }
      if (ev.key === 'ArrowRight') { next(); restartAutoplay(); ev.preventDefault(); }
    });

    [carousel, prevBtn, nextBtn, caption, dotsWrapper].forEach(el => {
      if (!el) return;
      el.addEventListener('mouseenter', () => { isPaused = true; stopAutoplay(); });
      el.addEventListener('mouseleave', () => { isPaused = false; startAutoplay(); });
      el.addEventListener('focusin', () => { isPaused = true; stopAutoplay(); });
      el.addEventListener('focusout', () => { isPaused = false; startAutoplay(); });
    });

    function startAutoplay() {
      if (AUTOPLAY_INTERVAL <= 0 || isPaused) return;
      stopAutoplay();
      autoplayTimer = setInterval(() => { next(); }, AUTOPLAY_INTERVAL);
    }

    function stopAutoplay() {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function restartAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    track.style.transition = 'transform 400ms ease';
    track.style.display = 'flex';
    slides.forEach(s => {
      s.style.minWidth = '100%';
      s.style.boxSizing = 'border-box';
    });

    // IMPORTANT: refresh caption immediately when the language changes
    document.addEventListener('langChanged', updateCaptionAndDots);

    updateTrackPosition();
    startAutoplay();

    window.addEventListener('resize', () => {
      updateTrackPosition();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const carousels = Array.from(document.querySelectorAll('.products-carousel'));
    carousels.forEach(initCarousel);
  });
})();