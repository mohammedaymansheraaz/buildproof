const pillarData = {
  overview: {
    title: "Release overview",
    score: "78",
    decision: "Conditional release",
    copy: "Three holds remain before the stated launch gate. The team has enough corroborated evidence to act now, while 18% of the planned scope remains unobserved.",
    scores: [
      ["Product Intelligence", "92", "signal"],
      ["Experience & Quality", "81", "signal"],
      ["Engineering Performance & Infrastructure", "73", "caution"],
      ["Security & Reliability Intelligence", "68", "hold"],
      ["AI & Launch Readiness", "76", "caution"],
    ],
  },
  product: { title: "Product Intelligence", score: "92", copy: "The product map is ready: roles, critical journeys, interfaces, and declared boundaries are clear enough to govern the rest of the audit.", metrics: [["Mapped surfaces", "184"], ["Priority journeys", "12"], ["Trust boundaries", "8"], ["Evidence coverage", "92%"]], agents: [["01", "Product Understanding Agent", "mapped"]] },
  experience: { title: "Application Experience & Quality", score: "81", copy: "The team can follow real-user behavior through the interface and functional paths. One retry/reload path needs a regression guard.", metrics: [["Journeys confirmed", "9 / 12"], ["Accessibility signals", "24 reviewed"], ["Functional concerns", "2", "caution"], ["Blocking flows", "1", "hold"]], agents: [["02", "UI/UX Testing Agent", "reviewed"], ["03", "Functional QA Agent", "replayed"]] },
  engineering: { title: "Engineering Performance & Infrastructure", score: "73", copy: "Performance, APIs, cloud boundaries, database paths, and deployment practice are read together so a slow or fragile path keeps its technical context.", metrics: [["p75 page load", "2.8 s", "caution"], ["API paths observed", "31"], ["Data paths reviewed", "8 / 9"], ["Deployment controls", "3 gaps", "caution"]], agents: [["04", "Performance Engineer Agent", "measured"], ["05", "Backend + Cloud Engineer Agent", "traced"], ["06", "Database Engineer Agent", "reviewed"], ["08", "DevOps Engineer Agent", "checked"]] },
  security: { title: "Security & Reliability Intelligence", score: "68", copy: "The authorized security review makes risk explainable rather than theatrical: one authorization hypothesis needs human review before the stated release gate.", metrics: [["Auth boundaries", "8"], ["High-priority holds", "1", "hold"], ["Safe checks completed", "14"], ["Secrets exposure", "not observed"]], agents: [["07", "Security Engineer Agent", "assessed"]] },
  launch: { title: "AI & Launch Readiness", score: "76", copy: "Optional AI behavior and cost evidence is considered where relevant, then the final decision layer connects confirmed concerns to business impact, owners, and a re-audit plan.", metrics: [["AI feature scope", "conditional"], ["Release holds", "3", "hold"], ["Suggested owners", "5"], ["Re-audit trigger", "after merge"]], agents: [["09", "AI Evaluation Agent", "conditional"], ["10", "Finance / CTO Agent", "synthesized"]] },
};

const view = document.querySelector("#console-view");
const tabs = [...document.querySelectorAll("[data-lens]")];

function renderOverview(data) {
  return `<div class="overview-grid"><section class="health-card"><div class="card-label"><span>APPLICATION HEALTH</span><span>82% EVIDENCE COVERAGE</span></div><div class="health-content"><div class="health-gauge"><b>${data.score}</b><small>/100</small></div><div class="health-summary"><strong>${data.decision}</strong><p>${data.copy}</p><span>3 RELEASE HOLDS · 12 PRIORITY JOURNEYS</span></div></div></section><section class="activity-card"><div class="card-label"><span>EVIDENCE QUEUE</span><span>LIVE RECORD</span></div><div class="activity-list"><div><i></i><span><b>Product map connected to 12 release journeys</b><small>Product Understanding Agent · 2m ago</small></span></div><div><i></i><span><b>Invite acceptance retry needs confirmation</b><small>Functional QA Agent · high confidence</small></span></div><div><i></i><span><b>Authorization boundary requires review</b><small>Security Engineer Agent · release hold</small></span></div></div></section></div><div class="score-row">${data.scores.map(([name, score, tone]) => `<div class="score-card" data-tone="${tone}"><small>${name}</small><b>${score}<em>/100</em></b></div>`).join("")}</div>`;
}

function renderLens(data) {
  const bars = [32, 55, 41, 73, 66, 85, 46, 63, 78];
  return `<div class="lens-view"><section class="lens-card"><div class="card-label"><span>${data.title.toUpperCase()}</span><span>${data.score} / 100</span></div><h4>${data.title}</h4><p>${data.copy}</p><div class="lens-meter">${bars.map((height) => `<i style="height:${height}%"></i>`).join("")}</div><div class="card-label"><span>OBSERVED SIGNAL DISTRIBUTION</span><span>MOCK DATA</span></div></section><section class="lens-card"><div class="card-label"><span>WHAT THIS LENS CONTRIBUTES</span><span>AGENT RECORD</span></div><div class="metric-table">${data.metrics.map(([label, value, tone]) => `<div><span>${label}</span><b class="${tone === "hold" ? "hold-text" : tone === "caution" ? "caution-text" : ""}">${value}</b></div>`).join("")}</div><div class="agent-mini-list">${data.agents.map(([id, name, state]) => `<div class="agent-mini"><b>${id}</b><span>${name}</span><span>${state}</span></div>`).join("")}</div></section></div>`;
}

