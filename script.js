'use strict';

/* ============================================================
   Кофейня «Why knot?» — интерактив сайта
   ------------------------------------------------------------
   ВАЖНО: весь код (ключевые слова, идентификаторы, свойства)
   написан на английском языке. На русском — только комментарии
   и строки, которые видит пользователь.
   ============================================================
   СОДЕРЖАНИЕ
   1.  Хелперы и безопасная обёртка над localStorage
   2.  Toast-уведомления
   3.  Модальные окна
   4.  Хедер: фон при скролле + scrollspy
   5.  Бургер-меню
   6.  Анимации появления блоков (Intersection Observer)
   7.  Фильтр категорий меню
   8.  Карусель отзывов
   9.  Валидация форм (хелперы)
   10. Форма заявки (контакты)
   11. Форма подписки на рассылку
   12. Личный кабинет: регистрация / вход / выход / профиль
   13. Форма заказа и модалка «Оплата в разработке»
   14. Инициализация
   ============================================================ */

/* ------------------------------------------------------------
   1. ХЕЛПЕРЫ И ХРАНИЛИЩЕ
   ------------------------------------------------------------ */

/** Быстрый поиск элементов */
const $  = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

/** Безопасная обёртка над localStorage (не падает в приватном режиме) */
const LS = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      /* хранилище недоступно — молча игнорируем */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      /* игнорируем */
    }
  }
};

/** Ключи хранилища */
const STORAGE_KEYS = {
  users:       'wk_users',
  session:     'wk_session',
  orders:      'wk_orders',
  requests:    'wk_requests',
  subscribers: 'wk_subscribers'
};

/** Форматирование денег */
const formatMoney = (value) => Number(value).toFixed(2) + ' BYN';

/** Форматирование даты для истории заказов */
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });

/* ------------------------------------------------------------
   2. TOAST-УВЕДОМЛЕНИЯ
   ------------------------------------------------------------ */

/** Показывает всплывающее уведомление; type: 'success' | 'error' */
function showToast(message, type = 'success') {
  const container = $('#toasts');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast toast--' + type;

  const icon = document.createElement('span');
  icon.className = 'toast__icon';
  icon.textContent = type === 'success' ? '✓' : '!';

  const text = document.createElement('p');
  text.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(text);
  container.appendChild(toast);

  // Запуск анимации появления в следующем кадре
  requestAnimationFrame(() => toast.classList.add('toast--show'));

  // Автоскрытие через 4 секунды
  setTimeout(() => {
    toast.classList.remove('toast--show');
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}

/* ------------------------------------------------------------
   3. МОДАЛЬНЫЕ ОКНА
   ------------------------------------------------------------ */

/** Открывает модалку по id (строкой) или по элементу */
function openModal(modal) {
  const element = typeof modal === 'string' ? document.getElementById(modal) : modal;
  if (!element) return;
  element.classList.add('modal--open');
  document.body.classList.add('no-scroll');
}

/** Закрывает модалку; если открытых нет — возвращает скролл страницы */
function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('modal--open');
  if (!$('.modal--open')) {
    document.body.classList.remove('no-scroll');
  }
}

// Делегирование: закрытие по клику на [data-close] (фон, крестик, кнопка)
document.addEventListener('click', (event) => {
  const target = event.target;
  if (!target || !target.closest) return;
  const closer = target.closest('[data-close]');
  if (!closer) return;
  const modal = closer.closest('.modal');
  if (modal) closeModal(modal);
});

// Закрытие по клавише Escape
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const openModals = $$('.modal--open');
  if (openModals.length) closeModal(openModals[openModals.length - 1]);
});

/* ------------------------------------------------------------
   4. ХЕДЕР: ФОН ПРИ СКРОЛЛЕ + SCROLLSPY
   ------------------------------------------------------------ */

const header   = $('#header');
const navLinks = $$('.nav__link');

