(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  );

  const nav = document.querySelector('.site-nav');
  const progressBar = document.querySelector('#scroll-progress-bar');
  const year = document.querySelector('#current-year');
  const productImage = document.querySelector('#product-image');
  const imageFallback = document.querySelector(
    '#product-image-fallback'
  );

  // Секции, участвующие в эффекте наложения
  const stackPairs = [
    {
      panel: document.querySelector('#hero'),
      next: document.querySelector('#product')
    },
    {
      panel: document.querySelector('#product'),
      next: document.querySelector('#about')
    },
    {
      panel: document.querySelector('#about'),
      next: document.querySelector('.footer')
    }
  ].filter(({ panel, next }) => panel && next);

  // Актуальный год в футере
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  // Заглушка, если фото товара отсутствует
  if (productImage && imageFallback) {
    const showFallback = () => {
      productImage.hidden = true;
      imageFallback.hidden = false;
    };

    productImage.addEventListener('error', showFallback, {
      once: true
    });

    if (
      productImage.complete &&
      productImage.naturalWidth === 0
    ) {
      showFallback();
    }
  }

  // Появление контента при прокрутке
  const revealItems = [
    ...document.querySelectorAll('.reveal')
  ];

  if (
    reduceMotion.matches ||
    !('IntersectionObserver' in window)
  ) {
    revealItems.forEach((item) => {
      item.classList.add('is-visible');
    });
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -45px 0px'
      }
    );

    revealItems.forEach((item) => {
      revealObserver.observe(item);
    });
  }

  // Плавная прокрутка по ссылкам-якорям
  document.querySelectorAll('a[href^="#"]').forEach(
    (anchor) => {
      anchor.addEventListener('click', (event) => {
        const href = anchor.getAttribute('href');

        if (!href || href === '#') return;

        const target = document.getElementById(
          href.slice(1)
        );

        if (!target) return;

        event.preventDefault();

        target.scrollIntoView({
          behavior: reduceMotion.matches ? 'auto' : 'smooth',
          block: 'start'
        });

        if (
          !target.hasAttribute('tabindex') &&
          target !== document.body
        ) {
          target.setAttribute('tabindex', '-1');
        }

        if (anchor.matches('.skip-link')) {
          target.focus({ preventScroll: true });
        }
      });
    }
  );

  // Обновление эффектов при скролле
  let scrollTicking = false;

  const updateScrollUI = () => {
    const maxScroll = Math.max(
      1,
      root.scrollHeight - window.innerHeight
    );

    const scrollProgress = Math.min(
      1,
      Math.max(0, window.scrollY / maxScroll)
    );

    // Индикатор прокрутки сверху
    if (progressBar) {
      progressBar.style.transform =
        `scaleX(${scrollProgress})`;
    }

    // Стеклянная шапка при прокрутке
    if (nav) {
      nav.classList.toggle(
        'is-scrolled',
        window.scrollY > 16
      );
    }

    /*
     * ЭФФЕКТ НАЛОЖЕНИЯ СТРАНИЦ
     *
     * Чем ближе следующая секция к верху экрана,
     * тем сильнее уменьшается предыдущая.
     */
    if (!reduceMotion.matches) {
      const viewportHeight = window.innerHeight || 1;

      stackPairs.forEach(({ panel, next }) => {
        const nextTop = next.getBoundingClientRect().top;

        const overlapStart =
          window.innerWidth <= 760 ? 32 : 54;

        const rawProgress =
          (
            viewportHeight -
            nextTop -
            overlapStart
          ) / (viewportHeight * 0.78);

        const progress = Math.min(
          1,
          Math.max(0, rawProgress)
        );

        // Масштаб: от 1 до 0.955
        const scale = 1 - progress * 0.045;

        // Лёгкое движение вверх
        const lift = -progress * 18;

        // Небольшое затемнение уходящего слоя
        const brightness = 1 - progress * 0.13;

        panel.style.setProperty(
          '--stack-scale',
          scale.toFixed(4)
        );

        panel.style.setProperty(
          '--stack-y',
          `${lift.toFixed(2)}px`
        );

        panel.style.setProperty(
          '--stack-brightness',
          brightness.toFixed(4)
        );
      });
    } else {
      stackPairs.forEach(({ panel }) => {
        panel.style.removeProperty('--stack-scale');
        panel.style.removeProperty('--stack-y');
        panel.style.removeProperty('--stack-brightness');
      });
    }

    scrollTicking = false;
  };

  // Один расчёт на кадр для плавной анимации
  window.addEventListener(
    'scroll',
    () => {
      if (!scrollTicking) {
        window.requestAnimationFrame(updateScrollUI);
        scrollTicking = true;
      }
    },
    { passive: true }
  );

  window.addEventListener(
    'resize',
    updateScrollUI,
    { passive: true }
  );

  updateScrollUI();

  // Подсветка активного раздела в навигации
  if ('IntersectionObserver' in window) {
    const navLinks = [
      ...document.querySelectorAll(
        '.site-nav a[href^="#"]'
      )
    ].filter(
      (link) => link.getAttribute('href') !== '#hero'
    );

    const sections = navLinks
      .map((link) => {
        const href = link.getAttribute('href');
        return document.getElementById(href.slice(1));
      })
      .filter(Boolean);

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          navLinks.forEach((link) => {
            if (
              link.getAttribute('href') ===
              `#${entry.target.id}`
            ) {
              link.setAttribute(
                'aria-current',
                'location'
              );
            } else {
              link.removeAttribute('aria-current');
            }
          });
        });
      },
      {
        rootMargin: '-35% 0px -55% 0px',
        threshold: 0
      }
    );

    sections.forEach((section) => {
      sectionObserver.observe(section);
    });
  }
})();