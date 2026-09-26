(() => {
  "use strict";

  document.documentElement.classList.add("js-enabled");

  /* =========================================
     PROJECT DATA
     ========================================= */
  const projects = [
    {
      title: "Lumera",
      description:
        "Корпоративный сайт с акцентом на визуальную подачу, понятную структуру услуг и быстрый сценарий обращения.",
      tags: ["HTML", "CSS", "JavaScript"],
      url: "https://vidnasite.github.io/cite-for-beauty/",
      image: "assets/project-1.png",
      alt: "Скриншот проекта Lumera",
    },
    {
      title: "Rastem.by",
      description:
        "Современная веб-витрина магазина детских игрушек с динамическим каталогом на базе Supabase и прямой интеграцией заказов в мессенджеры.",
      tags: ["HTML", "CSS", "JavaScript", "Supabase"],
      url: "https://vidnasite.github.io/rastem.by/",
      image: "assets/project-4.png",
      alt: "Скриншот проекта Rastem.by",
    },
    // 3. ТЕПЕРЬ ТРЕТЬИМ ИДЕТ КОФЕЙНЯ:
    {
      title: "Why knot?",
      description:
        "Атмосферный сайт спешелти-кофейни с интерактивным меню, личным кабинетом гостя, корзиной предварительного заказа и сохранением данных в localStorage.",
      tags: ["HTML", "CSS", "JavaScript"],
      url: "https://vidnasite.github.io/cite-for-caffe/",
      image: "assets/Screenshot_6.png",
      alt: "Скриншот сайта кофейни Why knot?",
    },
    // 4. ЧЕТВЁРТЫЙ — РЕМОНТ ТЕЛЕФОНОВ:
    {
      title: "ФИКСЛАБ",
      description:
        "Многостраничный сайт сервисного центра по ремонту смартфонов с интерактивным прайсом и онлайн-заявкой.",
      tags: ["HTML", "CSS", "JavaScript"],
      url: "https://vidnasite.github.io/cite-for-phones-/",
      image: "assets/project-3.png",
      alt: "Скриншот проекта ФИКСЛАБ",
    },
    // 5. ТЕПЕРЬ ПЯТЫМ ИДЁТ САЙТ ПРО МАШИНЫ:
    {
      title: "GLOSS LAB",
      description:
        "Промо-сайт студии автодетейлинга с интерактивной галереей и формой заявки.",
      tags: ["HTML", "CSS", "JavaScript"],
      url: "https://vidnasite.github.io/cite-for-cars/",
      image: "assets/project-2.png",
      alt: "Скриншот проекта GLOSS LAB ",
    },
  ];

  /* =========================================
     SLIDER CORE
     ========================================= */
  const track = document.getElementById("sliderTrack");
  const dotsContainer = document.getElementById("sliderDots");
  const viewport = document.querySelector(".slider-viewport");
  const sliderShell = document.getElementById("portfolioSlider");
  const prevBtn = document.querySelector(".slider-arrow--prev");
  const nextBtn = document.querySelector(".slider-arrow--next");

  let currentIndex = 0;
  let autoTimer = null;
  let resumeTimer = null;
  let isPausedByUser = false;
  let isInView = false;

  // Touch state
  let touchStartX = 0;
  let touchStartY = 0;
  let isDragging = false;

  const AUTOPLAY_DELAY = 3000;
  const RESUME_DELAY = 4000;
  const SWIPE_THRESHOLD = 50;

  // Reduced motion check
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* =========================================
     RENDER SLIDES
     ========================================= */
  function renderSlides() {
    // Render slides
    track.innerHTML = projects
      .map(
        (project, index) => `
        <article
          class="project-slide"
          role="group"
          aria-roledescription="слайд"
          aria-label="${index + 1} из ${projects.length}"
          data-index="${index}"
        >
          <div class="project-card">
            <div class="project-visual">
              <button
                class="project-preview"
                type="button"
                aria-label="Открыть изображение проекта «${project.title}»"
                data-index="${index}"
              >
                <span class="project-browser">
                  <span class="browser-bar"><i></i><i></i><i></i></span>
                  <span class="browser-body">
                    <span class="browser-mock" aria-hidden="true">
                      <span class="mock-label"></span>
                      <span class="mock-title"></span>
                      <span class="mock-copy"></span>
                      <span class="mock-grid"><span></span><span></span><span></span></span>
                    </span>
                    <img
                      class="browser-shot"
                      src="${project.image}"
                      alt="${project.alt}"
                      loading="${index === 0 ? "eager" : "lazy"}"
                    >
                  </span>
                </span>
              </button>
            </div>
            <div class="project-info">
              <span class="project-index">${String(index + 1).padStart(2, "0")} / ${String(projects.length).padStart(2, "0")}</span>
              <h3>${project.title}</h3>
              <p class="project-description">${project.description}</p>
              <div class="project-tags" aria-label="Технологии проекта">
                ${project.tags.map((tag) => `<span>${tag}</span>`).join("")}
              </div>
              <a
                class="project-link"
                href="${project.url}"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Перейти на сайт проекта «${project.title}»"
              >
                Перейти на сайт <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </article>
      `
      )
      .join("");

    // Attach error handlers for images
    track.querySelectorAll(".browser-shot").forEach((img) => {
      img.addEventListener("error", () => {
        img.classList.add("is-broken");
      });
    });

    // Render dots
    dotsContainer.innerHTML = projects
      .map(
        (project, index) => `
        <button
          class="slider-dot"
          type="button"
          role="tab"
          aria-selected="${index === currentIndex}"
          aria-controls="slide-${index}"
          aria-label="Проект ${index + 1}: ${project.title}"
          data-index="${index}"
        ></button>
      `
      )
      .join("");
  }

  /* =========================================
     UPDATE SLIDER STATE
     ========================================= */
  function updateSlider(animate = true) {
    if (!animate) {
      track.style.transition = "none";
    } else {
      track.style.transition = "";
    }

    track.style.transform = `translate3d(-${currentIndex * 100}%, 0, 0)`;

    // Update slides accessibility
    [...track.children].forEach((slide, index) => {
      const isActive = index === currentIndex;
      slide.setAttribute("aria-hidden", String(!isActive));

      // Inert for hidden slides (prevents focus trap)
      if (isActive) {
        slide.removeAttribute("inert");
      } else {
        slide.setAttribute("inert", "");
      }
    });

    // Update dots
    [...dotsContainer.children].forEach((dot, index) => {
      dot.setAttribute("aria-selected", String(index === currentIndex));
    });

    // Restore transition after non-animated jump
    if (!animate) {
      requestAnimationFrame(() => {
        track.style.transition = "";
      });
    }
  }

  /* =========================================
     NAVIGATION
     ========================================= */
  function goTo(index, { user = false } = {}) {
    currentIndex = (index + projects.length) % projects.length;
    updateSlider(true);

    if (user) {
      pauseAndScheduleResume();
    }
  }

  function next({ user = false } = {}) {
    goTo(currentIndex + 1, { user });
  }

  function previous({ user = false } = {}) {
    goTo(currentIndex - 1, { user });
  }

 /* =========================================
     AUTOPLAY ENGINE
     ========================================= */
  function isMobileDevice() {
    // Проверяем: узкий экран смартфона или сенсорный экран
    return window.matchMedia("(max-width: 768px)").matches || "ontouchstart" in window;
  }

  function stopAutoplay() {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  }

  function clearResumeTimer() {
    if (resumeTimer) {
      clearTimeout(resumeTimer);
      resumeTimer = null;
    }
  }

  function startAutoplay() {
    // Отключаем автопрокрутку при reduced-motion И полностью на мобилках
    if (prefersReducedMotion || isMobileDevice()) return;

    stopAutoplay();
    autoTimer = window.setInterval(() => {
      next({ user: false });
    }, AUTOPLAY_DELAY);
  }

  /**
   * Остановка и перезапуск автоплея
   */
  function pauseAndScheduleResume() {
    stopAutoplay();
    clearResumeTimer();

    // На телефонах повторно таймер не запускаем
    if (isMobileDevice()) return;

    resumeTimer = window.setTimeout(() => {
      if (isInView && !lightbox.open) {
        startAutoplay();
      }
      resumeTimer = null;
    }, RESUME_DELAY);
  }

  /**
   * Full stop — no resume scheduled.
   * Used when lightbox opens or tab becomes hidden.
   */
  function fullStop() {
    stopAutoplay();
    clearResumeTimer();
  }

  /* =========================================
     TOUCH / SWIPE HANDLING
     ========================================= */
  function handleTouchStart(event) {
    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    isDragging = true;

    // Instant stop on touch start
    stopAutoplay();
    clearResumeTimer();
  }

  function handleTouchEnd(event) {
    if (!isDragging) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    isDragging = false;

    // Determine if horizontal swipe or vertical scroll
    const isHorizontalSwipe =
      Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY);

    if (isHorizontalSwipe) {
      if (deltaX < 0) {
        next({ user: true });
      } else {
        previous({ user: true });
      }
    } else {
      // Not a valid swipe — just schedule resume
      pauseAndScheduleResume();
    }
  }

  function handleTouchCancel() {
    isDragging = false;
    pauseAndScheduleResume();
  }

  /* =========================================
     KEYBOARD NAVIGATION (scoped to slider)
     ========================================= */
  function handleKeydown(event) {
    // Only respond when focus is inside the slider region
    if (!sliderShell.contains(document.activeElement)) return;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      previous({ user: true });
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      next({ user: true });
    }
  }

  /* =========================================
     EVENT BINDING
     ========================================= */
  function bindSliderEvents() {
    // Arrow buttons
    nextBtn.addEventListener("click", () => next({ user: true }));
    prevBtn.addEventListener("click", () => previous({ user: true }));

    // Dots (event delegation)
    dotsContainer.addEventListener("click", (event) => {
      const dot = event.target.closest(".slider-dot");
      if (!dot) return;
      goTo(Number(dot.dataset.index), { user: true });
    });

    // Touch events
    viewport.addEventListener("touchstart", handleTouchStart, { passive: true });
    viewport.addEventListener("touchend", handleTouchEnd, { passive: true });
    viewport.addEventListener("touchcancel", handleTouchCancel, { passive: true });

    // Mouse hover pause
    viewport.addEventListener("mouseenter", () => {
      stopAutoplay();
      clearResumeTimer();
    });

    viewport.addEventListener("mouseleave", () => {
      // Resume only if not paused by lightbox or visibility
      if (!lightbox.open && isInView) {
        pauseAndScheduleResume();
      }
    });

    // Keyboard (scoped)
    sliderShell.addEventListener("keydown", handleKeydown);

    // Visibility API — stop when tab is hidden
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        fullStop();
      } else if (isInView && !lightbox.open && !prefersReducedMotion) {
        pauseAndScheduleResume();
      }
    });

    // IntersectionObserver — autoplay only when visible
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isInView = entry.isIntersecting;
            if (!isInView) {
              fullStop();
            } else if (!lightbox.open && !prefersReducedMotion) {
              startAutoplay();
            }
          });
        },
        { threshold: 0.3 }
      );
      observer.observe(sliderShell);
    } else {
      // Fallback: always consider in view
      isInView = true;
    }
  }

  /* =========================================
     LIGHTBOX
     ========================================= */
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxTitle = document.getElementById("lightboxTitle");
  const lightboxCloseBtn = document.querySelector(".lightbox-close");

  function openLightbox(index) {
    const project = projects[index];
    lightboxImage.src = project.image;
    lightboxImage.alt = project.alt;
    lightboxTitle.textContent = project.title;

    // Full stop while lightbox is open
    fullStop();

    if (typeof lightbox.showModal === "function") {
      lightbox.showModal();
    } else {
      lightbox.setAttribute("open", "");
    }
  }

  function closeLightbox() {
    if (lightbox.open && typeof lightbox.close === "function") {
      lightbox.close();
    } else {
      lightbox.removeAttribute("open");
    }
  }

  function handleLightboxClose() {
    lightboxImage.src = "";
    // Schedule resume after closing
    if (isInView && !prefersReducedMotion) {
      pauseAndScheduleResume();
    }
  }

  function bindLightboxEvents() {
    // Open on preview click (delegation)
    track.addEventListener("click", (event) => {
      const preview = event.target.closest(".project-preview");
      if (!preview) return;
      openLightbox(Number(preview.dataset.index));
    });

    // Close button
    lightboxCloseBtn.addEventListener("click", closeLightbox);

    // Click on backdrop
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });

    // Native close event (Esc key, backdrop click, close button)
    lightbox.addEventListener("close", handleLightboxClose);
  }

  /* =========================================
     SCROLL REVEAL ANIMATIONS
     ========================================= */
  function initScrollAnimations() {
    const elements = document.querySelectorAll(".reveal");

    if (!("IntersectionObserver" in window)) {
      elements.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    elements.forEach((el) => observer.observe(el));
  }
/* =========================================
   PROCESS TIMELINE
   Линия рисуется при скролле, узлы загораются
   ========================================= */
function initProcessTimeline() {
  const list = document.getElementById("processList");
  if (!list) return;

  const items = list.querySelectorAll(".process-item");

  // При reduced motion показываем всё сразу
  if (prefersReducedMotion) {
    list.style.setProperty("--process-progress", "1");
    items.forEach((item) => item.classList.add("is-active"));
    return;
  }

  // Узлы загораются, пока видны на экране
  const nodeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-active", entry.isIntersecting);
      });
    },
    { threshold: 0.5, rootMargin: "0px 0px -15% 0px" }
  );
  items.forEach((item) => nodeObserver.observe(item));

  // Прогресс линии по мере прокрутки
  let ticking = false;

  function updateProgress() {
    const rect = list.getBoundingClientRect();
    const triggerPoint = window.innerHeight * 0.6;
    const progress = (triggerPoint - rect.top) / rect.height;
    const clamped = Math.min(1, Math.max(0, progress));
    list.style.setProperty("--process-progress", clamped.toFixed(3));
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateProgress);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  updateProgress();
}
/* =========================================
     COPY EMAIL HANDLER
     ========================================= */
  function initEmailCopy() {
    const emailBtn = document.querySelector(".footer-email-btn");
    const toast = document.getElementById("toast");
    let toastTimer = null;

    if (!emailBtn) return;

    emailBtn.addEventListener("click", async () => {
      const email = emailBtn.dataset.email;
      if (!email) return;

      try {
        // Современный способ копирования
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(email);
        } else {
          // Резервный способ (если открыто локально или без https)
          const tempInput = document.createElement("textarea");
          tempInput.value = email;
          tempInput.style.position = "fixed";
          tempInput.style.opacity = "0";
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand("copy");
          document.body.removeChild(tempInput);
        }

        // Показ всплывающего сообщения на 2.5 секунды
        if (toast) {
          toast.classList.add("is-show");
          clearTimeout(toastTimer);
          toastTimer = setTimeout(() => {
            toast.classList.remove("is-show");
          }, 2500);
        }
      } catch (err) {
        console.error("Ошибка при копировании почты:", err);
      }
    });
  }
  /* =========================================
     INITIALIZATION
     ========================================= */
  
  renderSlides();
  bindSliderEvents();
  bindLightboxEvents();
  updateSlider(false);
  initScrollAnimations();
  initProcessTimeline();
  initEmailCopy();

  // Start autoplay only if conditions allow
  if (!prefersReducedMotion) {
    // Autoplay will be started by IntersectionObserver when slider enters viewport
    // For browsers without IO support, start immediately
    if (!("IntersectionObserver" in window)) {
      startAutoplay();
    }
  }
})();