function render(key) {
  const data = pillarData[key];
  view.innerHTML = key === "overview" ? renderOverview(data) : renderLens(data);
  tabs.forEach((tab) => { const selected = tab.dataset.lens === key; tab.classList.toggle("selected", selected); tab.setAttribute("aria-selected", selected); });
}

tabs.forEach((tab) => tab.addEventListener("click", () => render(tab.dataset.lens)));
render("overview");

const fullPillars = [
  { id: "product", name: "Product Intelligence", label: "01 agent", summary: "The application is understood before it is judged.", agents: [["01", "Product Understanding Agent", "Maps intent, users, roles, journeys, dependencies, high-risk surfaces, and the authorized audit boundary."]] },
  { id: "experience", name: "Application Experience & Quality", label: "02 agents", summary: "User understanding and functional correctness are evaluated together.", agents: [["02", "UI/UX Testing Agent", "Reviews interaction clarity, hierarchy, states, usability friction, and accessibility cues."], ["03", "Functional QA Agent", "Runs approved journeys through forms, controls, auth states, errors, retries, and regressions."]] },
  { id: "engineering", name: "Engineering Performance & Infrastructure", label: "04 agents", summary: "Runtime behavior, services, data, cloud, and delivery systems are one engineering picture.", agents: [["04", "Performance Engineer Agent", "Measures loading, rendering, runtime bottlenecks, and user-perceived performance."], ["05", "Backend + Cloud Engineer Agent", "Reviews APIs, service boundaries, data flow, cloud architecture, resilience, and scalability evidence."], ["06", "Database Engineer Agent", "Evaluates data paths, query/schema signals, integrity, retention, backups, and database performance."], ["08", "DevOps Engineer Agent", "Reviews CI/CD, deployment readiness, environment separation, observability, rollback, and operational safeguards."]] },
  { id: "security", name: "Security & Reliability Intelligence", label: "01 agent", summary: "Security review is authorized, bounded, and directly tied to evidence.", agents: [["07", "Security Engineer Agent", "Assesses vulnerabilities, authentication and authorization, data protection, safe security posture, and remediation context."]] },
  { id: "launch", name: "AI & Launch Readiness", label: "02 agents", summary: "Optional AI evaluation and CTO-level synthesis turn technical truth into a release decision.", agents: [["09", "AI Evaluation Agent", "When an app has AI features, evaluates output quality, safety, reliability, prompt boundaries, and cost signals."], ["10", "Finance / CTO Agent", "Synthesizes evidence into business impact, priority, cost, ownership, and the final release recommendation; it is a decision layer, not another scanner."]] },
];

const pillarMenu = document.querySelector("#pillar-menu");
const agentDetail = document.querySelector("#agent-detail");
function showPillar(id) {
  const pillar = fullPillars.find((item) => item.id === id);
  pillarMenu.innerHTML = fullPillars.map((item) => `<button class="pillar-choice ${item.id === id ? "active" : ""}" data-pillar="${item.id}"><i></i><span>${item.name}</span><b>${item.label}</b></button>`).join("");
  agentDetail.innerHTML = `<div class="detail-head"><div><small>${pillar.label.toUpperCase()} / VISIBLE PILLAR</small><h3>${pillar.name}</h3></div><p>${pillar.summary}</p></div><div class="agent-rows">${pillar.agents.map(([number, name, description]) => `<div class="agent-row"><b>${number}</b><strong>${name}</strong><p>${description}</p></div>`).join("")}</div>`;
  pillarMenu.querySelectorAll("[data-pillar]").forEach((button) => button.addEventListener("click", () => showPillar(button.dataset.pillar)));
}
showPillar("product");

const modal = document.querySelector("#auth-modal");
const modalTitle = document.querySelector("#auth-modal-title");
const modalCopy = document.querySelector("#auth-modal-copy");
const modalOverline = document.querySelector("#auth-modal-overline");
document.querySelectorAll("[data-auth]").forEach((button) => button.addEventListener("click", () => {
  const signup = button.dataset.auth === "signup";
  modalOverline.textContent = signup ? "CREATE ACCOUNT" : "ACCOUNT ACCESS";
  modalTitle.textContent = signup ? "Begin with your authorized scope." : "Enter the release room.";
  modalCopy.textContent = signup ? "Register to connect a repository and staging target, then confirm the scope before BuildProof inspects anything." : "Sign in to return to your BuildProof evidence and release reports.";
  modal.showModal();
}));
document.querySelector("[data-close]").addEventListener("click", () => modal.close());
modal.addEventListener("click", (event) => { if (event.target === modal) modal.close(); });
