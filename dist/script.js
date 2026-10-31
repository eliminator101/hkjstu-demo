const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

// Draw an original HKJSTU signature, then lift the opening screen away.
const loader = document.querySelector('.site-loader');
if (loader) {
  const skipLoader = loader.querySelector('.loader-skip');
  const pen = loader.querySelector('.signature-pen');
  const signaturePaths = [...loader.querySelectorAll('.signature-strokes path')];
  const lengths = signaturePaths.map((path) => path.getTotalLength());
  const totalLength = lengths.reduce((sum, length) => sum + length, 0);
  const writingDuration = 2200;
  let elapsed = 120;
  const timeline = signaturePaths.map((path, index) => {
    const duration = writingDuration * (lengths[index] / totalLength);
    const segment = { path, length: lengths[index], start: elapsed, duration };
    elapsed += duration;
    return segment;
  });
  const finishAt = elapsed + 420;
  let loaderFrame;
  let animationStart = 0;
  let loaderFinished = false;

  function closeLoader(immediate = false) {
    if (loaderFinished) return;
    loaderFinished = true;
    cancelAnimationFrame(loaderFrame);
    document.body.classList.remove('is-loading');
    loader.classList.add('is-complete');
    loader.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', handleLoaderKey);
    if (immediate) loader.remove();
    else window.setTimeout(() => loader.remove(), 900);
  }

  function handleLoaderKey(event) {
    if (event.key === 'Escape') closeLoader();
  }

  function writeSignature(now) {
    const time = now - animationStart;
    let activeSegment = null;

    timeline.forEach((segment) => {
      const progress = Math.min(1, Math.max(0, (time - segment.start) / segment.duration));
      const eased = 1 - Math.pow(1 - progress, 1.35);
      segment.path.style.opacity = progress > 0 ? '1' : '0';
      segment.path.style.strokeDashoffset = String(1 - eased);
      if (progress > 0 && progress < 1) activeSegment = { ...segment, eased };
    });

    if (activeSegment) {
      const point = activeSegment.path.getPointAtLength(activeSegment.length * activeSegment.eased);
      pen.setAttribute('cx', String(point.x));
      pen.setAttribute('cy', String(point.y));
      pen.style.opacity = '1';
    } else {
      pen.style.opacity = '0';
    }

    if (time >= finishAt) closeLoader();
    else loaderFrame = requestAnimationFrame(writeSignature);
  }

  skipLoader.addEventListener('click', () => closeLoader());
  document.addEventListener('keydown', handleLoaderKey);

  if (reducedMotion.matches) {
    closeLoader(true);
  } else {
    document.body.classList.add('is-loading');
    animationStart = performance.now();
    loaderFrame = requestAnimationFrame(writeSignature);
  }
}

// Mobile navigation
const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-button');
const menuLabel = document.querySelector('.menu-label');
const navigation = document.querySelector('#primary-navigation');

function setMenu(open) {
  header.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuLabel.textContent = open ? 'CLOSE' : 'MENU';
  if (open) navigation.querySelector('a').focus();
}

menuButton.addEventListener('click', () => {
  setMenu(!header.classList.contains('is-open'));
});

navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenu(false);
});

document.addEventListener('keydown', (event) => {
  if (!header.classList.contains('is-open')) return;

  if (event.key === 'Escape') {
    setMenu(false);
    menuButton.focus();
    return;
  }

  if (event.key === 'Tab') {
    const focusable = [header.querySelector('.wordmark'), menuButton, ...navigation.querySelectorAll('a')];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 820) setMenu(false);
});

// Reveal content only when it is close to the reading area.
const revealItems = document.querySelectorAll('[data-reveal]');
if (reducedMotion.matches || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -7% 0px' },
  );
  revealItems.forEach((item) => revealObserver.observe(item));
}

// Keep the desktop navigation oriented to the section currently being read.
const navLinks = [...navigation.querySelectorAll('a')];
const navSections = navLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          const active = link.getAttribute('href') === `#${entry.target.id}`;
          if (active) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    },
    { rootMargin: '-35% 0px -55% 0px', threshold: 0 },
  );
  navSections.forEach((section) => sectionObserver.observe(section));
}

// Normalise path lengths so each orange thread can draw itself on scroll.
const threadPaths = [...document.querySelectorAll('.thread-path')];
threadPaths.forEach((path) => path.setAttribute('pathLength', '1'));
const scrollThreads = [...document.querySelectorAll('.scroll-thread')];
const floatingObjects = [...document.querySelectorAll('[data-float]')];
let scrollFrame = null;

function updateScrollScenes() {
  const viewportHeight = window.innerHeight;

  scrollThreads.forEach((path) => {
    const bounds = path.getBoundingClientRect();
    const progress = Math.min(
      1,
      Math.max(0, (viewportHeight * 0.88 - bounds.top) / (viewportHeight * 0.65 + bounds.height * 0.55)),
    );
    path.style.setProperty('--draw', reducedMotion.matches ? 1 : progress.toFixed(3));
  });

  if (!reducedMotion.matches) {
    floatingObjects.forEach((object, index) => {
      const scene = object.closest('.project-world');
      const bounds = scene.getBoundingClientRect();
      if (bounds.bottom < 0 || bounds.top > viewportHeight) return;
      const progress = (viewportHeight - bounds.top) / (viewportHeight + bounds.height);
      const direction = index % 2 === 0 ? 1 : -1;
      const distance = (progress - 0.5) * 42 * direction;
      object.style.setProperty('--float-y', `${distance.toFixed(1)}px`);
    });
  }

  scrollFrame = null;
}

function requestSceneUpdate() {
  if (scrollFrame === null) scrollFrame = requestAnimationFrame(updateScrollScenes);
}

window.addEventListener('scroll', requestSceneUpdate, { passive: true });
window.addEventListener('resize', requestSceneUpdate);
reducedMotion.addEventListener('change', requestSceneUpdate);
updateScrollScenes();

// A small, optional pointer cue echoes the reference without replacing the system cursor.
const cursor = document.querySelector('.custom-cursor');
const cursorLabel = cursor.querySelector('span');

if (finePointer.matches && !reducedMotion.matches) {
  window.addEventListener('pointermove', (event) => {
    const offset = cursor.classList.contains('is-active') ? 34 : 14;
    cursor.style.transform = `translate3d(${event.clientX - offset}px, ${event.clientY - offset}px, 0)`;
    cursor.classList.add('is-visible');
  });

  document.addEventListener('pointerover', (event) => {
    const target = event.target.closest('[data-cursor]');
    cursor.classList.toggle('is-active', Boolean(target));
    cursorLabel.textContent = target?.dataset.cursor || '';
  });

  document.documentElement.addEventListener('mouseleave', () => {
    cursor.classList.remove('is-visible');
  });
}
