const RECRUITMENT = {
  // Aggiorna queste date e il link quando aprono le candidature.
  applyUrl: "mailto:info@jeve.it?subject=Candidatura%20recruitment%20JEVE",
  notifyUrl: "mailto:info@jeve.it?subject=Avvisatemi%20al%20prossimo%20recruitment",
  windows: [{ season: "fall", label: "Fall recruitment", start: [8, 21], end: [9, 14] }]
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
    heroAction.href = "#candidati";
    heroAction.removeAttribute("target");
    heroAction.removeAttribute("rel");
    finalAction.textContent = "Candidati ora";
    finalAction.href = RECRUITMENT.applyUrl;
    finalAction.target = "_blank";
    finalAction.rel = "noopener";
    finalAction.dataset.action = "apply";
    finalAction.removeAttribute("aria-haspopup");
    finalAction.removeAttribute("aria-controls");
    finalCountdown.textContent = `Le candidature chiudono tra ${label}`;
  } else {
    heroStatus.textContent = "Prossima apertura";
    heroCountdown.textContent = label;
    heroAction.href = "#candidati";
    heroAction.removeAttribute("target");
    heroAction.removeAttribute("rel");
    finalAction.textContent = "Avvisami alla prossima candidatura";
    finalAction.href = RECRUITMENT.notifyUrl;
    finalAction.removeAttribute("target");
    finalAction.removeAttribute("rel");
    finalAction.dataset.action = "notify";
    finalAction.setAttribute("aria-haspopup", "dialog");
    finalAction.setAttribute("aria-controls", "notify-panel");
    finalCountdown.textContent = `Il recruitment riapre tra ${label}`;
  }
}

renderRecruitment();
setInterval(renderRecruitment, 60000);

const heroIntroElements = document.querySelectorAll(".hero-intro");
const revealHeroIntro = () => {
  const delay = reducedMotion ? 0 : 1000;
  setTimeout(() => {
    heroIntroElements.forEach(element => element.classList.add("is-intro-visible"));
  }, delay);
};

if (document.readyState === "complete") {
  revealHeroIntro();
} else {
  addEventListener("load", revealHeroIntro, { once: true });
}

const heroApplicationAction = document.querySelector(".js-apply");
const finalApplicationAction = document.querySelector("#final-action");
let heroApplicationTimer;

heroApplicationAction?.addEventListener("click", event => {
  const applicationSection = document.querySelector("#candidati");
  const destination = finalApplicationAction?.getAttribute("href");

  if (!applicationSection || !destination || destination === "#") return;

  event.preventDefault();
  applicationSection.scrollIntoView({
    behavior: reducedMotion ? "auto" : "smooth",
    block: "start"
  });

  clearTimeout(heroApplicationTimer);
  heroApplicationTimer = setTimeout(() => {
    if (finalApplicationAction.dataset.action === "notify") {
      openNotify(heroApplicationAction);
    } else {
      window.location.href = destination;
    }
  }, reducedMotion ? 0 : 700);
});

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

const WHY_DETAILS = {
  projects: {
    title: "Progetti reali",
    image: "assets/projects-bcg.jpg",
    alt: "Il team JEVE durante un incontro con un’azienda",
    paragraphs: [
      "In JEVE si lavora a progetti interni ed esterni, al fianco di altri JEVErs e dei clienti. I progetti sono molto vari: dalla redazione di business plan allo sviluppo di siti web aziendali, dal riposizionamento del marchio alla lead generation.",
      "Collaboriamo con partner come Deloitte, Fairplay Consulting e AssoConsult per eventi, business game e molte altre attività."
    ]
  },
  training: {
    title: "Formazione continua",
    image: "assets/training-luxottica.jpg",
    alt: "Studenti JEVE in visita alla sede Luxottica",
    paragraphs: [
      "In JEVE si partecipa a visite aziendali, formazioni interne ed eventi. Aggiungiamo un tassello alle conoscenze acquisite in università, arricchendo il percorso con competenze ed esperienze concrete.",
      "Tra le visite aziendali ci sono state Luxottica, BCG e molte altre realtà. Le formazioni riguardano Power BI, Figma, lead generation e sviluppo di siti web; gli eventi includono incontri con aziende come Fiscozen e Jet HR e con professionisti di spicco, tra cui un ex CFO di LVMH."
    ]
  },
  community: {
    title: "Una community ambiziosa",
    image: "assets/community-workshop.jpg",
    alt: "Studenti partecipano a un incontro formativo in auditorium",
    paragraphs: [
      "La nostra rete Alumni permette di orientarsi al meglio dopo la laurea triennale grazie a consigli sui possibili percorsi, sull’ottimizzazione delle candidature e sulla qualità degli insegnamenti. Contiamo ex-JEVErs in università come LSE, CBS, University of St. Gallen, Università Bocconi e Politecnico di Milano.",
      "Inoltre, la rete Alumni gioca un ruolo chiave per il placement, fornendo referral e opportunità lavorative non disponibili al pubblico. Oggi contiamo ex-JEVErs in realtà come Bank of America, Banca Centrale Europea, Deloitte, Amazon e Procter & Gamble."
    ]
  }
};

