const pillars = [
  { id: "product", index: "01", name: "Product Intelligence", score: "92", agents: ["01"] },
  { id: "experience", index: "02", name: "Experience & Quality", score: "81", agents: ["02", "03"] },
  { id: "engineering", index: "03", name: "Engineering Performance & Infrastructure", score: "73", agents: ["04", "05", "06", "08"] },
  { id: "security", index: "04", name: "Security & Reliability Intelligence", score: "68", agents: ["07"] },
  { id: "launch", index: "05", name: "AI & Launch Readiness", score: "76", agents: ["09", "10"] },
];

const agents = [
  ["01", "Product Understanding Agent", "maps intent, roles, journeys, dependencies, and scope"],
  ["02", "UI/UX Testing Agent", "reviews hierarchy, states, accessibility cues, and friction"],
  ["03", "Functional QA Agent", "tests approved journeys, controls, forms, errors, and regressions"],
  ["04", "Performance Engineer Agent", "measures load, rendering, runtime bottlenecks, and user-perceived speed"],
  ["05", "Backend + Cloud Engineer Agent", "follows APIs, services, data flow, reliability, and cloud architecture"],
  ["06", "Database Engineer Agent", "reviews data paths, queries, integrity, retention, backups, and pressure"],
  ["07", "Security Engineer Agent", "assesses authorized security posture, auth boundaries, data protection, and vulnerabilities"],
  ["08", "DevOps Engineer Agent", "reviews deployment, CI/CD, observability, rollback, and operational safeguards"],
  ["09", "AI Evaluation Agent", "conditionally evaluates AI quality, safety, reliability, and cost signals"],
  ["10", "Finance / CTO Agent", "synthesizes evidence into impact, ownership, cost, and release recommendation"],
];

const byId = Object.fromEntries(agents.map(([id, name, role]) => [id, { id, name, role }]));
const rail = document.querySelector("#rail-stages");
const railIndex = document.querySelector("#rail-index");
const railLabel = document.querySelector("#rail-label");
const progress = document.querySelector("#scan-progress");
const chambers = [...document.querySelectorAll(".chamber")];

pillars.forEach((pillar, i) => {
  const stage = document.createElement("div");
  stage.className = `rail-stage ${i === 0 ? "active" : ""}`;
  stage.dataset.pillar = pillar.id;
  stage.textContent = `${pillar.index}  ${pillar.name}`;
  rail.append(stage);
});

document.querySelectorAll(".agent-depth").forEach((target) => {
  const pillar = pillars.find((item) => item.id === target.dataset.agentGroup);
  if (!pillar) return;
  target.innerHTML = `<span class="agent-kicker">${pillar.agents.length === 1 ? "Specialist agent" : "Specialist agents"}</span><div class="agent-list">${pillar.agents.map((id) => {
    const agent = byId[id];
    return `<span class="agent-chip" title="${agent.role}"><b>${agent.id}</b>${agent.name}<small>+</small></span>`;
  }).join("")}</div>`;
});

function setActive(index) {
  const pillar = pillars[index];
  if (!pillar) return;
  chambers.forEach((chamber, chamberIndex) => chamber.classList.toggle("active", chamberIndex === index));
  document.querySelectorAll(".rail-stage").forEach((stage, stageIndex) => stage.classList.toggle("active", stageIndex === index));
  railIndex.textContent = pillar.index;
  railLabel.textContent = pillar.name;
  progress.style.height = `${(index / (pillars.length - 1)) * 100}%`;
}

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setActive(chambers.indexOf(visible.target));
  }, { rootMargin: "-28% 0px -42% 0px", threshold: [0.18, 0.35, 0.58] });
  chambers.forEach((chamber) => observer.observe(chamber));
}

const dialog = document.querySelector("#auth-dialog");
const authTitle = document.querySelector("#auth-title");
const authEyebrow = document.querySelector("#auth-eyebrow");
const authCopy = document.querySelector("#auth-copy");
document.querySelectorAll("[data-open-auth]").forEach((button) => {
  button.addEventListener("click", () => {
    const signup = button.dataset.openAuth === "signup";
    authEyebrow.textContent = signup ? "Create an account" : "Secure account access";
    authTitle.textContent = signup ? "Start with a scoped audit." : "Welcome back to BuildProof.";
    authCopy.textContent = signup ? "Create a BuildProof account to connect an authorized project and see the audit scope before any inspection begins." : "Sign in to return to your audit workspace, evidence queue, and release reports.";
    dialog.showModal();
  });
});
document.querySelector("[data-close-auth]").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
