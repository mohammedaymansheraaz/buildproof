const agents = [
  { id: 1, name: "Product Understanding Agent", short: "product map", chapter: "product" },
  { id: 2, name: "UI/UX Testing Agent", short: "experience review", chapter: "experience" },
  { id: 3, name: "Functional QA Agent", short: "journey verification", chapter: "experience" },
  { id: 4, name: "Performance Engineer Agent", short: "runtime trace", chapter: "engineering" },
  { id: 5, name: "Backend + Cloud Engineer Agent", short: "service topology", chapter: "engineering" },
  { id: 6, name: "Database Engineer Agent", short: "data-path review", chapter: "engineering" },
  { id: 7, name: "Security Engineer Agent", short: "trust-boundary review", chapter: "security" },
  { id: 8, name: "DevOps Engineer Agent", short: "release-operation verification", chapter: "security" },
  { id: 9, name: "AI Evaluation Agent (optional)", short: "conditional AI layer", chapter: "launch" },
  { id: 10, name: "Final CTO-Level Report", short: "release decision", chapter: "launch" },
];

const chapters = [
  { id: "product", number: "01", title: "Product Intelligence", note: "Agent 01 · understand before judgment", accent: "#a5eaff" },
  { id: "experience", number: "02", title: "Experience & Quality", note: "Agents 02–03 · test the real journey", accent: "#bdadff" },
  { id: "engineering", number: "03", title: "Engineering Performance & Infrastructure", note: "Agents 04–06 + DevOps capability", accent: "#e5b069" },
  { id: "security", number: "04", title: "Security & Reliability", note: "Agent 07 → release operation 08", accent: "#fa8478" },
  { id: "release", number: "05", title: "AI & Launch Readiness", note: "Agent 09 optional · CTO report 10", accent: "#bceecf" },
];

const clusters = {
  product: [1],
  experience: [2, 3],
  engineering: [4, 5, 6, 8],
  security: [7],
  launch: [9, 10],
};

const motionReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const railList = document.querySelector("#agent-rail-list");
const railCounter = document.querySelector("#rail-counter");
const railFill = document.querySelector("#rail-fill");
const chapterNav = document.querySelector("#chapter-nav");

const twoDigits = (value) => String(value).padStart(2, "0");

agents.forEach((agent) => {
  const item = document.createElement("li");
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.agent = agent.id;
  button.setAttribute("aria-label", `${twoDigits(agent.id)} ${agent.name}`);
  button.title = `${twoDigits(agent.id)} ${agent.name}`;
  button.addEventListener("click", () => document.querySelector(`#${agent.chapter}`)?.scrollIntoView({ behavior: motionReduced ? "auto" : "smooth", block: "start" }));
  item.append(button);
  railList.append(item);
});

chapters.forEach((chapter) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "chapter-jump";
  button.style.setProperty("--accent", chapter.accent);
  button.innerHTML = `<span>${chapter.number} / CHAPTER</span><b>${chapter.title}</b><small>${chapter.note}</small>`;
  button.addEventListener("click", () => document.querySelector(`#${chapter.id}`)?.scrollIntoView({ behavior: motionReduced ? "auto" : "smooth", block: "start" }));
  chapterNav.append(button);
});

document.querySelectorAll("[data-cluster]").forEach((target) => {
  const key = target.dataset.cluster;
  (clusters[key] || []).forEach((id) => {
    const agent = agents.find((item) => item.id === id);
    if (!agent) return;
    const chip = document.createElement("div");
    chip.className = "agent-chip";
    const executionNote = agent.id === 8 && key === "engineering" ? "executes after security gate" : agent.short;
    chip.innerHTML = `<b>${twoDigits(agent.id)}</b><span>${agent.name}</span><small>${executionNote}</small>`;
    target.append(chip);
  });
});

function setActiveAgent(lastAgent, firstAgent = lastAgent) {
  const fraction = Math.max(0, Math.min(1, lastAgent / agents.length));
  railCounter.textContent = twoDigits(lastAgent);
  railFill.style.setProperty("--rail-progress", fraction);
  document.querySelectorAll("[data-agent]").forEach((button) => {
    const id = Number(button.dataset.agent);
    button.classList.toggle("done", id < firstAgent);
    button.classList.toggle("active", id >= firstAgent && id <= lastAgent);
    button.setAttribute("aria-current", id >= firstAgent && id <= lastAgent ? "step" : "false");
  });
}

function animateCounts(section) {
  if (motionReduced || section.dataset.counted === "true") return;
  section.dataset.counted = "true";
  section.querySelectorAll("[data-count]").forEach((node) => {
    const finalValue = Number(node.dataset.count);
    const started = performance.now();
    const duration = 780;
    const step = (now) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = Math.round(finalValue * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    node.textContent = "0";
    requestAnimationFrame(step);
  });
}

const sections = [...document.querySelectorAll(".chapter[data-chapter]")];
function activateSection(section) {
  if (!section) return;
  const first = Number(section.dataset.firstAgent);
  const last = Number(section.dataset.lastAgent);
  sections.forEach((item) => item.classList.toggle("is-active", item === section));
  setActiveAgent(last, first);
  animateCounts(section);
}

let activeFrame = 0;
function updateActiveChapter() {
  activeFrame = 0;
  const probe = window.innerHeight * .47;
  const closest = sections.reduce((current, section) => {
    const rect = section.getBoundingClientRect();
    const centerDistance = Math.abs((rect.top + rect.bottom) / 2 - probe);
    return !current || centerDistance < current.distance ? { section, distance: centerDistance } : current;
  }, null);
  activateSection(closest?.section);
}

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      activateSection(entry.target);
    });
  }, { rootMargin: "-32% 0px -38% 0px", threshold: 0.02 });
  sections.forEach((section) => observer.observe(section));
} else {
  activateSection(sections[0]);
}

window.addEventListener("scroll", () => {
  if (!activeFrame) activeFrame = requestAnimationFrame(updateActiveChapter);
}, { passive: true });
window.addEventListener("resize", updateActiveChapter);
setActiveAgent(1, 1);
updateActiveChapter();

document.querySelectorAll(".parallax-stage").forEach((stage) => {
  if (motionReduced) return;
  stage.addEventListener("pointermove", (event) => {
    const rect = stage.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - .5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - .5) * 2;
    stage.style.setProperty("--px", x.toFixed(3));
    stage.style.setProperty("--py", y.toFixed(3));
  });
  stage.addEventListener("pointerleave", () => {
    stage.style.setProperty("--px", "0");
    stage.style.setProperty("--py", "0");
  });
});

const authDialog = document.querySelector("#auth-dialog");
const authTitle = document.querySelector("#auth-title");
const authCopy = document.querySelector("#auth-copy");
const authKicker = document.querySelector("#auth-kicker");
document.querySelectorAll("[data-auth]").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const isSignup = trigger.dataset.auth === "signup";
    authKicker.textContent = isSignup ? "Secure account setup" : "Secure account access";
    authTitle.textContent = isSignup ? "Build a release record." : "Return to the audit workspace.";
    authCopy.textContent = isSignup
      ? "Create a BuildProof account to connect an authorized repository and begin a scoped audit."
      : "Sign in to return to your evidence, release reports, and active audit scope.";
    if (typeof authDialog.showModal === "function") authDialog.showModal();
  });
});
document.querySelector("[data-close-auth]")?.addEventListener("click", () => authDialog.close());
authDialog?.addEventListener("click", (event) => { if (event.target === authDialog) authDialog.close(); });

document.querySelectorAll(".text-button").forEach((button) => {
  button.addEventListener("click", () => document.querySelector("#auth-dialog")?.showModal());
});