const whyDetailOverlay = document.querySelector("#why-detail-overlay");
const whyDetailPanel = document.querySelector("#why-detail-panel");
const whyDetailClose = document.querySelector("#why-detail-close");
const whyDetailTitle = document.querySelector("#why-detail-title");
const whyDetailImage = document.querySelector("#why-detail-image");
const whyDetailCopy = document.querySelector("#why-detail-copy");
const whyCarouselTrack = document.querySelector(".why-carousel-track");
const whyExpandButtons = [...document.querySelectorAll(".why-expand")];
const whyDetailBackground = [
  document.querySelector(".site-header"),
  document.querySelector("main"),
  document.querySelector(".site-footer")
].filter(Boolean);
let whyDetailOpener = null;

function openWhyDetail(button) {
  const detail = WHY_DETAILS[button.dataset.whyDetail];
  if (!detail || !whyDetailOverlay || !whyDetailPanel) return;

  whyDetailOpener = button;
  whyDetailTitle.textContent = detail.title;
  whyDetailImage.src = detail.image;
  whyDetailImage.alt = detail.alt;
  whyDetailCopy.replaceChildren(...detail.paragraphs.map(text => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    return paragraph;
  }));
  whyExpandButtons.forEach(item => item.setAttribute("aria-expanded", String(item === button)));
  whyCarouselTrack?.classList.add("is-paused");
  whyDetailBackground.forEach(element => element.inert = true);
  whyDetailOverlay.hidden = false;
  document.body.classList.add("detail-open");
  requestAnimationFrame(() => {
    whyDetailOverlay.classList.add("is-open");
    whyDetailPanel.focus();
  });
}

function closeWhyDetail() {
  if (!whyDetailOverlay || whyDetailOverlay.hidden) return;
  whyDetailOverlay.classList.remove("is-open");
  document.body.classList.remove("detail-open");
  whyExpandButtons.forEach(button => button.setAttribute("aria-expanded", "false"));
  setTimeout(() => {
    whyDetailOverlay.hidden = true;
    whyCarouselTrack?.classList.remove("is-paused");
    whyDetailBackground.forEach(element => element.inert = false);
    if (whyDetailOpener?.tabIndex !== -1) whyDetailOpener?.focus({ preventScroll: true });
  }, reducedMotion ? 0 : 420);
}

whyExpandButtons.forEach(button => {
  button.addEventListener("pointerdown", () => {
    whyCarouselTrack?.classList.add("is-paused");
    setTimeout(() => {
      if (whyDetailOverlay?.hidden) whyCarouselTrack?.classList.remove("is-paused");
    }, 700);
  });
  button.addEventListener("click", event => {
    event.preventDefault();
    openWhyDetail(button);
  });
});

whyDetailClose?.addEventListener("click", closeWhyDetail);
whyDetailOverlay?.addEventListener("click", event => {
  if (event.target === whyDetailOverlay) closeWhyDetail();
});

document.addEventListener("keydown", event => {
  if (!whyDetailOverlay || whyDetailOverlay.hidden) return;
  if (event.key === "Escape") {
    closeWhyDetail();
    return;
  }
  if (event.key === "Tab") {
    event.preventDefault();
    whyDetailClose?.focus();
  }
});

const cards = [...document.querySelectorAll(".faq-card")];
const closeAll = document.querySelector("#close-all");

function setCardOpen(card, open) {
  const button = card.querySelector("button[aria-controls]");
  if (!button) return;
  const answer = document.querySelector(`#${button.getAttribute("aria-controls")}`);
  if (!answer) return;
  const question = card.dataset.question || card.querySelector(".faq-question")?.textContent.trim() || "questa domanda";
  card.classList.toggle("is-open", open);
  button.setAttribute("aria-expanded", String(open));
  button.setAttribute("aria-label", `${open ? "Nascondi" : "Mostra"} risposta: ${question}`);
  answer.hidden = !open;
}

function syncCards() {
  if (closeAll) closeAll.disabled = !cards.some(card => card.classList.contains("is-open"));
}