/** Секции, за которыми следит навигация */
const SPY_IDS = ['hero', 'menu', 'about', 'reviews', 'contacts'];
const spySections = SPY_IDS
  .map((id) => document.getElementById(id))
  .filter(Boolean);

let scrollTick = false;

function onScroll() {
  // Смена фона хедера после 30px прокрутки
  if (header) {
    header.classList.toggle('header--scrolled', window.scrollY > 30);
  }

  // Scrollspy: определяем текущую секцию
  const offset = window.scrollY + (header ? header.offsetHeight : 0) + 140;
  let currentId = spySections.length ? spySections[0].id : '';

  spySections.forEach((section) => {
    if (section.offsetTop <= offset) currentId = section.id;
  });

  navLinks.forEach((link) => {
    link.classList.toggle(
      'nav__link--active',
      link.getAttribute('href') === '#' + currentId
    );
  });

  scrollTick = false;
}

// Оптимизация скролла: requestAnimationFrame + passive listener
window.addEventListener('scroll', () => {
  if (!scrollTick) {
    scrollTick = true;
    requestAnimationFrame(onScroll);
  }
}, { passive: true });

/* ------------------------------------------------------------
   5. БУРГЕР-МЕНЮ
   ------------------------------------------------------------ */

const burger = $('#burger');
const nav    = $('#nav');

/** Полностью закрывает мобильное меню */
function closeBurger() {
  if (!nav || !burger) return;
  nav.classList.remove('nav--open');
  burger.classList.remove('burger--active');
  burger.setAttribute('aria-expanded', 'false');
  if (!$('.modal--open')) document.body.classList.remove('no-scroll');
}

if (burger && nav) {
  burger.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('nav--open');
    burger.classList.toggle('burger--active', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    burger.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
    document.body.classList.add('no-scroll');
    if (!isOpen && !$('.modal--open')) document.body.classList.remove('no-scroll');
  });

  // Закрываем меню после клика по ссылке навигации
  navLinks.forEach((link) => link.addEventListener('click', closeBurger));
}

/* ------------------------------------------------------------
   6. АНИМАЦИИ ПОЯВЛЕНИЯ БЛОКОВ (Intersection Observer)
   ------------------------------------------------------------ */

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target); // анимируем один раз
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

$$('[data-animate]').forEach((element) => revealObserver.observe(element));

/* ------------------------------------------------------------
   7. ФИЛЬТР КАТЕГОРИЙ МЕНЮ
   ------------------------------------------------------------ */

const menuTabs  = $$('.menu__tab');
const menuCards = $$('.menu-card');

menuTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    // Переключаем активный таб
    menuTabs.forEach((item) => item.classList.remove('menu__tab--active'));
    tab.classList.add('menu__tab--active');

    const category = tab.dataset.category;

    // Показываем / скрываем карточки
    menuCards.forEach((card) => {
      const shouldShow = category === 'all' || card.dataset.category === category;
      card.classList.toggle('is-hidden', !shouldShow);

      // Перезапуск CSS-анимации появления карточки
      if (shouldShow) {
        card.style.animation = 'none';
        void card.offsetWidth; // принудительный reflow
        card.style.animation = '';
      }
    });
  });
});

/* ------------------------------------------------------------
   8. КАРУСЕЛЬ ОТЗЫВОВ
   ------------------------------------------------------------ */

const reviewTrack  = $('#reviewTrack');
const reviewSlides = reviewTrack ? $$('.review-slide', reviewTrack) : [];
const dotsWrap     = $('#reviewDots');
const carousel     = $('#reviewsCarousel');
const prevButton   = $('#reviewPrev');
const nextButton   = $('#reviewNext');

let reviewIndex = 0;
let reviewTimer = null;
let reviewDots  = [];

/** Переход к слайду index с зацикливанием */
function goReview(index) {
  if (!reviewTrack || !reviewSlides.length) return;
  reviewIndex = (index + reviewSlides.length) % reviewSlides.length;
  reviewTrack.style.transform = 'translateX(-' + (reviewIndex * 100) + '%)';
  reviewDots.forEach((dot, position) => {
    dot.classList.toggle('reviews__dot--active', position === reviewIndex);
  });
}

