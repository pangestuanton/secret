/**
 * script.js — Birthday Greeting for Aura Leviona Azzahra
 * ═══════════════════════════════════════════════════════
 * Modules:
 *   1. Bootstrap / first-interaction unlock
 *   2. Floating Hearts (Canvas)
 *   3. Smooth Scroll to first section
 *   4. Envelope animation
 *   5. Typewriter effect
 *   6. Sliding Photo Gallery + Lightbox
 *   7. Secret Surprise modal
 *   8. Background Music (Web Audio API)
 *   9. Intersection Observer — section reveals
 * ═══════════════════════════════════════════════════════
 */

'use strict';

/* ──────────────────────────────────────────────────────────────
   HELPERS
────────────────────────────────────────────────────────────── */

/** Safely query a single element; returns null if not found. */
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
/** Safely query all elements as an Array. */
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/** Clamp a number between min and max. */
const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);

/** Random float between lo and hi. */
const rand = (lo, hi) => lo + Math.random() * (hi - lo);


/* ══════════════════════════════════════════════════════════════
   1. FIRST-INTERACTION BOOTSTRAP
   — Browsers block autoplay audio & canvas until a user gesture.
     We unlock everything on first click/touch.
══════════════════════════════════════════════════════════════ */
let audioUnlocked = false;

function unlockAudio () {
  if (audioUnlocked) return;
  audioUnlocked = true;
  startWebAudioMusic();
}

document.addEventListener('click',     unlockAudio, { once: true });
document.addEventListener('touchstart', unlockAudio, { once: true });


/* ══════════════════════════════════════════════════════════════
   2. FLOATING HEARTS CANVAS
══════════════════════════════════════════════════════════════ */
(function initHeartsCanvas () {
  const canvas = qs('#heartsCanvas');
  if (!canvas) return;

  const ctx  = canvas.getContext('2d');
  let hearts = [];
  let raf;

  /* Heart colours (matching the CSS palette) */
  const COLOURS = [
    'rgba(244,167,185,',   /* rose      */
    'rgba(212,184,224,',   /* lavender  */
    'rgba(246,217,127,',   /* gold      */
    'rgba(249,196,210,',   /* pink      */
    'rgba(255,248,252,'    /* white     */
  ];

  /* Resize canvas to match viewport */
  function resize () {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });

  /* Create a single heart particle */
  function createHeart () {
    return {
      x:       rand(0, canvas.width),
      y:       canvas.height + 20,
      size:    rand(10, 26),
      speed:   rand(0.6, 1.8),
      opacity: rand(0.55, 1),
      drift:   rand(-0.5, 0.5),    /* horizontal sway  */
      sway:    rand(0, Math.PI * 2),/* sway phase       */
      swaySpd: rand(0.01, 0.025),
      colour:  COLOURS[Math.floor(rand(0, COLOURS.length))]
    };
  }

  /**
   * Draw an SVG-style heart centred at (cx, cy).
   * The cubic-bezier heart path is approximated via Canvas curves.
   */
  function drawHeart (cx, cy, size, colour, alpha) {
    ctx.save();
    ctx.translate(cx, cy);
    const s = size;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.3);
    /* Left lobe */
    ctx.bezierCurveTo(-s * 0.5, -s * 0.2, -s, s * 0.1, 0, s);
    /* Right lobe */
    ctx.bezierCurveTo(s, s * 0.1, s * 0.5, -s * 0.2, 0, s * 0.3);
    ctx.closePath();
    ctx.fillStyle = colour + alpha + ')';
    ctx.fill();
    ctx.restore();
  }

  /* Animation loop */
  function animate () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* Spawn new hearts at a steady rate */
    if (Math.random() < 0.06) hearts.push(createHeart());

    hearts = hearts.filter(h => {
      /* Move */
      h.sway += h.swaySpd;
      h.x    += Math.sin(h.sway) * 0.8 + h.drift;
      h.y    -= h.speed;

      /* Fade as it nears the top */
      const progress = 1 - (h.y / canvas.height);
      const alpha    = h.opacity * (1 - clamp(progress * 1.2 - 0.3, 0, 1));

      drawHeart(h.x, h.y, h.size, h.colour, alpha.toFixed(3));

      /* Remove once invisible or off-screen */
      return h.y > -h.size * 2 && alpha > 0.01;
    });

    raf = requestAnimationFrame(animate);
  }

  animate();
})();