cards.forEach(card => {
  const button = card.querySelector("button[aria-controls]");
  if (!button) return;
  button.addEventListener("click", () => {
    setCardOpen(card, !card.classList.contains("is-open"));
    syncCards();
  });
  card.addEventListener("click", event => {
    const clickedQuestionButton = event.target instanceof Element && event.target.closest("button[aria-controls]");
    if (clickedQuestionButton || !card.classList.contains("is-open")) return;
    setCardOpen(card, false);
    syncCards();
  });
});

closeAll?.addEventListener("click", () => {
  const firstQuestion = cards[0]?.querySelector("button[aria-controls]");
  cards.forEach(card => setCardOpen(card, false));
  firstQuestion?.focus();
  syncCards();
});

const calendarGrid = document.querySelector("#calendar-grid");
const calendarMonth = document.querySelector("#calendar-month");
const calendarEvents = document.querySelector("#calendar-events");
const calendarPrev = document.querySelector("#calendar-prev");
const calendarNext = document.querySelector("#calendar-next");

if (calendarGrid && calendarMonth && calendarEvents && calendarPrev && calendarNext) {
  const initialCalendarTarget = new Date();
  let calendarDate = new Date(initialCalendarTarget.getFullYear(), initialCalendarTarget.getMonth(), 1);
  let currentMonthKey = `${initialCalendarTarget.getFullYear()}-${initialCalendarTarget.getMonth()}`;
  const monthFormatter = new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" });
  const fullDateFormatter = new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const eventDateFormatter = new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short" });
  const sameDay = (first, second) => first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth() && first.getDate() === second.getDate();
  const rangesForYear = year => RECRUITMENT.windows.map(range => ({
    season: range.season,
    label: range.label,
    start: new Date(year, range.start[0], range.start[1]),
    end: new Date(year, range.end[0], range.end[1])
  }));

  function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingCells = (firstDay.getDay() + 6) % 7;
    const totalCells = Math.ceil((leadingCells + daysInMonth) / 7) * 7;
    const today = new Date();
    const ranges = [...rangesForYear(year - 1), ...rangesForYear(year), ...rangesForYear(year + 1)];
    const fragment = document.createDocumentFragment();

    calendarMonth.textContent = monthFormatter.format(calendarDate);

    for (let index = 0; index < totalCells; index += 1) {
      const day = index - leadingCells + 1;
      const cell = document.createElement("div");
      cell.className = "calendar-day";
      cell.setAttribute("role", "gridcell");

      if (day < 1 || day > daysInMonth) {
        cell.classList.add("is-empty");
        cell.setAttribute("aria-hidden", "true");
        fragment.append(cell);
        continue;
      }

      const date = new Date(year, month, day);
      const activeRange = ranges.find(range => date >= range.start && date <= range.end);
      const number = document.createElement("b");
      number.textContent = String(day);
      cell.append(number);
      cell.setAttribute("aria-label", fullDateFormatter.format(date));

      if (sameDay(date, today)) cell.classList.add("is-today");
      if (activeRange) {
        cell.classList.add("is-window", `is-${activeRange.season}`);
        if (sameDay(date, activeRange.start)) {
          cell.classList.add("is-start");
          const label = document.createElement("small");
          label.textContent = "Apertura";
          cell.append(label);
        } else if (sameDay(date, activeRange.end)) {
          cell.classList.add("is-end");
          const label = document.createElement("small");
          label.textContent = "Chiusura";
          cell.append(label);
        }
      }

      fragment.append(cell);
    }

    calendarGrid.replaceChildren(fragment);

    const monthEvents = ranges
      .map(range => ({ date: range.end, label: `${range.label} · Chiusura candidature` }))
      .filter(event => event.date.getFullYear() === year && event.date.getMonth() === month)
      .sort((first, second) => first.date - second.date);

    calendarEvents.replaceChildren();
    calendarEvents.hidden = !monthEvents.length;
    monthEvents.forEach(event => {
      const row = document.createElement("div");
      const date = document.createElement("time");
      const label = document.createElement("strong");
      date.dateTime = `${event.date.getFullYear()}-${pad(event.date.getMonth() + 1)}-${pad(event.date.getDate())}`;
      date.textContent = eventDateFormatter.format(event.date);
      label.textContent = event.label;
      row.append(date, label);
      calendarEvents.append(row);
    });
  }

  calendarPrev.addEventListener("click", () => {
    calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1);
    renderCalendar();
  });
  calendarNext.addEventListener("click", () => {
    calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
    renderCalendar();
  });

  function syncCalendarMonth() {
    const now = new Date();
    const nextMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
    if (nextMonthKey === currentMonthKey) return;
    currentMonthKey = nextMonthKey;
    calendarDate = new Date(now.getFullYear(), now.getMonth(), 1);
    renderCalendar();
  }

  renderCalendar();
  setInterval(syncCalendarMonth, 60000);
  addEventListener("focus", syncCalendarMonth);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) syncCalendarMonth();
  });
}

