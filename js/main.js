// --- Lightbox ---
(function () {
  // Build overlay DOM once
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.innerHTML =
    '<button class="lightbox-close" aria-label="Close">&times;</button>' +
    '<button class="lightbox-prev" aria-label="Previous">&#8249;</button>' +
    '<img src="" alt="">' +
    '<button class="lightbox-next" aria-label="Next">&#8250;</button>';
  document.body.appendChild(overlay);

  const img    = overlay.querySelector('img');
  const closeBtn = overlay.querySelector('.lightbox-close');
  const prevBtn  = overlay.querySelector('.lightbox-prev');
  const nextBtn  = overlay.querySelector('.lightbox-next');

  let images = [];   // NodeList of gallery imgs on the current page
  let current = 0;

  function open(index) {
    current = index;
    img.src = images[current].src;
    img.alt = images[current].alt;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    img.src = '';
  }

  function prev() { open((current - 1 + images.length) % images.length); }
  function next() { open((current + 1) % images.length); }

  // Wire controls
  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  // Click backdrop to close
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) close();
  });

  // Keyboard navigation
  document.addEventListener('keydown', function (e) {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape')      close();
    if (e.key === 'ArrowLeft')   prev();
    if (e.key === 'ArrowRight')  next();
  });

  // Attach click handlers to all .photo-gallery imgs after DOM is ready
  document.addEventListener('DOMContentLoaded', function () {
    images = Array.from(document.querySelectorAll('.photo-gallery img'));
    images.forEach(function (imgEl, i) {
      imgEl.addEventListener('click', function () { open(i); });
    });
  });
})();

// --- Navigation ---
document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.querySelector('.navbar');
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  // Scroll effect
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  });

  // Mobile toggle
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('open');
      navLinks.classList.toggle('open');
    });
  }

  // Close mobile menu on link click
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });

  // Mark active nav link
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href').replace(/\/$/, '') || '/';
    if (currentPath === href || (href !== '/' && currentPath.startsWith(href))) {
      link.classList.add('active');
    }
  });

  // Initialize Swiper if present
  if (document.querySelector('.hero-carousel')) {
    new Swiper('.hero-carousel', {
      loop: true,
      autoplay: {
        delay: 4000,
        disableOnInteraction: false,
      },
      effect: 'fade',
      fadeEffect: { crossFade: true },
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
    });
  }
});
