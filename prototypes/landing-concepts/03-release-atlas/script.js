const atlasLayers = [
  {
    id: "product", index: "01", name: "Product Intelligence", score: "92 / 100", coverage: "184 mapped surfaces", summary: "The map begins with intent: product roles, release paths, dependencies, and declared scope become the reference frame for every later inspection.", stats: [["PRIORITY JOURNEYS", "12"], ["TRUST BOUNDARIES", "8"], ["MAP CONFIDENCE", "high"], ["STATUS", "ready"]], agents: [["01", "Product Understanding Agent", "Maps product intent, roles, user journeys, dependencies, components, and the authorized audit boundary."]]
  },
  {
    id: "experience", index: "02", name: "Application Experience & Quality", score: "81 / 100", coverage: "9 of 12 journeys confirmed", summary: "This lens follows a real person through interactions and outcomes. Usability signals and functional behavior are treated as one experience, including error, retry, and accessibility states.", stats: [["UI STATES REVIEWED", "24"], ["JOURNEYS CONFIRMED", "9 / 12"], ["OPEN CONCERN", "retry state"], ["STATUS", "caution"]], agents: [["02", "UI/UX Testing Agent", "Reviews hierarchy, interaction clarity, visual states, accessibility cues, and usability friction."], ["03", "Functional QA Agent", "Executes approved user journeys, checks controls, forms, auth states, error paths, retries, and regressions."]]
  },
  {
    id: "engineering", index: "03", name: "Engineering Performance & Infrastructure", score: "73 / 100", coverage: "31 observed API paths", summary: "The map drops through the frontend into requests, services, cloud systems, databases, and delivery practice. A slowdown or weak point stays connected to the system that created it.", stats: [["P75 PAGE LOAD", "2.8 s"], ["API PATHS", "31"], ["DATA PATHS", "8 / 9"], ["STATUS", "needs review"]], agents: [["04", "Performance Engineer Agent", "Measures loading, rendering, runtime bottlenecks, and user-perceived performance."], ["05", "Backend + Cloud Engineer Agent", "Reviews APIs, services, data flow, cloud architecture, reliability, and scalability evidence."], ["06", "Database Engineer Agent", "Evaluates data paths, query/schema signals, integrity, retention, backups, and database performance."], ["08", "DevOps Engineer Agent", "Reviews CI/CD, deployment readiness, environment separation, observability, rollback, and operational safeguards."]]
  },
  {
    id: "security", index: "04", name: "Security & Reliability Intelligence", score: "68 / 100", coverage: "Authorized staging review", summary: "Security intelligence is bounded, evidence-linked, and made useful to the release team. It covers vulnerability context, authentication, authorization, data protection, and safe remediation paths.", stats: [["AUTH BOUNDARIES", "8"], ["HIGH-PRIORITY HOLD", "1"], ["SAFE CHECKS", "14"], ["STATUS", "hold"]], agents: [["07", "Security Engineer Agent", "Assesses authorized security posture, vulnerabilities, authentication and authorization boundaries, data protection, and remediation context."]]
  },
  {
    id: "launch", index: "05", name: "AI & Launch Readiness", score: "76 / 100", coverage: "Decision layer ready", summary: "When AI features exist, their behavior, safety, reliability, and cost get a conditional inspection. The final Finance / CTO layer turns all corroborated evidence into impact, owners, and a release recommendation.", stats: [["AI EVALUATION", "conditional"], ["RELEASE HOLDS", "3"], ["SUGGESTED OWNERS", "5"], ["STATUS", "conditional"]], agents: [["09", "AI Evaluation Agent", "For applications with AI features, evaluates prompt boundaries, output quality, reliability, safety, and cost signals."], ["10", "Finance / CTO Agent", "Synthesizes evidence into business impact, cost, priorities, ownership, and final release recommendation; it is a decision layer, not another scanner."]]
  },
];

const controls = document.querySelector("#atlas-controls");
const readout = document.querySelector("#stage-readout");
const stageMap = document.querySelector("#stage-map");
const layerList = document.querySelector("#layer-list");

function renderAtlas(id) {
  const layer = atlasLayers.find((item) => item.id === id);
  controls.innerHTML = atlasLayers.map((item) => `<button class="atlas-control ${item.id === id ? "active" : ""}" data-layer="${item.id}" role="tab" aria-selected="${item.id === id}"><i></i><span><b>${item.name}</b><small>${item.score}</small></span></button>`).join("");
  readout.innerHTML = `<span class="readout-index">${layer.index} / ${layer.name.toUpperCase()}</span><h3>${layer.coverage}</h3><p>${layer.summary}</p><div class="readout-stats">${layer.stats.map(([label,value]) => `<div><small>${label}</small><b>${value}</b></div>`).join("")}</div><div class="readout-agents">${layer.agents.map(([number,name]) => `<span class="readout-agent"><b>${number}</b> ${name}</span>`).join("")}</div>`;
  stageMap.dataset.layer = layer.id;
  document.querySelector("#atlas-caption").textContent = `${layer.name.toUpperCase()} / MOCK EVIDENCE`;
  controls.querySelectorAll("[data-layer]").forEach((button) => button.addEventListener("click", () => renderAtlas(button.dataset.layer)));
}
renderAtlas("product");

layerList.innerHTML = atlasLayers.map((layer) => `<article class="layer"><span class="layer-index">${layer.index}</span><div class="layer-name">${layer.name}<small>${layer.agents.length === 1 ? "ONE SPECIALIST AGENT" : `${String(layer.agents.length).padStart(2,"0")} SPECIALIST AGENTS`}</small></div><div class="layer-body"><p>${layer.summary}</p><div class="layer-agents">${layer.agents.map(([number,name,description]) => `<span class="layer-agent" title="${description}"><b>${number}</b>${name}</span>`).join("")}</div></div></article>`).join("");

const dialog = document.querySelector("#auth-dialog");
const title = document.querySelector("#auth-title");
const copy = document.querySelector("#auth-copy");
const kicker = document.querySelector("#auth-kicker");
document.querySelectorAll("[data-auth]").forEach((button) => button.addEventListener("click", () => {
  const signup = button.dataset.auth === "signup";
  kicker.textContent = signup ? "CREATE A BUILDPROOF ACCOUNT" : "SECURE ACCOUNT ACCESS";
  title.textContent = signup ? "Map your release scope." : "Enter BuildProof.";
  copy.textContent = signup ? "Register to connect an authorized repository and test target. BuildProof shows the proposed scope before it starts inspecting." : "Sign in to return to your audit workspace and release atlas.";
  dialog.showModal();
}));
document.querySelector("[data-close]").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
