// scripts/carrousel.js
// Reusable carousel supporting multiple .products-carousel instances on the page.
// Adds robust touch/pointer dragging + resize handling for mobile.

(function () {
  const CAROUSEL_AUTOPLAY = true;
  const AUTOPLAY_DELAY = 4500;
  const TRANSITION_MS = 400;
  const SWIPE_THRESHOLD_PX = 60; // swipe threshold to change slide

  const carousels = Array.from(document.querySelectorAll('.products-carousel'));
  if (!carousels.length) return;

  carousels.forEach((carouselRoot, ci) => {
    const track = carouselRoot.querySelector('.carousel-track');
    if (!track) return;

    // Elements inside this carousel
    const slides = Array.from(track.children);
    const prevBtn = carouselRoot.querySelector('.carousel-control.prev');
    const nextBtn = carouselRoot.querySelector('.carousel-control.next');

    const container = carouselRoot.parentElement || document;
    let captionContainer = container.querySelector('.carousel-caption');
    if (!captionContainer) {
      captionContainer = document.createElement('div');
      captionContainer.className = 'carousel-caption';
      captionContainer.innerHTML = `<h4 class="caption-title"></h4><p class="caption-desc"></p>`;
      container.appendChild(captionContainer);
    }
    const captionTitle = captionContainer.querySelector('.caption-title');
    const captionDesc = captionContainer.querySelector('.caption-desc');

    let dotsContainer = container.querySelector('.carousel-dots');
    if (!dotsContainer) {
      dotsContainer = document.createElement('div');
      dotsContainer.className = 'carousel-dots';
      container.appendChild(dotsContainer);
    }

    // Style track for transitions
    track.style.transition = `transform ${TRANSITION_MS}ms ease`;
    track.style.display = track.style.display || 'flex';
    track.style.willChange = 'transform';
    slides.forEach(s => s.style.flex = s.style.flex || '0 0 100%');

    // create dots
    dotsContainer.innerHTML = '';
    const dots = slides.map((slide, i) => {
      slide.id = slide.id || `carousel-${ci}-slide-${i}`;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'carousel-dot';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-controls', slide.id);
      btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      btn.title = slide.dataset.title || `Slide ${i + 1}`;
      btn.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(btn);
      return btn;
    });

    if (prevBtn) prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goTo(currentIndex + 1));

    if (!carouselRoot.hasAttribute('tabindex')) carouselRoot.setAttribute('tabindex', '0');

    carouselRoot.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(currentIndex - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(currentIndex + 1); }
    });

    // Autoplay
    let autoplayTimer = null;
    function startAutoplay() {
      stopAutoplay();
      if (!CAROUSEL_AUTOPLAY || slides.length <= 1) return;
      autoplayTimer = setInterval(() => goTo(currentIndex + 1), AUTOPLAY_DELAY);
    }
    function stopAutoplay() {
      if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
    }

    carouselRoot.addEventListener('mouseenter', stopAutoplay);
    carouselRoot.addEventListener('mouseleave', startAutoplay);
    [prevBtn, nextBtn, ...dots].forEach(el => {
      if (!el) return;
      el.addEventListener('focus', stopAutoplay);
      el.addEventListener('blur', startAutoplay);
    });

    // expose current index
    let currentIndex = 0;
    const total = slides.length;

    function updateUI(withoutTransition) {
      // ensure transition is present unless caller asked otherwise
      if (withoutTransition) {
        track.style.transition = 'none';
      } else {
        track.style.transition = `transform ${TRANSITION_MS}ms ease`;
      }

      track.style.transform = `translateX(${-currentIndex * 100}%)`;
      dots.forEach((d, idx) => d.setAttribute('aria-selected', idx === currentIndex ? 'true' : 'false'));
      const cur = slides[currentIndex];
      if (captionTitle) captionTitle.textContent = cur.dataset.title || '';
      if (captionDesc) captionDesc.textContent = cur.dataset.desc || '';
    }

    function goTo(i) {
      currentIndex = ((i % total) + total) % total; // wrap
      updateUI();
      resetAutoplay();
    }

    function resetAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    // Keep carousel correctly placed on window resize
    let resizeTimer = null;
    function onResize() {
      // freeze transition while resizing to prevent flicker
      updateUI(true);
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => updateUI(false), 100);
    }
    window.addEventListener('resize', onResize);

    // --- Touch / Pointer dragging (mobile friendly) ---
    let startX = 0;
    let currentTranslate = 0;
    let isDragging = false;
    let rafId = null;

    function getEventX(e) {
      if (e.touches && e.touches.length) return e.touches[0].clientX;
      if (e.changedTouches && e.changedTouches.length) return e.changedTouches[0].clientX;
      return e.clientX;
    }

    function onDragStart(e) {
      // left mouse button only for mouse
      if (e.type === 'pointerdown' && e.button && e.button !== 0) return;
      isDragging = true;
      startX = getEventX(e);
      currentTranslate = -currentIndex * track.clientWidth;
      track.style.transition = 'none';
      stopAutoplay();

      // prevent page selection/drag
      document.documentElement.classList.add('carousel-dragging');
      // for pointer events (if available)
      if (e.pointerId && carouselRoot.setPointerCapture) {
        try { carouselRoot.setPointerCapture(e.pointerId); } catch (err) { }
      }
    }

    function onDragMove(e) {
      if (!isDragging) return;
      const nowX = getEventX(e);
      const delta = nowX - startX;
      const translate = currentTranslate + delta;
      // convert px translate into percent for consistent transform with updateUI
      const percent = (translate / track.clientWidth) * 100;
      track.style.transform = `translateX(${percent}%)`;
      e.preventDefault && e.preventDefault();
    }

    function onDragEnd(e) {
      if (!isDragging) return;
      isDragging = false;
      const endX = getEventX(e);
      const delta = endX - startX;

      // re-enable transition
      track.style.transition = `transform ${TRANSITION_MS}ms ease`;

      if (Math.abs(delta) > SWIPE_THRESHOLD_PX) {
        if (delta < 0) {
          // swipe left -> next
          goTo(currentIndex + 1);
        } else {
          // swipe right -> prev
          goTo(currentIndex - 1);
        }
      } else {
        // not enough: snap back
        updateUI();
      }

      document.documentElement.classList.remove('carousel-dragging');

      // for pointer events (if available)
      if (e.pointerId && carouselRoot.releasePointerCapture) {
        try { carouselRoot.releasePointerCapture(e.pointerId); } catch (err) { }
      }

      resetAutoplay();
    }

    // add both pointer and touch events (pointer covers most modern browsers)
    track.addEventListener('pointerdown', onDragStart, { passive: true });
    window.addEventListener('pointermove', onDragMove, { passive: false });
    window.addEventListener('pointerup', onDragEnd);
    window.addEventListener('pointercancel', onDragEnd);
    // touch fallback
    track.addEventListener('touchstart', onDragStart, { passive: true });
    window.addEventListener('touchmove', onDragMove, { passive: false });
    window.addEventListener('touchend', onDragEnd);
    window.addEventListener('touchcancel', onDragEnd);

    // prevent accidental text selection during drag
    document.addEventListener('selectstart', (e) => {
      if (isDragging) e.preventDefault();
    });

    // init
    updateUI();
    startAutoplay();

    // expose small API if needed
    carouselRoot.__carousel = {
      goTo,
      next: () => goTo(currentIndex + 1),
      prev: () => goTo(currentIndex - 1),
      start: startAutoplay,
      stop: stopAutoplay
    };
  });
})();