function stopAutoplay() {
  if (reviewTimer !== null) {
    clearInterval(reviewTimer);
    reviewTimer = null;
  }
}

function startAutoplay() {
  stopAutoplay();
  reviewTimer = setInterval(() => goReview(reviewIndex + 1), 6000);
}

function restartAutoplay() {
  startAutoplay();
}

/** Создаёт точки-индикаторы по количеству слайдов */
function buildReviewDots() {
  if (!dotsWrap || !reviewSlides.length) return;
  reviewSlides.forEach((slide, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'reviews__dot';
    dot.setAttribute('aria-label', 'Отзыв ' + (index + 1));
    dot.addEventListener('click', () => {
      goReview(index);
      restartAutoplay();
    });
    dotsWrap.appendChild(dot);
  });
  reviewDots = $$('.reviews__dot', dotsWrap);
}

if (prevButton) {
  prevButton.addEventListener('click', () => {
    goReview(reviewIndex - 1);
    restartAutoplay();
  });
}
if (nextButton) {
  nextButton.addEventListener('click', () => {
    goReview(reviewIndex + 1);
    restartAutoplay();
  });
}
if (carousel) {
  // Пауза автопрокрутки при наведении
  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);
}

/* ------------------------------------------------------------
   9. ВАЛИДАЦИЯ ФОРМ (ХЕЛПЕРЫ)
   ------------------------------------------------------------ */

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

const isPhone = (value) => {
  const digits = value.replace(/\D/g, '');
  return /^[+0-9()\-\s]+$/.test(value.trim()) && digits.length >= 10 && digits.length <= 15;
};

/** Помечает поле невалидным и выводит сообщение об ошибке */
function setInvalid(input, message) {
  if (!input) return;
  const field = input.closest('.field');
  if (!field) return;
  field.classList.add('field--invalid');
  const error = field.querySelector('[data-error]');
  if (error) error.textContent = message;
}

/** Снимает все ошибки с полей формы */
function clearInvalid(form) {
  if (!form) return;
  $$('.field--invalid', form).forEach((field) => {
    field.classList.remove('field--invalid');
    const error = field.querySelector('[data-error]');
    if (error) error.textContent = '';
  });
}

// Снимаем подсветку ошибки при вводе
document.addEventListener('input', (event) => {
  const target = event.target;
  if (!target || !target.closest) return;
  const field = target.closest('.field--invalid');
  if (!field) return;
  field.classList.remove('field--invalid');
  const error = field.querySelector('[data-error]');
  if (error) error.textContent = '';
});

/* ------------------------------------------------------------
   10. ФОРМА ЗАЯВКИ (КОНТАКТЫ)
   ------------------------------------------------------------ */

const contactForm = $('#contactForm');

if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    clearInvalid(contactForm);

    const nameInput    = $('#cfName');
    const phoneInput   = $('#cfPhone');
    const commentInput = $('#cfComment');
    let isValid = true;

    if (nameInput.value.trim().length < 2) {
      setInvalid(nameInput, 'Укажите имя (минимум 2 символа)');
      isValid = false;
    }
    if (!isPhone(phoneInput.value)) {
      setInvalid(phoneInput, 'Введите корректный телефон, напр. +375 (29) 123-45-67');
      isValid = false;
    }
    if (!isValid) return;

    // Сохраняем заявку в localStorage
    const requests = LS.get(STORAGE_KEYS.requests, []);
    requests.push({
      name:    nameInput.value.trim(),
      phone:   phoneInput.value.trim(),
      comment: commentInput.value.trim(),
      date:    new Date().toISOString()
    });
    LS.set(STORAGE_KEYS.requests, requests);

    contactForm.reset();
    showToast('Заявка отправлена! Мы свяжемся с вами в ближайшее время ☕');
  });
}

