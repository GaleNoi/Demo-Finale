const RECRUITMENT = {
  // Aggiorna queste date e il link quando aprono le candidature.
  applyUrl: "mailto:info@jeve.it?subject=Candidatura%20recruitment%20JEVE",
  notifyUrl: "mailto:info@jeve.it?subject=Avvisatemi%20al%20prossimo%20recruitment",
  windows: [{ start: [9, 6], end: [9, 27] }]
};

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const pad = number => String(number).padStart(2, "0");

function recruitmentState(date = new Date()) {
  const year = date.getFullYear();
  for (const window of RECRUITMENT.windows) {
    const start = new Date(year, window.start[0], window.start[1], 9);
    const end = new Date(year, window.end[0], window.end[1], 23, 59, 59);
    if (date >= start && date <= end) return { open: true, target: end };
    if (date < start) return { open: false, target: start };
  }
  const next = RECRUITMENT.windows[0];
  return { open: false, target: new Date(year + 1, next.start[0], next.start[1], 9) };
}

function formatCountdown(target) {
  const distance = Math.max(0, target - new Date());
  const days = Math.floor(distance / 86400000);
  const hours = Math.floor(distance / 3600000) % 24;
  const minutes = Math.floor(distance / 60000) % 60;
  return `${days}g · ${pad(hours)}h · ${pad(minutes)}m`;
}

function renderRecruitment() {
  const state = recruitmentState();
  const label = formatCountdown(state.target);
  const heroStatus = document.querySelector("#hero-status");
  const heroCountdown = document.querySelector("#hero-countdown");
  const heroAction = document.querySelector(".js-apply");
  const finalAction = document.querySelector("#final-action");
  const finalCountdown = document.querySelector("#final-countdown");

  if (state.open) {
    heroStatus.textContent = "Recruitment aperto";
    heroCountdown.textContent = `Chiude tra ${label}`;
    heroAction.href = RECRUITMENT.applyUrl;
    heroAction.target = "_blank";
    heroAction.rel = "noopener";
    finalAction.textContent = "Candidati ora";
    finalAction.href = RECRUITMENT.applyUrl;
    finalAction.target = "_blank";
    finalAction.rel = "noopener";
    finalCountdown.textContent = `Le candidature chiudono tra ${label}`;
  } else {
    heroStatus.textContent = "Prossima apertura";
    heroCountdown.textContent = label;
    heroAction.href = "#candidati";
    heroAction.removeAttribute("target");
    heroAction.removeAttribute("rel");
    finalAction.textContent = "Avvisami alla prossima apertura";
    finalAction.href = RECRUITMENT.notifyUrl;
    finalAction.removeAttribute("target");
    finalAction.removeAttribute("rel");
    finalCountdown.textContent = `Il recruitment riapre tra ${label}`;
  }
}

renderRecruitment();
setInterval(renderRecruitment, 60000);
document.querySelector("#year").textContent = new Date().getFullYear();

const header = document.querySelector(".site-header");
const headerToneSurfaces = [...document.querySelectorAll("[data-header-tone]")];
const processSection = document.querySelector(".process");
const timelineStage = document.querySelector(".timeline-stage");
const timelineProgress = document.querySelector(".timeline-progress");
const timelineSteps = [...document.querySelectorAll(".timeline li")];
const timelineMarkers = [...document.querySelectorAll(".timeline-marker")];
let currentHeaderTone = header.dataset.tone || "dark";
let ticking = false;

function updateHeaderTone() {
  const rect = header.getBoundingClientRect();
  const probeX = Math.max(0, Math.min(innerWidth - 1, rect.left + rect.width / 2));
  const probeY = Math.max(0, Math.min(innerHeight - 1, rect.top + rect.height / 2));
  let surface = null;

  for (const element of document.elementsFromPoint(probeX, probeY)) {
    if (element === header || header.contains(element)) continue;
    surface = element.closest?.("[data-header-tone]");
    if (surface) break;
  }

  surface ||= headerToneSurfaces.find(element => {
    const bounds = element.getBoundingClientRect();
    return bounds.top <= probeY && bounds.bottom > probeY;
  });

  const nextTone = surface?.dataset.headerTone || currentHeaderTone;
  if (nextTone !== currentHeaderTone) {
    header.dataset.tone = nextTone;
    currentHeaderTone = nextTone;
  }
}

