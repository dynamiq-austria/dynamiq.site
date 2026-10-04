(() => {
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');
  const header = document.querySelector('[data-header]');
  const menuLabel = document.querySelector('[data-menu-label]');
  const menuOpenLabel = menuToggle?.dataset.openLabel || 'Menü öffnen';
  const menuCloseLabel = menuToggle?.dataset.closeLabel || 'Menü schließen';
  const menuRegions = [...document.querySelectorAll('main, .site-footer, .skip-link')];
  const menuRegionStates = new Map();

  const setMenuRegionsInert = (isOpen) => {
    if (isOpen) {
      menuRegions.forEach((region) => {
        menuRegionStates.set(region, region.inert);
        region.inert = true;
      });
    } else {
      menuRegionStates.forEach((wasInert, region) => { region.inert = wasInert; });
      menuRegionStates.clear();
    }
  };

  const closeMenu = ({ returnFocus = false } = {}) => {
    if (!menuToggle || !nav) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    if (menuLabel) menuLabel.textContent = menuOpenLabel;
    nav.classList.remove('is-open');
    document.body.classList.remove('menu-open');
    setMenuRegionsInert(false);
    if (returnFocus) menuToggle.focus();
  };

  menuToggle?.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    if (menuLabel) menuLabel.textContent = isOpen ? menuOpenLabel : menuCloseLabel;
    nav?.classList.toggle('is-open', !isOpen);
    document.body.classList.toggle('menu-open', !isOpen);
    setMenuRegionsInert(!isOpen);

    if (!isOpen) requestAnimationFrame(() => {
      if (menuToggle.getAttribute('aria-expanded') === 'true') nav?.querySelector('a')?.focus();
    });
  });

  nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuToggle?.getAttribute('aria-expanded') === 'true') {
      closeMenu({ returnFocus: true });
    }
    if (event.key === 'Tab' && menuToggle?.getAttribute('aria-expanded') === 'true') {
      const focusable = [...header.querySelectorAll('a[href], button:not([disabled])')]
        .filter((element) => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if ((event.shiftKey && document.activeElement === first)
        || (!event.shiftKey && document.activeElement === last)
        || !focusable.includes(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      }
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1080) closeMenu();
  });

  window.addEventListener('scroll', () => {
    header?.classList.toggle('is-scrolled', window.scrollY > 12);
  }, { passive: true });

  const navLinks = nav ? [...nav.querySelectorAll('a[href^="#"]')] : [];
  const navSections = navLinks
    .map((link) => {
      const id = decodeURIComponent(link.hash.slice(1));
      const section = id ? document.getElementById(id) : null;
      return section ? { id, link, section } : null;
    })
    .filter(Boolean);

  if (navSections.length && 'IntersectionObserver' in window) {
    const sectionsById = new Map(navSections.map((item) => [item.id, item]));
    const intersectingSections = new Set();
    let activeSectionId = '';
    let pendingSectionId = '';
    let pendingTimer = 0;
    let observer = null;
    let resizeFrame = 0;

    const lockSection = (id) => {
      pendingSectionId = id;
      window.clearTimeout(pendingTimer);
      pendingTimer = window.setTimeout(() => {
        pendingSectionId = '';
        selectActiveSection();
      }, 1200);
    };

    const setActiveSection = (id, { syncHash = true } = {}) => {
      if (!sectionsById.has(id) || activeSectionId === id) return;

      activeSectionId = id;
      navSections.forEach((item) => {
        const isActive = item.id === id;
        item.link.classList.toggle('is-active', isActive);
        if (isActive) item.link.setAttribute('aria-current', 'location');
        else item.link.removeAttribute('aria-current');
      });

      if (syncHash && !document.body.classList.contains('report-modal-open') && window.location.hash !== `#${id}`) {
        window.history.replaceState(window.history.state, '', `#${id}`);
      }
    };

    const selectActiveSection = () => {
      if (pendingSectionId) {
        if (intersectingSections.has(pendingSectionId)) {
          window.clearTimeout(pendingTimer);
          pendingSectionId = '';
        } else {
          return;
        }
      }

      const headerHeight = header?.getBoundingClientRect().height || 0;
      const candidates = [...intersectingSections]
        .map((id) => sectionsById.get(id))
        .filter(Boolean)
        .map((item) => ({ ...item, top: item.section.getBoundingClientRect().top }));

      if (!candidates.length) return;

      const entering = candidates
        .filter((item) => item.top >= headerHeight - 1)
        .sort((a, b) => a.top - b.top);
      const current = entering[0] || candidates.sort((a, b) => b.top - a.top)[0];
      setActiveSection(current.id);
    };

    const createScrollSpy = () => {
      observer?.disconnect();
      intersectingSections.clear();

      const headerHeight = Math.ceil(header?.getBoundingClientRect().height || 0);
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) intersectingSections.add(entry.target.id);
          else intersectingSections.delete(entry.target.id);
        });
        selectActiveSection();
      }, {
        rootMargin: `-${headerHeight}px 0px -70% 0px`,
        threshold: [0, 0.01],
      });

      navSections.forEach((item) => observer.observe(item.section));
    };

    navSections.forEach((item) => {
      item.link.addEventListener('click', () => {
        lockSection(item.id);
        setActiveSection(item.id, { syncHash: false });
      });
    });

    window.addEventListener('hashchange', () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (sectionsById.has(id)) {
        lockSection(id);
        setActiveSection(id, { syncHash: false });
      }
    });

    window.addEventListener('resize', () => {
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        createScrollSpy();
      });
    });

    const initialId = decodeURIComponent(window.location.hash.slice(1));
    if (sectionsById.has(initialId)) setActiveSection(initialId, { syncHash: false });
    createScrollSpy();
  }

  const reportModal = document.querySelector('[data-report-modal]');
  const reportDialog = reportModal?.querySelector('[data-report-dialog]');
  const reportForm = reportModal?.querySelector('[data-report-form]');
  const reportFormState = reportModal?.querySelector('[data-report-form-state]');
  const reportSuccess = reportModal?.querySelector('[data-report-success]');
  const reportSuccessTitle = reportModal?.querySelector('[data-report-success-title]');
  const reportError = reportModal?.querySelector('[data-report-error]');
  const reportSubmit = reportModal?.querySelector('[data-report-submit]');
  const reportModalHash = '#report-download';
  let reportTrigger = null;
  let reportHasHistoryEntry = false;

  const isReportModalHash = () => window.location.hash === reportModalHash;

  const reportFocusableElements = () => reportDialog
    ? [...reportDialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter((element) => !element.closest('[hidden]'))
    : [];

  const closeReportModal = ({ syncHash = true, returnFocus = true } = {}) => {
    if (!reportModal || reportModal.hidden) return;
    reportModal.hidden = true;
    document.body.classList.remove('report-modal-open');

    if (syncHash && isReportModalHash()) {
      if (reportHasHistoryEntry && window.history.state?.reportModal) {
        window.history.back();
      } else {
        window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`);
      }
    }

    if (returnFocus) reportTrigger?.focus();
    reportTrigger = null;
    reportHasHistoryEntry = false;
  };

  const openReportModal = (trigger, { syncHash = true } = {}) => {
    if (!reportModal || !reportDialog) return;
    if (trigger) reportTrigger = trigger;

    if (syncHash && !isReportModalHash()) {
      window.history.pushState(
        { ...(window.history.state || {}), reportModal: true },
        '',
        reportModalHash,
      );
      reportHasHistoryEntry = true;
    } else if (!syncHash) {
      reportHasHistoryEntry = Boolean(window.history.state?.reportModal);
    }

    reportModal.hidden = false;
    document.body.classList.add('report-modal-open');
    requestAnimationFrame(() => {
      const initialFocus = reportFormState?.hidden
        ? reportSuccessTitle
        : reportForm?.querySelector('input[type="email"]');
      (initialFocus || reportDialog).focus();
    });
  };

  document.querySelectorAll('[data-report-open]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      openReportModal(trigger);
    });
  });

  reportModal?.querySelectorAll('[data-report-close]').forEach((button) => {
    button.addEventListener('click', closeReportModal);
  });
  reportModal?.querySelector('[data-report-backdrop]')?.addEventListener('click', closeReportModal);

  window.addEventListener('hashchange', () => {
    if (isReportModalHash()) {
      openReportModal(null, { syncHash: false });
    } else {
      closeReportModal({ syncHash: false });
    }
  });

  if (isReportModalHash()) openReportModal(null, { syncHash: false });

  document.addEventListener('keydown', (event) => {
    if (!reportModal || reportModal.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeReportModal();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = reportFocusableElements();
    if (!focusable.length) {
      event.preventDefault();
      reportDialog?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  reportForm?.addEventListener('input', () => {
    if (reportError) reportError.hidden = true;
  });

  reportForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!reportForm.reportValidity() || !reportSubmit) return;

    const defaultLabel = reportSubmit.textContent;
    reportSubmit.disabled = true;
    reportSubmit.textContent = reportSubmit.dataset.loadingLabel || 'Report wird vorbereitet …';
    reportForm.setAttribute('aria-busy', 'true');
    if (reportError) reportError.hidden = true;

    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(reportForm)).toString(),
      });

      if (!response.ok) throw new Error(`Form submission failed with status ${response.status}`);

      reportFormState.hidden = true;
      reportSuccess.hidden = false;
      reportDialog?.setAttribute('aria-labelledby', 'report-success-title');
      reportDialog?.setAttribute('aria-describedby', 'report-success-description');
      reportSuccessTitle?.focus();
    } catch (_) {
      if (reportError) reportError.hidden = false;
      reportError?.focus?.();
    } finally {
      reportSubmit.disabled = false;
      reportSubmit.textContent = defaultLabel;
      reportForm.removeAttribute('aria-busy');
    }
  });

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const metricNumbers = [...document.querySelectorAll('.impact-metrics__number[data-count-target]')];
  const runningMetrics = new Map();
  const metricFormatter = new Intl.NumberFormat(document.documentElement.lang || 'de');
  const canAnimateMetrics = metricNumbers.length
    && 'IntersectionObserver' in window
    && !motionPreference.matches;

  metricNumbers.forEach((number) => {
    if (canAnimateMetrics) number.textContent = `0${number.dataset.countSuffix || ''}`;
    number.closest('.impact-metrics__value')?.classList.add('is-ready');
  });

  const finishMetric = (number) => {
    cancelAnimationFrame(runningMetrics.get(number));
    runningMetrics.delete(number);
    number.textContent = `${metricFormatter.format(Number(number.dataset.countTarget))}${number.dataset.countSuffix || ''}`;
  };

  const countMetric = (number, delay) => {
    const target = Number(number?.dataset.countTarget);
    if (!number || !Number.isSafeInteger(target) || target <= 0) return;

    const duration = 1800;
    const start = performance.now() + delay;
    number.textContent = `0${number.dataset.countSuffix || ''}`;

    const frame = (now) => {
      if (motionPreference.matches) {
        finishMetric(number);
        return;
      }

      const progress = Math.min(1, Math.max(0, (now - start) / duration));
      if (progress === 1) {
        finishMetric(number);
        return;
      }

      const eased = 1 - ((1 - progress) ** 3);
      number.textContent = `${metricFormatter.format(Math.floor(target * eased))}${number.dataset.countSuffix || ''}`;
      runningMetrics.set(number, requestAnimationFrame(frame));
    };

    runningMetrics.set(number, requestAnimationFrame(frame));
  };

  if (canAnimateMetrics) {
    const metricItems = metricNumbers
      .map((number) => number.closest('.impact-metrics__item'))
      .filter(Boolean);
    const metricObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        metricObserver.unobserve(entry.target);
        const number = entry.target.querySelector('[data-count-target]');
        countMetric(number, metricItems.indexOf(entry.target) * 90);
      });
    }, { threshold: 0.65 });

    metricItems.forEach((item) => metricObserver.observe(item));
    motionPreference.addEventListener('change', () => {
      if (!motionPreference.matches) return;
      metricObserver.disconnect();
      [...runningMetrics.keys()].forEach(finishMetric);
    });
  }

  const posterHero = document.querySelector('[data-poster-hero]');
  if (!posterHero) return;
  posterHero.classList.add('is-enhanced');

  const reducedMotion = motionPreference;
  const precisePointer = window.matchMedia('(pointer: fine)');
  const heroObjects = [...posterHero.querySelectorAll('[data-poster-object]')];
  const titleGroups = [...posterHero.querySelectorAll('.poster-title__group')];
  let pointerFrame = 0;
  let scrollFrame = 0;

  const drawSurface = posterHero.querySelector('[data-draw-surface]');
  const drawCanvas = posterHero.querySelector('[data-draw-canvas]');
  const drawHint = posterHero.querySelector('[data-draw-hint]');
  const drawContext = drawCanvas?.getContext('2d');

  if (drawSurface && drawCanvas && drawContext) {
    let drawState = null;
    let drawMetrics = null;
    let fadeTimer = 0;
    let clearTimer = 0;
    let resizeFrame = 0;
    let hasDrawn = false;

    const clearCanvas = () => {
      drawContext.save();
      drawContext.setTransform(1, 0, 0, 1, 0, 0);
      drawContext.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
      drawContext.restore();
    };

    const readDrawMetrics = () => {
      const heroBounds = posterHero.getBoundingClientRect();
      const style = getComputedStyle(drawSurface);
      const [originX = 0, originY = 0] = style.transformOrigin.split(' ').map(Number.parseFloat);
      const Matrix = window.DOMMatrixReadOnly || window.DOMMatrix;
      const matrix = style.transform === 'none' ? new Matrix() : new Matrix(style.transform);

      return {
        left: heroBounds.left + drawSurface.offsetLeft,
        top: heroBounds.top + drawSurface.offsetTop,
        width: drawSurface.clientWidth,
        height: drawSurface.clientHeight,
        originX,
        originY,
        inverse: matrix.inverse(),
      };
    };

    const localDrawPoint = (pointer, metrics = drawMetrics) => {
      if (!metrics) return null;
      const transformed = new DOMPoint(
        pointer.clientX - metrics.left - metrics.originX,
        pointer.clientY - metrics.top - metrics.originY,
      ).matrixTransform(metrics.inverse);
      const point = {
        x: transformed.x + metrics.originX,
        y: transformed.y + metrics.originY,
        pressure: pointer.pressure || .5,
      };
      point.inside = point.x >= 0 && point.x <= metrics.width && point.y >= 0 && point.y <= metrics.height;
      return point;
    };

    const restoreCanvas = ({ clearFaded = false } = {}) => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(clearTimer);
      const wasFading = drawCanvas.classList.contains('is-fading');
      drawCanvas.classList.add('is-resetting');
      drawCanvas.classList.remove('is-fading');
      if (clearFaded && wasFading) clearCanvas();
      requestAnimationFrame(() => drawCanvas.classList.remove('is-resetting'));
    };

    const scheduleFade = () => {
      const visibleDuration = reducedMotion.matches ? 200 : 1800;
      const fadeDuration = reducedMotion.matches ? 30 : 1400;
      window.clearTimeout(fadeTimer);
      window.clearTimeout(clearTimer);
      fadeTimer = window.setTimeout(() => drawCanvas.classList.add('is-fading'), visibleDuration);
      clearTimer = window.setTimeout(() => {
        clearCanvas();
        drawCanvas.classList.add('is-resetting');
        drawCanvas.classList.remove('is-fading');
        requestAnimationFrame(() => drawCanvas.classList.remove('is-resetting'));
      }, visibleDuration + fadeDuration);
    };

    const resizeCanvas = () => {
      if (drawState?.active) {
        try { posterHero.releasePointerCapture(drawState.pointerId); } catch (_) {}
      }
      const width = drawSurface.clientWidth;
      const height = drawSurface.clientHeight;
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      drawCanvas.width = Math.round(width * dpr);
      drawCanvas.height = Math.round(height * dpr);
      drawContext.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawContext.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#101012';
      drawContext.lineCap = 'round';
      drawContext.lineJoin = 'round';
      drawContext.globalAlpha = .84;
      drawMetrics = readDrawMetrics();
      restoreCanvas();
      drawState = null;
      posterHero.classList.remove('is-drawing');
    };

    const scheduleResize = () => {
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        resizeCanvas();
      });
    };

    const isProtectedHeroTarget = (target) => target instanceof Element
      && Boolean(target.closest('a, button, input, [data-poster-object], [data-poster-letter]'));

    const beginDrawing = (event) => {
      restoreCanvas({ clearFaded: true });
      drawState.active = true;
      posterHero.classList.add('is-drawing');
      posterHero.classList.remove('is-draw-ready');
      try { posterHero.setPointerCapture(event.pointerId); } catch (_) {}
    };

    const drawToPoint = (pointer) => {
      const point = localDrawPoint(pointer, drawState.metrics);
      if (!point?.inside) {
        drawState.lastPoint = null;
        return;
      }
      if (!drawState.lastPoint) {
        drawState.lastPoint = point;
        return;
      }

      const baseWidth = window.innerWidth <= 720 ? 3 : 4;
      const pressureScale = pointer.pointerType === 'pen' ? .82 + point.pressure * .38 : 1;
      drawContext.lineWidth = baseWidth * pressureScale;
      drawContext.beginPath();
      drawContext.moveTo(drawState.lastPoint.x, drawState.lastPoint.y);
      drawContext.lineTo(point.x, point.y);
      drawContext.stroke();
      drawState.lastPoint = point;
      drawState.hasMarks = true;

      if (!hasDrawn) {
        hasDrawn = true;
        drawHint?.classList.add('is-hidden');
      }
    };

    const finishDrawing = (event) => {
      if (!drawState || event.pointerId !== drawState.pointerId) return;
      if (drawState.active) {
        try { posterHero.releasePointerCapture(event.pointerId); } catch (_) {}
        if (drawState.hasMarks) scheduleFade();
      }
      drawState = null;
      posterHero.classList.remove('is-drawing');
    };

    resizeCanvas();
    if ('ResizeObserver' in window) new ResizeObserver(scheduleResize).observe(drawSurface);
    window.addEventListener('resize', scheduleResize, { passive: true });

    posterHero.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || event.button !== 0 || isProtectedHeroTarget(event.target)) return;
      const metrics = readDrawMetrics();
      const point = localDrawPoint(event, metrics);
      if (!point?.inside) return;

      drawMetrics = metrics;
      drawState = {
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        startX: event.clientX,
        startY: event.clientY,
        lastPoint: point,
        metrics,
        active: false,
        hasMarks: false,
      };

      if (event.pointerType !== 'touch') {
        event.preventDefault();
        beginDrawing(event);
      }
    });

    posterHero.addEventListener('pointermove', (event) => {
      if (!drawState || event.pointerId !== drawState.pointerId) {
        if (event.pointerType === 'mouse') {
          const point = localDrawPoint(event);
          posterHero.classList.toggle('is-draw-ready', Boolean(point?.inside) && !isProtectedHeroTarget(event.target));
        }
        return;
      }

      if (!drawState.active && drawState.pointerType === 'touch') {
        const deltaX = event.clientX - drawState.startX;
        const deltaY = event.clientY - drawState.startY;
        if (Math.hypot(deltaX, deltaY) < 10) return;
        if (Math.abs(deltaY) > Math.abs(deltaX) * 1.15) {
          drawState = null;
          return;
        }
        beginDrawing(event);
      }

      if (!drawState?.active) return;
      event.preventDefault();
      const points = typeof event.getCoalescedEvents === 'function' ? event.getCoalescedEvents() : [event];
      points.forEach(drawToPoint);
    });

    posterHero.addEventListener('pointerup', finishDrawing);
    posterHero.addEventListener('pointercancel', finishDrawing);
    posterHero.addEventListener('pointerleave', () => {
      if (!drawState) posterHero.classList.remove('is-draw-ready');
    });
  }

  titleGroups.forEach((group) => {
    [...group.children].forEach((word) => {
      const characters = [...word.textContent];
      word.textContent = '';
      word.setAttribute('aria-hidden', 'true');

      characters.forEach((character) => {
        const letter = document.createElement('span');
        letter.className = 'poster-letter';
        letter.dataset.posterLetter = '';
        letter.textContent = character;
        word.append(letter);
      });
    });
  });

  posterHero.addEventListener('click', (event) => {
    const letter = event.target.closest('[data-poster-letter]');
    if (!letter || letter.dataset.letterBusy === 'true') return;

    letter.dataset.letterBusy = 'true';
    letter.style.setProperty('--letter-spin', `${(Math.random() * 18 - 9).toFixed(2)}deg`);
    letter.classList.remove('is-returning');
    letter.classList.add('is-away');

    const returnDelay = 3000 + Math.random() * 1000;
    window.setTimeout(() => {
      letter.classList.remove('is-away');
      letter.classList.add('is-returning');

      window.setTimeout(() => {
        letter.classList.remove('is-returning');
        delete letter.dataset.letterBusy;
      }, reducedMotion.matches ? 50 : 650);
    }, returnDelay);
  });

  const resetPointer = () => {
    [...titleGroups, ...heroObjects].forEach((element) => {
      element.style.setProperty('--element-x', '0px');
      element.style.setProperty('--element-y', '0px');
    });
  };

  const updatePointer = (event) => {
    if (reducedMotion.matches || !precisePointer.matches || posterHero.classList.contains('is-drawing')) return;
    if (pointerFrame) cancelAnimationFrame(pointerFrame);
    pointerFrame = requestAnimationFrame(() => {
      const bounds = posterHero.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width - .5) * 10;
      const y = ((event.clientY - bounds.top) / bounds.height - .5) * 8;
      [...titleGroups, ...heroObjects].forEach((element) => {
        const depth = Number(element.dataset.depth || 1);
        element.style.setProperty('--element-x', `${(x * depth).toFixed(2)}px`);
        element.style.setProperty('--element-y', `${(y * depth).toFixed(2)}px`);
      });
      pointerFrame = 0;
    });
  };

  const updateScrollExit = () => {
    if (scrollFrame || reducedMotion.matches) return;
    scrollFrame = requestAnimationFrame(() => {
      const bounds = posterHero.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -bounds.top / Math.max(1, bounds.height)));
      posterHero.style.setProperty('--title-scroll-y', `${(-progress * 24).toFixed(2)}px`);
      posterHero.style.setProperty('--title-opacity', String(1 - progress * .18));
      posterHero.style.setProperty('--objects-opacity', String(1 - progress * .28));
      posterHero.style.setProperty('--stripe-scale', String(1 - progress * .08));
      heroObjects.forEach((object) => {
        const exitY = Number(getComputedStyle(object).getPropertyValue('--exit-y').replace('px', '') || 25);
        object.style.setProperty('--object-scroll-y', `${(progress * exitY).toFixed(2)}px`);
      });
      scrollFrame = 0;
    });
  };

  posterHero.addEventListener('pointermove', updatePointer, { passive: true });
  posterHero.addEventListener('pointerleave', resetPointer);
  window.addEventListener('scroll', updateScrollExit, { passive: true });

  const entranceDirections = [
    { x: 0, y: -12 },
    { x: -42, y: 22 },
    { x: 38, y: 18 },
    { x: -28, y: 25 },
    { x: 72, y: -18 },
    { x: -64, y: 20 },
    { x: 36, y: 40 },
    { x: 0, y: 18 },
  ];

  if (!reducedMotion.matches) {
    posterHero.querySelectorAll('[data-hero-reveal]').forEach((element, index) => {
      if (typeof element.animate !== 'function') return;
      const direction = entranceDirections[index] || { x: 0, y: 18 };
      element.animate([
        { opacity: 0, transform: `translate3d(${direction.x}px, ${direction.y}px, 0)` },
        { opacity: 1, transform: 'translate3d(0, 0, 0)', offset: .82 },
        { opacity: 1, transform: 'translate3d(0, 0, 0)' },
      ], {
        duration: 620 + Math.min(index, 5) * 45,
        delay: 70 + index * 75,
        easing: 'cubic-bezier(.18,.82,.24,1)',
      });
    });
  }

  const stickerRestoreTimers = new WeakMap();

  const enableStickerEditing = (object) => {
    const editable = object.querySelector('[data-sticker-text]');
    if (!editable) return;
    const originalText = editable.textContent.trim();

    const clearRestoreTimer = () => {
      const timer = stickerRestoreTimers.get(object);
      if (timer) window.clearTimeout(timer);
      stickerRestoreTimers.delete(object);
    };

    const restoreOriginal = ({ immediate = false } = {}) => {
      clearRestoreTimer();
      object.classList.add('is-restoring');
      object.classList.remove('is-editing');
      editable.setAttribute('contenteditable', 'false');
      editable.blur();

      const swapText = () => {
        editable.textContent = originalText;
        object.classList.remove('is-restoring');
      };

      if (immediate || reducedMotion.matches) swapText();
      else window.setTimeout(swapText, 160);
    };

    const scheduleRestore = () => {
      clearRestoreTimer();
      stickerRestoreTimers.set(object, window.setTimeout(restoreOriginal, 4000));
    };

    const placeCaretAtEnd = () => {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editable);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    };

    object.addEventListener('dblclick', (event) => {
      if (!precisePointer.matches) return;
      event.preventDefault();
      event.stopPropagation();
      clearRestoreTimer();
      object.classList.remove('is-restoring');
      object.classList.add('is-editing');
      editable.setAttribute('contenteditable', 'plaintext-only');
      editable.setAttribute('spellcheck', 'false');
      editable.focus();

      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editable);
      selection?.removeAllRanges();
      selection?.addRange(range);
    });

    editable.addEventListener('input', () => {
      const singleLineText = editable.textContent.replace(/\s+/g, ' ').trimStart();
      if (singleLineText !== editable.textContent) {
        editable.textContent = singleLineText;
        placeCaretAtEnd();
      }
      if (singleLineText) scheduleRestore();
    });

    editable.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        editable.blur();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        restoreOriginal({ immediate: true });
      }
    });

    editable.addEventListener('blur', () => {
      if (object.classList.contains('is-restoring')) return;
      object.classList.remove('is-editing');
      editable.setAttribute('contenteditable', 'false');
      if (editable.textContent.trim() && editable.textContent.trim() !== originalText) scheduleRestore();
      else restoreOriginal({ immediate: true });
    });
  };

  const activeInertia = new WeakMap();

  const stopInertia = (object) => {
    const frame = activeInertia.get(object);
    if (frame) cancelAnimationFrame(frame);
    activeInertia.delete(object);
  };

  const enableDrag = (object) => {
    let drag = null;

    const setOffset = (x, y) => {
      object.dataset.dragX = String(x);
      object.dataset.dragY = String(y);
      object.style.setProperty('--drag-x', `${x}px`);
      object.style.setProperty('--drag-y', `${y}px`);
    };

    const release = (event) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      object.classList.remove('is-dragging');
      try { object.releasePointerCapture(event.pointerId); } catch (_) {}

      let x = Number(object.dataset.dragX || 0);
      let y = Number(object.dataset.dragY || 0);
      let velocityX = drag.velocityX;
      let velocityY = drag.velocityY;
      const limits = drag.limits;
      drag = null;

      const coast = () => {
        velocityX *= .86;
        velocityY *= .86;
        let nextX = x + velocityX * 7;
        let nextY = y + velocityY * 7;

        if (nextX < limits.minX || nextX > limits.maxX) velocityX *= -.2;
        if (nextY < limits.minY || nextY > limits.maxY) velocityY *= -.2;
        x = Math.min(limits.maxX, Math.max(limits.minX, nextX));
        y = Math.min(limits.maxY, Math.max(limits.minY, nextY));
        setOffset(x, y);

        if (Math.abs(velocityX) + Math.abs(velocityY) > .08) {
          activeInertia.set(object, requestAnimationFrame(coast));
        } else {
          activeInertia.delete(object);
        }
      };

      if (!reducedMotion.matches) activeInertia.set(object, requestAnimationFrame(coast));
    };

    object.addEventListener('pointerdown', (event) => {
      if (!precisePointer.matches || reducedMotion.matches || event.button !== 0 || object.classList.contains('is-editing')) return;
      event.preventDefault();
      stopInertia(object);
      const heroBounds = posterHero.getBoundingClientRect();
      const objectBounds = object.getBoundingClientRect();
      const currentX = Number(object.dataset.dragX || 0);
      const currentY = Number(object.dataset.dragY || 0);
      const originLeft = objectBounds.left - currentX;
      const originTop = objectBounds.top - currentY;
      const safeEdge = 12;

      drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        currentX,
        currentY,
        lastX: event.clientX,
        lastY: event.clientY,
        lastTime: performance.now(),
        velocityX: 0,
        velocityY: 0,
        limits: {
          minX: heroBounds.left + safeEdge - originLeft,
          maxX: heroBounds.right - safeEdge - objectBounds.width - originLeft,
          minY: heroBounds.top + 88 - originTop,
          maxY: heroBounds.bottom - 70 - objectBounds.height - originTop,
        },
      };

      object.classList.add('is-dragging');
      object.setPointerCapture(event.pointerId);
    });

    object.addEventListener('pointermove', (event) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const now = performance.now();
      const elapsed = Math.max(1, now - drag.lastTime);
      const nextX = Math.min(drag.limits.maxX, Math.max(drag.limits.minX, drag.currentX + event.clientX - drag.startX));
      const nextY = Math.min(drag.limits.maxY, Math.max(drag.limits.minY, drag.currentY + event.clientY - drag.startY));
      drag.velocityX = drag.velocityX * .55 + ((event.clientX - drag.lastX) / elapsed) * .45;
      drag.velocityY = drag.velocityY * .55 + ((event.clientY - drag.lastY) / elapsed) * .45;
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;
      drag.lastTime = now;
      setOffset(nextX, nextY);
    });

    object.addEventListener('pointerup', release);
    object.addEventListener('pointercancel', release);
  };

  heroObjects.forEach((object) => {
    enableStickerEditing(object);
    enableDrag(object);
  });
  reducedMotion.addEventListener?.('change', (event) => {
    if (event.matches) {
      resetPointer();
      posterHero.style.setProperty('--title-scroll-y', '0px');
      posterHero.style.setProperty('--title-opacity', '1');
      posterHero.style.setProperty('--objects-opacity', '1');
      posterHero.style.setProperty('--stripe-scale', '1');
      heroObjects.forEach((object) => object.style.setProperty('--object-scroll-y', '0px'));
      heroObjects.forEach(stopInertia);
    }
  });
})();