/* ------------------------------------------------------------
   11. ФОРМА ПОДПИСКИ НА РАССЫЛКУ
   ------------------------------------------------------------ */

const subscribeForm = $('#subscribeForm');

if (subscribeForm) {
  subscribeForm.addEventListener('submit', (event) => {
    event.preventDefault();
    clearInvalid(subscribeForm);

    const emailInput = $('#subEmail');
    if (!isEmail(emailInput.value)) {
      setInvalid(emailInput, 'Похоже, в email опечатка — проверьте формат');
      return;
    }

    const subscribers = LS.get(STORAGE_KEYS.subscribers, []);
    const email = emailInput.value.trim().toLowerCase();
    if (subscribers.indexOf(email) === -1) {
      subscribers.push(email);
      LS.set(STORAGE_KEYS.subscribers, subscribers);
    }

    subscribeForm.reset();
    showToast('Вы подписаны! Первое письмо уже в пути ✉️');
  });
}

/* ------------------------------------------------------------
   12. ЛИЧНЫЙ КАБИНЕТ
   ------------------------------------------------------------ */

const authView       = $('#authView');
const profileView    = $('#profileView');
const loginForm      = $('#loginForm');
const registerForm   = $('#registerForm');
const accountButton  = $('#accountBtn');
const logoutButton   = $('#logoutBtn');

/** Возвращает объект текущего пользователя или null */
function getCurrentUser() {
  const email = LS.get(STORAGE_KEYS.session, null);
  if (!email) return null;
  const users = LS.get(STORAGE_KEYS.users, []);
  return users.find((user) => user.email === email) || null;
}

// Переключение табов «Вход / Регистрация»
$$('.auth-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    $$('.auth-tab').forEach((item) => item.classList.remove('auth-tab--active'));
    tab.classList.add('auth-tab--active');
    const isLoginTab = tab.dataset.tab === 'login';
    if (loginForm)    loginForm.classList.toggle('hidden', !isLoginTab);
    if (registerForm) registerForm.classList.toggle('hidden', isLoginTab);
  });
});

// Регистрация
if (registerForm) {
  registerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    clearInvalid(registerForm);

    const nameInput     = $('#regName');
    const emailInput    = $('#regEmail');
    const passwordInput = $('#regPassword');
    let isValid = true;

    if (nameInput.value.trim().length < 2) {
      setInvalid(nameInput, 'Укажите имя');
      isValid = false;
    }
    if (!isEmail(emailInput.value)) {
      setInvalid(emailInput, 'Некорректный email');
      isValid = false;
    }
    if (passwordInput.value.length < 6) {
      setInvalid(passwordInput, 'Пароль минимум 6 символов');
      isValid = false;
    }
    if (!isValid) return;

    const users = LS.get(STORAGE_KEYS.users, []);
    const email = emailInput.value.trim().toLowerCase();

    if (users.some((user) => user.email === email)) {
      setInvalid(emailInput, 'Пользователь с таким email уже существует');
      return;
    }

    users.push({
      name:     nameInput.value.trim(),
      email:    email,
      password: passwordInput.value
    });
    LS.set(STORAGE_KEYS.users, users);
    LS.set(STORAGE_KEYS.session, email);

    registerForm.reset();
    renderAccount();
    showToast('Добро пожаловать, ' + nameInput.value.trim() + '! Аккаунт создан 🎉');
  });
}

// Вход
if (loginForm) {
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    clearInvalid(loginForm);

    const emailInput    = $('#loginEmail');
    const passwordInput = $('#loginPassword');
    const email = emailInput.value.trim().toLowerCase();
    const users = LS.get(STORAGE_KEYS.users, []);
    const user  = users.find((item) => item.email === email && item.password === passwordInput.value);

    if (!user) {
      setInvalid(passwordInput, 'Неверный email или пароль');
      return;
    }

    LS.set(STORAGE_KEYS.session, email);
    loginForm.reset();
    renderAccount();
    showToast('С возвращением, ' + user.name + '! ☕');
  });
}