function updateRecruitmentTimeline() {
  if (!processSection || !timelineStage || !timelineProgress || timelineMarkers.length < 2) return;

  const localCenters = timelineMarkers.map((marker, index) => (
    timelineSteps[index].offsetTop + marker.offsetTop + marker.offsetHeight / 2
  ));
  const firstCenter = localCenters[0];
  const lastCenter = localCenters[localCenters.length - 1];
  const railLength = Math.max(1, lastCenter - firstCenter);
  const stageTop = timelineStage.getBoundingClientRect().top;
  const anchor = innerHeight * .55;
  const progress = reducedMotion
    ? 1
    : Math.max(0, Math.min(1, (anchor - (stageTop + firstCenter)) / railLength));

  timelineProgress.style.top = `${firstCenter}px`;
  timelineProgress.style.height = `${railLength}px`;
  processSection.style.setProperty("--timeline-progress", progress.toFixed(4));

  timelineSteps.forEach((step, index) => {
    const reached = reducedMotion || stageTop + localCenters[index] <= anchor;
    step.classList.toggle("is-reached", reached);
  });
}

function renderScrollScene() {
  header.classList.toggle("is-scrolled", scrollY > 24);
  updateRecruitmentTimeline();
  updateHeaderTone();
  ticking = false;
}

addEventListener("scroll", () => {
  if (!ticking) {
    requestAnimationFrame(renderScrollScene);
    ticking = true;
  }
}, { passive: true });
addEventListener("resize", renderScrollScene);
renderScrollScene();

const mobileMenu = document.querySelector(".mobile-menu");
const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
const mobileNavigation = document.querySelector("#mobile-navigation");
const mobileMenuLinks = [...mobileNavigation.querySelectorAll("a")];
const mobileHeaderBrand = document.querySelector(".site-header .brand");
const mobileHeaderContact = document.querySelector(".site-header .header-cta");
const mobileMenuBackground = [...document.querySelectorAll("main, .site-footer")];

function setMobileMenu(open, returnFocus = false) {
  mobileMenu.classList.toggle("is-open", open);
  mobileMenuToggle.setAttribute("aria-expanded", String(open));
  mobileMenuToggle.setAttribute("aria-label", open ? "Chiudi il menu" : "Apri il menu");
  mobileNavigation.setAttribute("aria-hidden", String(!open));
  mobileMenuLinks.forEach(link => link.tabIndex = open ? 0 : -1);
  mobileMenuBackground.forEach(element => element.toggleAttribute("inert", open));
  document.documentElement.classList.toggle("menu-open", open);
  if (!open && returnFocus) mobileMenuToggle.focus();
}

mobileMenuToggle.addEventListener("click", () => {
  setMobileMenu(!mobileMenu.classList.contains("is-open"));
});
mobileHeaderBrand.addEventListener("click", () => {
  if (mobileMenu.classList.contains("is-open")) setMobileMenu(false);
});
mobileMenuLinks.forEach(link => link.addEventListener("click", event => {
  const url = new URL(event.currentTarget.href, location.href);
  const samePage = url.origin === location.origin && url.pathname === location.pathname && url.search === location.search;
  const target = samePage && url.hash ? document.querySelector(url.hash) : null;
  setMobileMenu(false);
  if (target) {
    target.tabIndex = -1;
    target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
    requestAnimationFrame(() => target.focus({ preventScroll: true }));
  }
}));
document.addEventListener("keydown", event => {
  if (!mobileMenu.classList.contains("is-open")) return;
  if (event.key === "Escape") {
    setMobileMenu(false, true);
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = [mobileHeaderBrand, mobileHeaderContact, mobileMenuToggle, ...mobileMenuLinks];
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!focusable.includes(document.activeElement)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
addEventListener("resize", () => {
  if (innerWidth > 760 && mobileMenu.classList.contains("is-open")) {
    setMobileMenu(false);
    mobileHeaderBrand.focus();
  }
});

const reveals = document.querySelectorAll(".reveal");
if (!reducedMotion && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .1 });
  reveals.forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index % 4, 3) * 60}ms`;
    observer.observe(element);
  });
} else {
  reveals.forEach(element => element.classList.add("visible"));
}

const cards = [...document.querySelectorAll(".faq-card")];
const closeAll = document.querySelector("#close-all");

function setCardOpen(card, open) {
  const button = card.querySelector("button[aria-controls]");
  const front = card.querySelector(".faq-front");
  const answer = document.querySelector(`#${button.getAttribute("aria-controls")}`);
  const question = card.dataset.question || card.querySelector(".faq-question")?.textContent.trim() || "questa domanda";
  card.classList.toggle("is-open", open);
  button.setAttribute("aria-expanded", String(open));
  button.setAttribute("aria-label", `${open ? "Nascondi" : "Mostra"} risposta: ${question}`);
  front.setAttribute("aria-hidden", String(open));
  answer.setAttribute("aria-hidden", String(!open));
}

function syncCards() {
  closeAll.disabled = !cards.some(card => card.classList.contains("is-open"));
}