const notifyOverlay = document.querySelector("#notify-overlay");
const notifyPanel = document.querySelector("#notify-panel");
const notifyClose = document.querySelector("#notify-close");
const notifyForm = document.querySelector("#notify-form");
const notifyFormStatus = document.querySelector("#notify-form-status");
let notifyOpener = null;

function notifyFocusable() {
  return [...notifyPanel.querySelectorAll("button:not([disabled]), input, select")];
}

function openNotify(opener) {
  if (!notifyOverlay || !notifyPanel) return;
  if (mobileMenu.classList.contains("is-open")) setMobileMenu(false);
  notifyOpener = opener || document.activeElement;
  notifyOverlay.hidden = false;
  document.body.classList.add("contact-open");
  requestAnimationFrame(() => {
    notifyOverlay.classList.add("is-open");
    notifyPanel.focus();
  });
}

function closeNotify(returnFocus = true) {
  notifyOverlay.classList.remove("is-open");
  document.body.classList.remove("contact-open");
  setTimeout(() => {
    notifyOverlay.hidden = true;
    if (returnFocus) notifyOpener?.focus();
  }, reducedMotion ? 0 : 420);
}

finalApplicationAction?.addEventListener("click", event => {
  if (finalApplicationAction.dataset.action !== "notify") return;
  event.preventDefault();
  openNotify(event.currentTarget);
});

notifyClose?.addEventListener("click", () => closeNotify());
notifyOverlay?.addEventListener("click", event => {
  if (event.target === notifyOverlay) closeNotify();
});

document.addEventListener("keydown", event => {
  if (!notifyOverlay || notifyOverlay.hidden) return;
  if (event.key === "Escape") {
    closeNotify();
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = notifyFocusable();
  const first = focusable[0];
  const last = focusable.at(-1);
  if (document.activeElement === notifyPanel) {
    event.preventDefault();
    (event.shiftKey ? last : first)?.focus();
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
});

function setNotifyError(field, message) {
  const wrapper = field.closest(".form-field");
  wrapper.classList.toggle("has-error", Boolean(message));
  field.setAttribute("aria-invalid", String(Boolean(message)));
  wrapper.querySelector(".field-error").textContent = message;
}

function validateNotifyForm() {
  const name = notifyForm.elements.name;
  const surname = notifyForm.elements.surname;
  const email = notifyForm.elements.email;
  const department = notifyForm.elements.department;
  const privacy = notifyForm.elements.privacy;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
  setNotifyError(name, name.value.trim().length >= 2 ? "" : "Inserisci il tuo nome.");
  setNotifyError(surname, surname.value.trim().length >= 2 ? "" : "Inserisci il tuo cognome.");
  setNotifyError(email, emailValid ? "" : "Inserisci un indirizzo email valido.");
  setNotifyError(department, department.value ? "" : "Seleziona il tuo dipartimento.");
  const privacyWrapper = privacy.closest(".privacy-field");
  privacyWrapper.classList.toggle("has-error", !privacy.checked);
  privacy.setAttribute("aria-invalid", String(!privacy.checked));
  privacyWrapper.querySelector(".field-error").textContent = privacy.checked ? "" : "Devi accettare il trattamento dei dati.";
  return name.value.trim().length >= 2 && surname.value.trim().length >= 2 && emailValid && Boolean(department.value) && privacy.checked;
}

notifyForm?.querySelectorAll("input, select").forEach(field => {
  field.addEventListener(field.tagName === "SELECT" || field.type === "checkbox" ? "change" : "input", () => {
    if (field.getAttribute("aria-invalid") === "true") validateNotifyForm();
  });
});

notifyForm?.addEventListener("submit", event => {
  event.preventDefault();
  notifyFormStatus.textContent = "";
  notifyFormStatus.className = "form-status";
  if (!validateNotifyForm()) {
    notifyForm.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }

  const data = new FormData(notifyForm);
  const subject = encodeURIComponent("Richiesta avviso prossimo recruitment JEVE");
  const body = encodeURIComponent(`Nome: ${data.get("name")}\nCognome: ${data.get("surname")}\nEmail: ${data.get("email")}\nDipartimento: ${data.get("department")}\nConsenso al trattamento dei dati: sì\n\nVorrei ricevere un avviso alla prossima apertura delle candidature JEVE.`);
  notifyFormStatus.textContent = "Richiesta pronta: completa l’invio dalla tua app email.";
  notifyFormStatus.classList.add("success");
  window.location.href = `mailto:info@jeve.it?subject=${subject}&body=${body}`;
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