// Выход
if (logoutButton) {
  logoutButton.addEventListener('click', () => {
    LS.remove(STORAGE_KEYS.session);
    renderAccount();
    showToast('Вы вышли из аккаунта');
  });
}

/** Отрисовка кабинета: форма авторизации или профиль */
function renderAccount() {
  const user  = getCurrentUser();
  const label = $('#accountBtnLabel');

  if (authView)    authView.classList.toggle('hidden', Boolean(user));
  if (profileView) profileView.classList.toggle('hidden', !user);

  if (!user) {
    if (label) label.textContent = 'Личный кабинет';
    return;
  }

  if (label) label.textContent = user.name.split(' ')[0];

  const initials = $('#profileInitials');
  if (initials) initials.textContent = user.name.trim().charAt(0).toUpperCase();

  const nameElement = $('#profileName');
  if (nameElement) nameElement.textContent = user.name;

  const emailElement = $('#profileEmail');
  if (emailElement) emailElement.textContent = user.email;

  // История заказов текущего пользователя
  const orders = LS.get(STORAGE_KEYS.orders, []).filter((order) => order.email === user.email);

  const countElement = $('#ordersCount');
  if (countElement) countElement.textContent = orders.length;

  const history = $('#orderHistory');
  if (!history) return;
  history.innerHTML = '';

  if (!orders.length) {
    const empty = document.createElement('li');
    empty.className = 'order-history__empty';
    empty.textContent = 'Заказов пока нет — оформите первый!';
    history.appendChild(empty);
    return;
  }

  // Показываем 4 последних заказа, новые сверху
  orders.slice(-4).reverse().forEach((order) => {
    const item  = document.createElement('li');
    const names = order.items
      .map((position) => position.name + ' ×' + position.qty)
      .join(', ');

    const date = document.createElement('span');
    date.className = 'order-history__date';
    date.textContent = formatDate(order.date);

    const total = document.createElement('span');
    total.className = 'order-history__total';
    total.textContent = formatMoney(order.total);

    item.appendChild(date);
    item.appendChild(document.createTextNode(names + ' — '));
    item.appendChild(total);
    history.appendChild(item);
  });
}

// Кнопка «Личный кабинет» в хедере
if (accountButton) {
  accountButton.addEventListener('click', () => {
    renderAccount();
    openModal('accountModal');
  });
}

/* ------------------------------------------------------------
   13. ФОРМА ЗАКАЗА И МОДАЛКА «ОПЛАТА В РАЗРАБОТКЕ»
   ------------------------------------------------------------ */

const orderItemsWrap    = $('#orderItems');
const orderTotalElement = $('#orderTotal');
const orderForm         = $('#orderForm');
const openOrderButton   = $('#openOrderBtn');

/** Счётчики количества: { название позиции: количество } */
const orderQuantities = {};

/** Строит список позиций из карточек меню */
function buildOrderItems() {
  if (!orderItemsWrap) return;
  orderItemsWrap.innerHTML = '';

  menuCards.forEach((card) => {
    const row = document.createElement('div');
    row.className = 'order-item';
    row.dataset.name  = card.dataset.name;
    row.dataset.price = card.dataset.price;

    const name = document.createElement('span');
    name.className = 'order-item__name';
    name.textContent = card.dataset.name;

    const price = document.createElement('span');
    price.className = 'order-item__price';
    price.textContent = formatMoney(parseFloat(card.dataset.price));

    const stepper = document.createElement('span');
    stepper.className = 'stepper';

    const minus = document.createElement('button');
    minus.type = 'button';
    minus.dataset.step = '-1';
    minus.setAttribute('aria-label', 'Убрать одну');
    minus.textContent = '−';

    const value = document.createElement('span');
    value.className = 'stepper__val';
    value.textContent = '0';

    const plus = document.createElement('button');
    plus.type = 'button';
    plus.dataset.step = '1';
    plus.setAttribute('aria-label', 'Добавить одну');
    plus.textContent = '+';

    stepper.appendChild(minus);
    stepper.appendChild(value);
    stepper.appendChild(plus);

    row.appendChild(name);
    row.appendChild(price);
    row.appendChild(stepper);
    orderItemsWrap.appendChild(row);
  });
}