cards.forEach(card => {
  const button = card.querySelector("button[aria-controls]");
  button.addEventListener("click", () => {
    setCardOpen(card, !card.classList.contains("is-open"));
    syncCards();
  });
});

closeAll.addEventListener("click", () => {
  const firstQuestion = cards[0]?.querySelector("button[aria-controls]");
  cards.forEach(card => setCardOpen(card, false));
  firstQuestion?.focus();
  syncCards();
});

const contactOverlay = document.querySelector("#contact-overlay");
const contactPanel = document.querySelector("#contact-panel");
const contactClose = document.querySelector("#contact-close");
const contactTriggers = document.querySelectorAll(".contact-trigger");
let contactOpener = null;

function contactFocusable() {
  return [...contactPanel.querySelectorAll("a[href], button:not([disabled]), input, textarea")];
}

function openContact(event) {
  if (mobileMenu.classList.contains("is-open")) setMobileMenu(false);
  contactOpener = event.currentTarget;
  contactOverlay.hidden = false;
  document.body.classList.add("contact-open");
  requestAnimationFrame(() => {
    contactOverlay.classList.add("is-open");
    contactPanel.focus();
  });
}

function closeContact() {
  contactOverlay.classList.remove("is-open");
  document.body.classList.remove("contact-open");
  setTimeout(() => {
    contactOverlay.hidden = true;
    contactOpener?.focus();
  }, reducedMotion ? 0 : 420);
}

contactTriggers.forEach(trigger => trigger.addEventListener("click", openContact));
contactClose.addEventListener("click", closeContact);
contactOverlay.addEventListener("click", event => {
  if (event.target === contactOverlay) closeContact();
});
document.addEventListener("keydown", event => {
  if (contactOverlay.hidden) return;
  if (event.key === "Escape") closeContact();
  if (event.key !== "Tab") return;
  const focusable = contactFocusable();
  const first = focusable[0];
  const last = focusable.at(-1);
  if (document.activeElement === contactPanel) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

const contactForm = document.querySelector("#contact-form");
const formStatus = document.querySelector("#form-status");
const submitButton = contactForm.querySelector(".contact-submit");
const fields = {
  name: contactForm.elements.name,
  email: contactForm.elements.email,
  message: contactForm.elements.message
};

function setFieldError(field, message) {
  const wrapper = field.closest(".form-field");
  wrapper.classList.toggle("has-error", Boolean(message));
  field.setAttribute("aria-invalid", String(Boolean(message)));
  wrapper.querySelector(".field-error").textContent = message;
}

function validateContact() {
  const name = fields.name.value.trim();
  const email = fields.email.value.trim();
  const message = fields.message.value.trim();
  const interest = contactForm.querySelector('input[name="interest"]:checked');
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  setFieldError(fields.name, name.length >= 2 ? "" : "Inserisci il tuo nome.");
  setFieldError(fields.email, emailValid ? "" : "Inserisci un indirizzo email valido.");
  setFieldError(fields.message, message.length >= 10 ? "" : "Scrivi almeno 10 caratteri.");
  document.querySelector("#interest-error").textContent = interest ? "" : "Seleziona un’area di interesse.";
  return name.length >= 2 && emailValid && message.length >= 10 && Boolean(interest);
}

Object.values(fields).forEach(field => {
  field.addEventListener("input", () => {
    if (field.getAttribute("aria-invalid") === "true") validateContact();
  });
});
contactForm.querySelectorAll('input[name="interest"]').forEach(input => {
  input.addEventListener("change", () => {
    document.querySelector("#interest-error").textContent = "";
  });
});

contactForm.addEventListener("submit", event => {
  event.preventDefault();
  formStatus.textContent = "";
  formStatus.className = "form-status";
  if (!validateContact()) {
    contactForm.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }

  submitButton.disabled = true;
  submitButton.classList.add("is-loading");
  submitButton.querySelector(".submit-label").textContent = "Preparazione…";
  const data = new FormData(contactForm);
  const subject = encodeURIComponent(`Contatto JEVE · ${data.get("interest")} · ${data.get("name")}`);
  const body = encodeURIComponent(`Nome: ${data.get("name")}\nEmail: ${data.get("email")}\nArea di interesse: ${data.get("interest")}\n\nMessaggio:\n${data.get("message")}`);

  setTimeout(() => {
    window.location.href = `mailto:info@jeve.it?subject=${subject}&body=${body}`;
    submitButton.disabled = false;
    submitButton.classList.remove("is-loading");
    submitButton.querySelector(".submit-label").textContent = "Invia messaggio";
    formStatus.textContent = "Messaggio pronto: completa l’invio dalla tua app email.";
    formStatus.classList.add("success");
  }, reducedMotion ? 0 : 650);
});
