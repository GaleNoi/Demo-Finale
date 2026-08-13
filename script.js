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

/* Calendario JEVE: deriva le scadenze dalla configurazione recruitment. */
const calendarGrid = document.querySelector("#calendar-grid");
const calendarMonth = document.querySelector("#calendar-month");
const calendarEvents = document.querySelector("#calendar-events");
const calendarPrev = document.querySelector("#calendar-prev");
const calendarNext = document.querySelector("#calendar-next");
const nextRecruitment = recruitmentState().target;
let calendarDate = new Date(nextRecruitment.getFullYear(), nextRecruitment.getMonth(), 1);

const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

function calendarRecruitmentEvents(year) {
  return RECRUITMENT.windows.flatMap(window => [
    { date: new Date(year, window.start[0], window.start[1]), type: "opening", title: "Apertura recruitment" },
    { date: new Date(year, window.end[0], window.end[1]), type: "closing", title: "Chiusura recruitment" }
  ]);
}

function sameCalendarDay(first, second) {
  return first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth() && first.getDate() === second.getDate();
}

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const events = calendarRecruitmentEvents(year);
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  calendarMonth.textContent = `${monthNames[month]} ${year}`;
  calendarGrid.innerHTML = "";

  for (let index = 0; index < firstWeekday; index += 1) {
    const empty = document.createElement("span");
    empty.className = "calendar-day is-empty";
    empty.setAttribute("aria-hidden", "true");
    calendarGrid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const event = events.find(item => sameCalendarDay(item.date, date));
    const cell = document.createElement("span");
    cell.className = `calendar-day${sameCalendarDay(date, today) ? " is-today" : ""}${event ? ` has-event ${event.type}` : ""}`;
    cell.setAttribute("role", "gridcell");
    cell.setAttribute("aria-label", event ? `${day} ${monthNames[month]}: ${event.title}` : `${day} ${monthNames[month]}`);
    cell.innerHTML = `<b>${day}</b>${event ? `<i aria-hidden="true"></i><small>${event.type === "opening" ? "Apre" : "Chiude"}</small>` : ""}`;
    calendarGrid.appendChild(cell);
  }

  const visibleEvents = events.filter(item => item.date.getMonth() === month);
  calendarEvents.innerHTML = visibleEvents.length
    ? visibleEvents.map(item => `<div><time datetime="${item.date.toISOString().slice(0, 10)}">${item.date.getDate()} ${monthNames[month]}</time><strong>${item.title}</strong></div>`).join("")
    : "<p>Nessuna scadenza recruitment prevista in questo mese.</p>";
}

calendarPrev.addEventListener("click", () => {
  calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1);
  renderCalendar();
});
calendarNext.addEventListener("click", () => {
  calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
  renderCalendar();
});
renderCalendar();

const progressBar = document.querySelector(".scroll-progress span");
const header = document.querySelector(".site-header");
let ticking = false;

function renderScrollScene() {
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const progress = Math.min(1, scrollY / max);
  progressBar.style.transform = `scaleX(${progress})`;
  header.classList.toggle("is-scrolled", scrollY > 24);
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

const cards = [...document.querySelectorAll(".flashcard")];
const closeAll = document.querySelector("#close-all");
function syncCards() {
  closeAll.disabled = !cards.some(card => card.classList.contains("is-open"));
}
cards.forEach(card => {
  const button = card.querySelector("button");
  button.addEventListener("click", () => {
    const open = card.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(open));
    syncCards();
  });
});
closeAll.addEventListener("click", () => {
  cards.forEach(card => {
    card.classList.remove("is-open");
    card.querySelector("button").setAttribute("aria-expanded", "false");
  });
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