/** Пересчитывает итоговую сумму заказа */
function updateOrderTotal() {
  if (!orderItemsWrap || !orderTotalElement) return;
  let total = 0;
  $$('.order-item', orderItemsWrap).forEach((row) => {
    const quantity = orderQuantities[row.dataset.name] || 0;
    total += quantity * parseFloat(row.dataset.price);
  });
  orderTotalElement.textContent = formatMoney(total);
}

/** Сбрасывает выбор позиций при открытии формы */
function resetOrderForm() {
  Object.keys(orderQuantities).forEach((key) => {
    delete orderQuantities[key];
  });
  if (!orderItemsWrap) return;
  $$('.order-item', orderItemsWrap).forEach((row) => {
    const value = row.querySelector('.stepper__val');
    if (value) value.textContent = '0';
  });
  updateOrderTotal();
}

// Делегирование кликов по счётчикам «+» / «−»
if (orderItemsWrap) {
  orderItemsWrap.addEventListener('click', (event) => {
    const button = event.target.closest('[data-step]');
    if (!button) return;
    const row = button.closest('.order-item');
    if (!row) return;

    const name = row.dataset.name;
    const step = parseInt(button.dataset.step, 10);
    const next = Math.max(0, (orderQuantities[name] || 0) + step);
    orderQuantities[name] = next;

    const value = row.querySelector('.stepper__val');
    if (value) value.textContent = next;
    updateOrderTotal();
  });
}

// Кнопка «Оформить заказ» в профиле
if (openOrderButton) {
  openOrderButton.addEventListener('click', () => {
    if (!getCurrentUser()) return;
    resetOrderForm();
    openModal('orderModal');
  });
}

// Отправка заказа: сохранение в историю + заглушка оплаты
if (orderForm) {
  orderForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const user = getCurrentUser();
    if (!user || !orderItemsWrap) return;

    const items = $$('.order-item', orderItemsWrap)
      .map((row) => ({
        name:  row.dataset.name,
        price: parseFloat(row.dataset.price),
        qty:   orderQuantities[row.dataset.name] || 0
      }))
      .filter((position) => position.qty > 0);

    if (!items.length) {
      showToast('Выберите хотя бы одну позицию меню', 'error');
      return;
    }

    const total  = items.reduce((sum, position) => sum + position.price * position.qty, 0);
    const orders = LS.get(STORAGE_KEYS.orders, []);
    orders.push({
      id:    Date.now(),
      email: user.email,
      date:  new Date().toISOString(),
      items: items,
      total: total
    });
    LS.set(STORAGE_KEYS.orders, orders);

    renderAccount();
    closeModal($('#orderModal'));
    openModal('paymentModal'); // красивая заглушка «Оплата в разработке»
  });
}

/* ------------------------------------------------------------
   14. ИНИЦИАЛИЗАЦИЯ
   ------------------------------------------------------------ */

buildReviewDots();   // точки карусели по числу слайдов
buildOrderItems();   // список позиций для формы заказа
updateOrderTotal();  // стартовый итог (0.00 BYN)
renderAccount();     // состояние кабинета после перезагрузки страницы
goReview(0);         // первый слайд карусели + активная точка
startAutoplay();     // автопрокрутка отзывов
onScroll();          // начальное состояние хедера и scrollspy

// Актуальный год в копирайте футера
const yearElement = $('#year');
if (yearElement) yearElement.textContent = String(new Date().getFullYear());

// Автозакрытие бургера при ресайзе окна до десктопа
window.addEventListener('resize', () => {
  if (window.innerWidth >= 768 && nav && nav.classList.contains('nav--open')) {
    closeBurger();
  }
});