/* ══════════════════════════════════════════════════════════════
   3. HERO — "Open Your Surprise" button → smooth scroll
══════════════════════════════════════════════════════════════ */
(function initHeroButton () {
  const btn     = qs('#openSurpriseBtn');
  const target  = qs('#letterSection');

  if (!btn || !target) return;

  btn.addEventListener('click', () => {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });

    /* Burst of extra hearts on click */
    spawnHeartBurst(btn);
  });

  /* Hide scroll hint after first scroll */
  const hint = qs('#scrollHint');
  if (hint) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 80) hint.style.opacity = '0';
      else                      hint.style.opacity = '';
    }, { passive: true });
  }
})();


/* ══════════════════════════════════════════════════════════════
   HEART BURST — spawns several heart emojis flying out from el
══════════════════════════════════════════════════════════════ */
function spawnHeartBurst (el) {
  const rect  = el.getBoundingClientRect();
  const cx    = rect.left + rect.width  / 2;
  const cy    = rect.top  + rect.height / 2;
  const emojis = ['🌸','💗','💕','✨','🌹','💖'];

  for (let i = 0; i < 12; i++) {
    const span = document.createElement('span');
    span.textContent = emojis[Math.floor(rand(0, emojis.length))];
    span.style.cssText = `
      position: fixed;
      left: ${cx}px;
      top:  ${cy}px;
      font-size: ${rand(14, 26)}px;
      pointer-events: none;
      z-index: 9999;
      transform: translate(-50%, -50%);
      transition: none;
    `;
    document.body.appendChild(span);

    const angle  = rand(0, 360);
    const dist   = rand(60, 160);
    const dx     = Math.cos(angle * Math.PI / 180) * dist;
    const dy     = Math.sin(angle * Math.PI / 180) * dist;
    const dur    = rand(600, 1100);

    span.animate([
      { opacity: 1, transform: `translate(-50%, -50%) translate(0px, 0px) scale(1)` },
      { opacity: 0, transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(.4)` }
    ], { duration: dur, easing: 'ease-out' }).onfinish = () => span.remove();
  }
}


/* ══════════════════════════════════════════════════════════════
   4. ENVELOPE ANIMATION
══════════════════════════════════════════════════════════════ */
(function initEnvelope () {
  const envelope   = qs('#envelope');
  const letterCard = qs('#letterCard');

  if (!envelope || !letterCard) return;

  let isOpen = false;

  function openEnvelope () {
    if (isOpen) return;
    isOpen = true;

    /* 1. Flip flap open */
    envelope.classList.add('is-open');

    /* 2. Slide letter card down with a slight delay */
    setTimeout(() => {
      letterCard.classList.add('is-visible');
      startTypewriter();
    }, 500);

    /* Small heart burst from the envelope */
    spawnHeartBurst(envelope);
  }

  envelope.addEventListener('click',   openEnvelope);
  envelope.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') openEnvelope();
  });
})();


/* ══════════════════════════════════════════════════════════════
   5. TYPEWRITER EFFECT
══════════════════════════════════════════════════════════════ */

/** The letter text — customise this freely. */
const LETTER_TEXT =
`Today the universe paused for a moment
to celebrate one of its most precious gifts — you.

From the way your eyes light up when you laugh,
to the quiet warmth you bring into every room,
you make the ordinary feel extraordinary.

I hope this birthday brings you as much joy
as you bring to everyone around you.
May every wish you make tonight come true,
and may this year be your most beautiful one yet.

You are cherished, deeply and truly. 🌸`;

function startTypewriter () {
  const el = qs('#typewriterText');
  if (!el) return;

  let i = 0;
  const speed = 28; /* ms per character */

  function type () {
    if (i < LETTER_TEXT.length) {
      el.textContent += LETTER_TEXT[i++];
      setTimeout(type, speed);
    } else {
      /* Remove blinking cursor once done */
      el.classList.add('done');
    }
  }

  type();
}


/* ══════════════════════════════════════════════════════════════
   6. SLIDING PHOTO GALLERY + LIGHTBOX
══════════════════════════════════════════════════════════════ */
(function initGallery () {
  const track     = qs('#galleryTrack');
  const prevBtn   = qs('#prevBtn');
  const nextBtn   = qs('#nextBtn');
  const dotsWrap  = qs('#galleryDots');
  const slides    = qsa('.gallery-slide', track);

  if (!track || !slides.length) return;

  let current   = 0;
  let autoTimer;
  let touchStartX = 0;
  let isDragging  = false;

  const total = slides.length;

  /* ── Build indicator dots ── */
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className   = 'gallery-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Go to photo ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  function getDots () { return qsa('.gallery-dot', dotsWrap); }

  function updateDots () {
    getDots().forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function goTo (idx) {
    current = ((idx % total) + total) % total;   /* wrap-around */
    track.style.transform = `translateX(-${current * 100}%)`;
    updateDots();
  }

  function next () { goTo(current + 1); }
  function prev () { goTo(current - 1); }

  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  /* Auto-advance every 4 s */
  function startAuto () {
    stopAuto();
    autoTimer = setInterval(next, 4000);
  }
  function stopAuto () { clearInterval(autoTimer); }

  startAuto();

  /* Pause on hover */
  track.parentElement.addEventListener('mouseenter', stopAuto);
  track.parentElement.addEventListener('mouseleave', startAuto);

  /* ── Touch / swipe support ── */
  track.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    isDragging  = true;
    stopAuto();
  }, { passive: true });

  track.addEventListener('touchend', e => {
    if (!isDragging) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
    isDragging = false;
    startAuto();
  });

  /* ── Keyboard arrow keys when carousel is focused ── */
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  prev();
    if (e.key === 'ArrowRight') next();
  });

  /* ── Lightbox ── */
  const lightbox        = qs('#lightbox');
  const lightboxImg     = qs('#lightboxImg');
  const lightboxCaption = qs('#lightboxCaption');
  const lightboxClose   = qs('#lightboxClose');

  qsa('.gallery-slide__img-wrap').forEach(wrap => {
    wrap.addEventListener('click', () => {
      const img     = qs('img',  wrap);
      const caption = qs('.gallery-slide__caption', wrap.closest('.gallery-slide'));
      lightboxImg.src         = img.src;
      lightboxImg.alt         = img.alt;
      lightboxCaption.textContent = caption ? caption.textContent : '';
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
    });
  });

  function closeLightbox () {
    lightbox.hidden = true;
    document.body.style.overflow = '';
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
  });
})();


/* ══════════════════════════════════════════════════════════════
   7. SECRET SURPRISE MODAL
══════════════════════════════════════════════════════════════ */
(function initSecretModal () {
  const trigger  = qs('#secretTrigger');
  const modal    = qs('#secretModal');
  const backdrop = qs('#secretBackdrop');
  const closeBtn = qs('#secretClose');
  const wordsEl  = qs('#secretWords');
  const heartsEl = qs('#secretHearts');

  if (!trigger || !modal) return;

  /* The cycling words */
  const WORDS = [
    'Sunshine ☀️',
    'My Inspiration ✨',
    'Favourite Person 🌸',
    'Shining Star ⭐',
    'Precious Joy 💗',
    'Everything Good 🌹'
  ];
  let wordIdx = 0;
  let cycleTimer;

  function cycleWord () {
    /* Fade out */
    wordsEl.classList.add('fade-out');
    wordsEl.classList.remove('fade-in');

    setTimeout(() => {
      wordIdx = (wordIdx + 1) % WORDS.length;
      wordsEl.textContent = WORDS[wordIdx];
      /* Fade in */
      wordsEl.classList.remove('fade-out');
      wordsEl.classList.add('fade-in');
    }, 420);
  }

  function openSecret () {
    modal.hidden = false;
    document.body.style.overflow = 'hidden';

    /* Populate hearts decoration */
    heartsEl.textContent = '♥ ♥ ♥';

    /* Start word cycling */
    wordsEl.textContent  = WORDS[0];
    wordsEl.classList.add('fade-in');
    cycleTimer = setInterval(cycleWord, 2200);

    /* Heart burst around trigger */
    spawnHeartBurst(trigger);
  }

  function closeSecret () {
    modal.hidden = true;
    document.body.style.overflow = '';
    clearInterval(cycleTimer);
    wordIdx = 0;
    wordsEl.classList.remove('fade-in', 'fade-out');
  }

  trigger.addEventListener('click',   openSecret);
  trigger.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') openSecret();
  });

  closeBtn.addEventListener('click',  closeSecret);
  backdrop.addEventListener('click',  closeSecret);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hidden) closeSecret();
  });
})();


/* ══════════════════════════════════════════════════════════════
   8. BACKGROUND MUSIC via Audio Element (MP3/SRC)
   — Mengontrol elemen <audio> dengan fungsi play/pause.
══════════════════════════════════════════════════════════════ */

const musicPlayer = document.querySelector('#musicPlayer');
const musicIcon   = document.querySelector('#musicIcon');
const bgMusic     = document.querySelector('#bgMusic'); // Pastikan ID ini ada di HTML

let musicPlaying = false;

function toggleMusic() {
    if (!bgMusic) return;

    if (bgMusic.paused) {
        // Mulai Putar
        bgMusic.play().then(() => {
            musicPlaying = true;
            updateMusicUI();
        }).catch(error => {
            console.log("Autoplay diblokir browser, butuh klik user.");
        });
    } else {
        // Pause Musik
        bgMusic.pause();
        musicPlaying = false;
        updateMusicUI();
    }
}

function updateMusicUI() {
    if (!musicPlayer || !musicIcon) return;
    
    // Memberikan class 'muted' jika sedang pause (untuk CSS styling)
    musicPlayer.classList.toggle('muted', !musicPlaying);
    
    // Ganti icon
    musicIcon.textContent = musicPlaying ? '♪' : '♩';
    
    // Ganti tooltip
    musicPlayer.title = musicPlaying ? 'Pause music' : 'Play music';
    
    // Opsional: Tambah efek rotasi jika sedang main
    if (musicPlaying) {
        musicIcon.style.animation = "spin 3s linear infinite";
    } else {
        musicIcon.style.animation = "none";
    }
}

/* Pasang Event Listener */
if (musicPlayer) {
    musicPlayer.addEventListener('click', toggleMusic);
}

/* ══════════════════════════════════════════════════════════════
   9. INTERSECTION OBSERVER — section reveal on scroll
══════════════════════════════════════════════════════════════ */
(function initReveal () {
  /* Mark elements we want to reveal */
  const targets = [
    qs('#letterSection'),
    qs('#gallerySection'),
    qs('#finalSection'),
    qs('.final-card'),
    qs('.envelope-wrapper')
  ].filter(Boolean);

  targets.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);         /* reveal once */
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -60px 0px'
  });

  targets.forEach(el => observer.observe(el));
})();


/* ══════════════════════════════════════════════════════════════
   END OF SCRIPT
══════════════════════════════════════════════════════════════ */
console.log('%c 🌸 Happy Birthday, Aura Leviona Azzahra 🌸 ', [
  'background: linear-gradient(135deg, #f4a7b9, #9b59b6)',
  'color: #fff8fc',
  'font-size: 14px',
  'font-weight: bold',
  'padding: 8px 20px',
  'border-radius: 20px'
].join(';'));
