// scripts/carrousel.js
(function () {
  const AUTOPLAY_INTERVAL = 4000;
  const TRANSITION_MS = 400;
  const SWIPE_THRESHOLD = 45;

  function initCarousel(carousel) {
    const track = carousel.querySelector('.carousel-track');
    const wrapper = carousel.querySelector('.carousel-track-wrapper');
    const prevBtn = carousel.querySelector('.carousel-control.prev');
    const nextBtn = carousel.querySelector('.carousel-control.next');

    if (!track || !wrapper) return;

    const slides = Array.from(track.children);
    const container = carousel.closest('.container') || carousel.parentElement;
    const caption = container ? container.querySelector('.carousel-caption') : null;
    const captionTitle = caption ? caption.querySelector('.caption-title') : null;
    const captionDesc = caption ? caption.querySelector('.caption-desc') : null;
    const dotsWrapper = container ? container.querySelector('.carousel-dots') : null;

    let current = 0;
    let autoplayTimer = null;
    let isPaused = false;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let deltaX = 0;
    let transitionLock = null;

    track.style.transition = `transform ${TRANSITION_MS}ms ease`;
    track.style.display = 'flex';
    track.style.willChange = 'transform';

    slides.forEach((s) => {
      s.style.minWidth = '100%';
      s.style.flex = '0 0 100%';
      s.style.boxSizing = 'border-box';
      s.setAttribute('aria-hidden', 'true');
    });

    function unlockTransitionSoon() {
      if (transitionLock) clearTimeout(transitionLock);
      transitionLock = setTimeout(() => {
        transitionLock = null;
      }, TRANSITION_MS + 80);
    }

    function updateCaptionAndDots() {
      const active = slides[current];
      if (active) {
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
        focusables.forEach((el) => el.setAttribute('tabindex', i === current ? '0' : '-1'));
      });
    }

    function updateTrackPosition() {
      track.style.transform = `translate3d(-${current * 100}%, 0, 0)`;
      updateCaptionAndDots();
      unlockTransitionSoon();
    }

    function goTo(index) {
      if (index < 0) index = slides.length - 1;
      if (index >= slides.length) index = 0;
      current = index;
      updateTrackPosition();
    }

    function next() {
      if (transitionLock) return;
      goTo(current + 1);
    }

    function prev() {
      if (transitionLock) return;
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
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); prev(); restartAutoplay(); }
      if (ev.key === 'ArrowRight') { ev.preventDefault(); next(); restartAutoplay(); }
    });

    function startAutoplay() {
      if (AUTOPLAY_INTERVAL <= 0 || isPaused || slides.length <= 1) return;
      stopAutoplay();
      autoplayTimer = setInterval(() => {
        if (!isDragging && !transitionLock) next();
      }, AUTOPLAY_INTERVAL);
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

    // Pause autoplay only on devices that actually hover/focus like desktop
    const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (supportsHover) {
      [carousel, prevBtn, nextBtn, caption, dotsWrapper].forEach((el) => {
        if (!el) return;
        el.addEventListener('mouseenter', () => { isPaused = true; stopAutoplay(); });
        el.addEventListener('mouseleave', () => { isPaused = false; startAutoplay(); });
        el.addEventListener('focusin', () => { isPaused = true; stopAutoplay(); });
        el.addEventListener('focusout', () => { isPaused = false; startAutoplay(); });
      });
    }

    // --- Mobile swipe support ---
    function getPointX(ev) {
      if (ev.touches && ev.touches.length) return ev.touches[0].clientX;
      if (ev.changedTouches && ev.changedTouches.length) return ev.changedTouches[0].clientX;
      return ev.clientX;
    }

    function getPointY(ev) {
      if (ev.touches && ev.touches.length) return ev.touches[0].clientY;
      if (ev.changedTouches && ev.changedTouches.length) return ev.changedTouches[0].clientY;
      return ev.clientY;
    }

    function onStart(ev) {
      // Don't start dragging from buttons/dots
      if (ev.target.closest('.carousel-control, .carousel-dot, a, button')) return;

      isDragging = true;
      startX = getPointX(ev);
      startY = getPointY(ev);
      deltaX = 0;
      track.style.transition = 'none';
      stopAutoplay();
    }

    function onMove(ev) {
      if (!isDragging) return;

      const x = getPointX(ev);
      const y = getPointY(ev);
      const dx = x - startX;
      const dy = y - startY;

      // If the gesture is mostly vertical, let the page scroll normally
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
        isDragging = false;
        track.style.transition = `transform ${TRANSITION_MS}ms ease`;
        startAutoplay();
        return;
      }

      deltaX = dx;

      // prevent the page from stealing the swipe once horizontal drag is clear
      if (Math.abs(dx) > 8) ev.preventDefault();

      const width = wrapper.clientWidth || 1;
      const dragPercent = (dx / width) * 100;
      track.style.transform = `translate3d(calc(-${current * 100}% + ${dragPercent}%), 0, 0)`;
    }

    function onEnd() {
      if (!isDragging) return;
      isDragging = false;
      track.style.transition = `transform ${TRANSITION_MS}ms ease`;

      if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
        if (deltaX < 0) next();
        else prev();
      } else {
        updateTrackPosition();
      }

      restartAutoplay();
    }

    wrapper.addEventListener('touchstart', onStart, { passive: true });
    wrapper.addEventListener('touchmove', onMove, { passive: false });
    wrapper.addEventListener('touchend', onEnd);
    wrapper.addEventListener('touchcancel', onEnd);

    wrapper.addEventListener('pointerdown', onStart, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);

    window.addEventListener('resize', () => {
      updateTrackPosition();
    });

    document.addEventListener('langChanged', updateCaptionAndDots);

    updateTrackPosition();
    startAutoplay();

    carousel.__carousel = {
      goTo,
      next,
      prev,
      start: startAutoplay,
      stop: stopAutoplay
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.products-carousel').forEach(initCarousel);
  });
})();