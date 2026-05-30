const contentDefaults = {
  profile: {
    name: "Ezekiel's Portfolio",
    phone: "+254727550182",
    email: "gituraezekiel@gmail.com",
    headline: "Showcase incident response, security research, and hands-on labs.",
    intro:
      "A working portfolio hub for PDF reports, blog posts, project writeups, and experience notes. Add your own evidence, preview it in place, and let reviewers move through your work without leaving the site."
  },
  showStarterProjects: true,
  toolkit: [
    "Splunk",
    "Wireshark",
    "Nmap",
    "Burp Suite",
    "Microsoft Sentinel",
    "Linux",
    "Python",
    "MITRE ATT&CK",
    "OSINT",
    "Cloud IAM"
  ],
  experience: [
    {
      title: "Threat Detection and SIEM",
      description:
        "Built detections, triaged alerts, enriched telemetry, and mapped findings to attacker behavior."
    },
    {
      title: "Vulnerability Assessment",
      description:
        "Documented exposure, prioritized remediation, and translated scan output into clear risk narratives."
    },
    {
      title: "Cloud and Identity Security",
      description:
        "Reviewed IAM, logging, network controls, and hardening baselines across modern cloud environments."
    }
  ]
};

const starterWork = [
  {
    id: "sample-ir",
    source: "sample",
    type: "post",
    title: "Incident Response Lab: Suspicious PowerShell Investigation",
    category: "Cybersecurity",
    date: "2026-02",
    summary:
      "A walk-through of triaging suspicious PowerShell activity, collecting host artifacts, and mapping the behavior to MITRE ATT&CK.",
    tags: ["SIEM", "PowerShell", "MITRE ATT&CK"],
    body: `# Suspicious PowerShell Investigation

## Scenario
An endpoint generated a high-severity alert after encoded PowerShell launched from a user profile directory. The objective was to verify whether the activity was benign automation or attacker execution.

## What I Did
- Reviewed command-line telemetry and parent-child process relationships.
- Correlated authentication, DNS, and proxy logs around the alert window.
- Decoded the command and identified download-and-execute behavior.
- Built a short containment plan and documented evidence for escalation.

## Outcome
The investigation confirmed malicious execution intent. The recommended response was host isolation, credential reset for the affected user, and a new detection for encoded PowerShell with network egress.`
  },
  {
    id: "sample-vm",
    source: "sample",
    type: "post",
    title: "Vulnerability Assessment Report: Exposed Services",
    category: "Cybersecurity",
    date: "2026-01",
    summary:
      "A sample report format for prioritizing exposed services, validating scan output, and turning technical findings into remediation actions.",
    tags: ["Nmap", "Risk Rating", "Remediation"],
    body: `# Exposed Services Assessment

## Scope
This assessment reviewed a small lab network for externally reachable services, insecure configurations, and weak remediation ownership.

## Method
Discovery was performed with network scanning, service fingerprinting, and manual validation. Findings were ranked by exploitability, exposure, and business impact.

## Key Findings
- Administrative interfaces were reachable from untrusted network segments.
- Legacy TLS settings appeared on one web service.
- A test service disclosed software version details.

## Recommendations
Restrict administrative access, disable legacy protocol support, and assign owners for recurring validation.`
  },
  {
    id: "sample-cloud",
    source: "sample",
    type: "post",
    title: "Cloud IAM Review: Least Privilege Cleanup",
    category: "Cloud",
    date: "2025-12",
    summary:
      "A practical writeup for reviewing privileged identities, unused permissions, and logging gaps in a cloud lab.",
    tags: ["IAM", "CloudTrail", "Least Privilege"],
    body: `# Cloud IAM Least Privilege Review

## Goal
Reduce excessive permissions while preserving operational access for normal administrative work.

## Review Steps
- Identified privileged users, groups, and service accounts.
- Compared granted permissions against recent activity.
- Checked whether audit logging covered identity changes.
- Proposed a staged cleanup with break-glass access preserved.

## Result
The review produced a permission cleanup plan, a logging checklist, and a short verification process for future access changes.`
  },
  {
    id: "sample-research",
    source: "sample",
    type: "post",
    title: "Security Research Notes: Phishing Infrastructure Triage",
    category: "Articles",
    date: "2025-11",
    summary:
      "Notes on collecting indicators, reviewing domain patterns, and writing a concise threat intelligence summary.",
    tags: ["OSINT", "Phishing", "Indicators"],
    body: `# Phishing Infrastructure Triage

## Objective
Investigate a suspicious domain cluster and produce indicators that could be used for blocking, monitoring, or awareness training.

## Process
- Reviewed passive DNS, WHOIS details, certificate transparency, and URL patterns.
- Grouped related infrastructure by naming, hosting, and registration traits.
- Separated high-confidence indicators from weak associations.

## Deliverable
A short intelligence note with confidence levels, recommended blocks, and monitoring queries.`
  }
];

const backend = window.portfolioBackend || {};
const supabaseClient = backend.client;
const filesBucket = backend.bucket || "project-files";
const isAdminPage = document.body.dataset.page === "admin";
const projectCategories = ["Networking", "Cloud", "Cybersecurity", "Articles"];

const state = {
  content: normalizeContent(contentDefaults),
  toolkitRows: contentDefaults.toolkit.map((name, index) => ({
    id: `starter-tool-${index}`,
    name,
    sort_order: index + 1,
    source: "fallback"
  })),
  experienceRows: contentDefaults.experience.map((entry, index) => ({
    id: `starter-experience-${index}`,
    ...entry,
    sort_order: index + 1,
    source: "fallback"
  })),
  items: [],
  filter: "all",
  query: "",
  activeObjectUrl: null,
  user: null,
  isAdmin: false
};

const elements = {
  brandName: document.querySelector("#brandName"),
  heroTitle: document.querySelector("#heroTitle"),
  heroText: document.querySelector("#heroText"),
  adminLogin: document.querySelector("#adminLogin"),
  adminConsole: document.querySelector("#adminConsole"),
  workGrid: document.querySelector("#workGrid"),
  carouselStatus: document.querySelector("#carouselStatus"),
  prevProject: document.querySelector("#prevProject"),
  nextProject: document.querySelector("#nextProject"),
  cardTemplate: document.querySelector("#cardTemplate"),
  emptyState: document.querySelector("#emptyState"),
  projectCount: document.querySelector("#projectCount"),
  uploadCount: document.querySelector("#uploadCount"),
  toolkitGrid: document.querySelector("#toolkitGrid"),
  experienceList: document.querySelector("#experienceList"),
  searchInput: document.querySelector("#searchInput"),
  filterButtons: document.querySelectorAll(".filter-button"),
  uploadDialog: document.querySelector("#uploadDialog"),
  cmsDialog: document.querySelector("#cmsDialog"),
  authDialog: document.querySelector("#authDialog"),
  readerDialog: document.querySelector("#readerDialog"),
  openUpload: document.querySelector("#openUpload"),
  openCms: document.querySelector("#openCms"),
  closeUpload: document.querySelector("#closeUpload"),
  closeCms: document.querySelector("#closeCms"),
  closeAuth: document.querySelector("#closeAuth"),
  closeReader: document.querySelector("#closeReader"),
  uploadForm: document.querySelector("#uploadForm"),
  uploadTitle: document.querySelector("#uploadTitle"),
  saveProjectButton: document.querySelector("#saveProjectButton"),
  cmsForm: document.querySelector("#cmsForm"),
  authForm: document.querySelector("#authForm"),
  sendMagicLink: document.querySelector("#sendMagicLink"),
  requestPasswordReset: document.querySelector("#requestPasswordReset"),
  clearUploads: document.querySelector("#clearUploads"),
  formNote: document.querySelector("#formNote"),
  cmsNote: document.querySelector("#cmsNote"),
  authNote: document.querySelector("#authNote"),
  adminStatus: document.querySelector("#adminStatus"),
  logoutAdmin: document.querySelector("#logoutAdmin"),
  readerCategory: document.querySelector("#readerCategory"),
  readerTitle: document.querySelector("#readerTitle"),
  readerMeta: document.querySelector("#readerMeta"),
  readerBody: document.querySelector("#readerBody"),
  exportData: document.querySelector("#exportData"),
  exportDataCms: document.querySelector("#exportDataCms"),
  importData: document.querySelector("#importData"),
  openUploadFromCms: document.querySelector("#openUploadFromCms"),
  toolName: document.querySelector("#toolName"),
  addTool: document.querySelector("#addTool"),
  toolEditorList: document.querySelector("#toolEditorList"),
  experienceName: document.querySelector("#experienceName"),
  experienceDescription: document.querySelector("#experienceDescription"),
  addExperience: document.querySelector("#addExperience"),
  experienceEditorList: document.querySelector("#experienceEditorList"),
  contactPhone: document.querySelector("#contactPhone"),
  contactEmail: document.querySelector("#contactEmail")
};

function isBackendReady() {
  return Boolean(backend.isConfigured && backend.isConfigured() && supabaseClient);
}

function normalizeContent(content = {}) {
  const profile = {
    ...contentDefaults.profile,
    ...(content.profile || {})
  };
  const toolkit = Array.isArray(content.toolkit)
    ? content.toolkit.map(String).filter(Boolean)
    : contentDefaults.toolkit;
  const experience = Array.isArray(content.experience)
    ? content.experience
        .filter((item) => item && (item.title || item.description))
        .map((item) => ({
          title: String(item.title || "Experience").trim(),
          description: String(item.description || "").trim()
        }))
    : contentDefaults.experience;

  return {
    profile,
    showStarterProjects: content.showStarterProjects !== false,
    toolkit,
    experience
  };
}

function compactPhone(value = "") {
  return value.replace(/[^\d+]/g, "");
}

function setStatus(element, message) {
  if (element) {
    element.textContent = message;
  }
}

function getAuthErrorMessage(error) {
  const message = error?.message || "Login failed.";
  if (/invalid login credentials/i.test(message)) {
    return "Supabase rejected the email/password before the admin check. Confirm the Auth user exists, has a password set, and the email is confirmed.";
  }
  if (/email not confirmed/i.test(message)) {
    return "That email is not confirmed yet. Confirm it in Supabase Auth or disable email confirmation for this project.";
  }
  return message;
}

function cleanCredentialQuery() {
  if (!isAdminPage) {
    return;
  }

  const url = new URL(window.location.href);
  if (!url.searchParams.has("email") && !url.searchParams.has("password")) {
    return;
  }

  url.searchParams.delete("email");
  url.searchParams.delete("password");
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
}

function makeId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sanitizeFileName(value = "file") {
  return value.replace(/[^a-z0-9_.-]+/gi, "-").replace(/^-+|-+$/g, "") || "file";
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function inlineMarkdown(value = "") {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function markdownToHtml(markdown = "") {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let html = "";
  let listOpen = false;
  let orderedOpen = false;
  let codeOpen = false;
  let codeBuffer = [];

  function closeLists() {
    if (listOpen) {
      html += "</ul>";
      listOpen = false;
    }
    if (orderedOpen) {
      html += "</ol>";
      orderedOpen = false;
    }
  }

  function flushCode() {
    if (codeOpen) {
      html += `<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`;
      codeBuffer = [];
      codeOpen = false;
    }
  }

  lines.forEach((line) => {
    if (line.trim().startsWith("```")) {
      if (codeOpen) {
        flushCode();
      } else {
        closeLists();
        codeOpen = true;
      }
      return;
    }

    if (codeOpen) {
      codeBuffer.push(line);
      return;
    }

    if (!line.trim()) {
      closeLists();
      return;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      closeLists();
      const level = heading[1].length;
      html += `<h${level}>${inlineMarkdown(heading[2])}</h${level}>`;
      return;
    }

    const unordered = line.match(/^\s*[-*]\s+(.+)$/);
    if (unordered) {
      if (orderedOpen) {
        html += "</ol>";
        orderedOpen = false;
      }
      if (!listOpen) {
        html += "<ul>";
        listOpen = true;
      }
      html += `<li>${inlineMarkdown(unordered[1])}</li>`;
      return;
    }

    const ordered = line.match(/^\s*\d+\.\s+(.+)$/);
    if (ordered) {
      if (listOpen) {
        html += "</ul>";
        listOpen = false;
      }
      if (!orderedOpen) {
        html += "<ol>";
        orderedOpen = true;
      }
      html += `<li>${inlineMarkdown(ordered[1])}</li>`;
      return;
    }

    if (line.startsWith(">")) {
      closeLists();
      html += `<blockquote>${inlineMarkdown(line.replace(/^>\s?/, ""))}</blockquote>`;
      return;
    }

    closeLists();
    html += `<p>${inlineMarkdown(line)}</p>`;
  });

  flushCode();
  closeLists();
  return html;
}

function sanitizeHtml(input = "") {
  const documentFragment = new DOMParser().parseFromString(input, "text/html");
  const blockedSelectors = "script, iframe, object, embed, link, style, meta";

  documentFragment.querySelectorAll(blockedSelectors).forEach((node) => node.remove());
  documentFragment.body.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      const isDangerousUrl = ["href", "src"].includes(name) && value.startsWith("javascript:");

      if (name.startsWith("on") || name === "style" || name === "srcdoc" || isDangerousUrl) {
        node.removeAttribute(attribute.name);
      }
    });
  });

  return documentFragment.body.innerHTML;
}

function formatDate(value) {
  if (!value) {
    return "Recent";
  }

  const [year, month] = value.split("-");
  if (!year || !month) {
    return value;
  }

  const date = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(date);
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags;
  }

  return String(tags || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizeCategory(category) {
  const value = String(category || "").trim();
  return projectCategories.includes(value) ? value : "Cybersecurity";
}

function normalizeExternalUrl(value = "") {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return "";
  }

  try {
    const url = new URL(trimmed);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function rowToProject(row) {
  const item = {
    id: row.id,
    source: "remote",
    type: row.type || "post",
    title: row.title,
    category: normalizeCategory(row.category),
    date: row.project_month,
    summary: row.summary,
    tags: row.tags || [],
    body: row.body || "",
    filePath: row.file_path || "",
    fileName: row.file_name || "",
    mimeType: row.mime_type || "",
    externalUrl: row.external_url || "",
    createdAt: row.created_at
  };

  if (item.filePath && isBackendReady()) {
    item.fileUrl = supabaseClient.storage.from(filesBucket).getPublicUrl(item.filePath).data.publicUrl;
  }

  return item;
}

function projectToRow(item) {
  return {
    title: item.title,
    category: item.category,
    project_month: item.date,
    summary: item.summary,
    tags: normalizeTags(item.tags),
    type: item.type,
    body: item.body || null,
    file_path: item.filePath || null,
    file_name: item.fileName || null,
    mime_type: item.mimeType || null,
    external_url: normalizeExternalUrl(item.externalUrl) || null
  };
}

function renderToolkit() {
  if (!elements.toolkitGrid) {
    return;
  }

  elements.toolkitGrid.innerHTML = "";

  state.content.toolkit.forEach((tool) => {
    const item = document.createElement("span");
    item.textContent = tool;
    elements.toolkitGrid.append(item);
  });
}

function renderExperience() {
  if (!elements.experienceList) {
    return;
  }

  elements.experienceList.innerHTML = "";

  state.content.experience.forEach((item, index) => {
    const article = document.createElement("article");
    const number = document.createElement("span");
    const content = document.createElement("div");
    const title = document.createElement("h3");
    const description = document.createElement("p");

    number.textContent = String(index + 1).padStart(2, "0");
    title.textContent = item.title;
    description.textContent = item.description;
    content.append(title, description);
    article.append(number, content);
    elements.experienceList.append(article);
  });
}

function renderEditorList(container, items, type) {
  container.innerHTML = "";

  items.forEach((item, index) => {
    const row = document.createElement("div");
    const content = document.createElement("div");
    const title = document.createElement("strong");
    const remove = document.createElement("button");

    row.className = "editor-item";
    remove.type = "button";
    remove.textContent = "Remove";
    remove.dataset[`${type}Id`] = item.id;

    if (type === "tool") {
      title.textContent = item.name;
      content.append(title);
    } else {
      const description = document.createElement("p");
      title.textContent = item.title;
      description.textContent = item.description;
      content.append(title, description);
    }

    if (item.source === "fallback") {
      remove.disabled = true;
      remove.title = "Configure content editing to change this starter item.";
    }

    row.append(content, remove);
    container.append(row);
  });
}

function renderCmsEditor() {
  renderEditorList(elements.toolEditorList, state.toolkitRows, "tool");
  renderEditorList(elements.experienceEditorList, state.experienceRows, "experience");
}

function populateCmsForm() {
  const form = elements.cmsForm;
  form.elements.profileName.value = state.content.profile.name;
  form.elements.profilePhone.value = state.content.profile.phone;
  form.elements.profileEmail.value = state.content.profile.email;
  form.elements.profileHeadline.value = state.content.profile.headline;
  form.elements.profileIntro.value = state.content.profile.intro;
  form.elements.showStarterProjects.checked = state.content.showStarterProjects;
  renderCmsEditor();
  updateAdminUi();
}

function resetProjectForm() {
  elements.uploadForm.reset();
  elements.uploadForm.elements.projectId.value = "";
  elements.uploadTitle.textContent = "Upload a PDF or blog post";
  elements.saveProjectButton.textContent = "Save Preview";
  elements.formNote.textContent = "";
}

function populateProjectForm(item) {
  resetProjectForm();
  elements.uploadForm.elements.projectId.value = item.id;
  elements.uploadForm.elements.title.value = item.title;
  elements.uploadForm.elements.category.value = normalizeCategory(item.category);
  elements.uploadForm.elements.date.value = item.date;
  elements.uploadForm.elements.tags.value = normalizeTags(item.tags).join(", ");
  elements.uploadForm.elements.summary.value = item.summary;
  elements.uploadForm.elements.externalUrl.value = item.externalUrl || "";
  elements.uploadForm.elements.body.value = item.type === "pdf" ? "" : item.body || "";
  elements.uploadTitle.textContent = "Edit project or writeup";
  elements.saveProjectButton.textContent = "Update Project";
  elements.formNote.textContent =
    item.type === "pdf" ? "Leave the file field empty to keep the current PDF." : "Update the body or upload a replacement file.";
}

function renderContent() {
  const { profile } = state.content;
  if (elements.brandName) {
    elements.brandName.textContent = "Ezekiel's Portfolio";
  }
  if (elements.heroTitle) {
    elements.heroTitle.textContent = profile.headline;
  }
  if (elements.heroText) {
    elements.heroText.textContent = profile.intro;
  }
  if (elements.contactPhone) {
    elements.contactPhone.href = `tel:${compactPhone(profile.phone)}`;
    elements.contactPhone.textContent = `Call ${profile.phone}`;
  }
  if (elements.contactEmail) {
    elements.contactEmail.href = `mailto:${profile.email}`;
    elements.contactEmail.textContent = `Email ${profile.email}`;
  }
  renderToolkit();
  renderExperience();
}

function updateAdminUi() {
  if (!isAdminPage) {
    return;
  }

  const showConsole = Boolean(state.isAdmin);
  if (elements.adminLogin) {
    elements.adminLogin.hidden = showConsole;
  }
  if (elements.adminConsole) {
    elements.adminConsole.hidden = !showConsole;
  }

  if (!isBackendReady()) {
    setStatus(elements.adminStatus, "Configure the content connection before editing.");
    setStatus(elements.authNote, "Sign-in is not available until Supabase is configured.");
    if (elements.openCms) {
      elements.openCms.textContent = "Content Studio";
    }
    if (elements.openUpload) {
      elements.openUpload.disabled = true;
    }
    if (elements.logoutAdmin) {
      elements.logoutAdmin.hidden = true;
    }
    return;
  }

  if (elements.openUpload) {
    elements.openUpload.disabled = false;
  }
  if (state.isAdmin) {
    setStatus(elements.adminStatus, `Logged in as ${state.user.email}.`);
    setStatus(elements.authNote, "");
    if (elements.openCms) {
      elements.openCms.textContent = "Content Studio";
    }
    if (elements.logoutAdmin) {
      elements.logoutAdmin.hidden = false;
    }
  } else if (state.user) {
    setStatus(elements.adminStatus, "This account is not listed in admin_users.");
    setStatus(elements.authNote, "This login is valid, but the user is not authorized for this admin console.");
    if (elements.openCms) {
      elements.openCms.textContent = "Admin Login";
    }
    if (elements.logoutAdmin) {
      elements.logoutAdmin.hidden = false;
    }
  } else {
    setStatus(elements.adminStatus, "Log in with your admin account to edit.");
    if (elements.openCms) {
      elements.openCms.textContent = "Admin Login";
    }
    if (elements.logoutAdmin) {
      elements.logoutAdmin.hidden = true;
    }
  }
}

async function loadRemoteContent() {
  if (!isBackendReady()) {
    renderContent();
    return;
  }

  const [profileResult, toolkitResult, experienceResult] = await Promise.all([
    supabaseClient.from("profile").select("*").eq("id", 1).maybeSingle(),
    supabaseClient.from("toolkit_items").select("*").order("sort_order", { ascending: true }),
    supabaseClient.from("experience_entries").select("*").order("sort_order", { ascending: true })
  ]);

  if (profileResult.error) {
    throw profileResult.error;
  }
  if (toolkitResult.error) {
    throw toolkitResult.error;
  }
  if (experienceResult.error) {
    throw experienceResult.error;
  }

  const profile = profileResult.data
    ? {
        name: profileResult.data.name,
        phone: profileResult.data.phone,
        email: profileResult.data.email,
        headline: profileResult.data.headline,
        intro: profileResult.data.intro
      }
    : contentDefaults.profile;

  state.toolkitRows =
    toolkitResult.data && toolkitResult.data.length
      ? toolkitResult.data
      : contentDefaults.toolkit.map((name, index) => ({
          id: `starter-tool-${index}`,
          name,
          sort_order: index + 1,
          source: "fallback"
        }));

  state.experienceRows =
    experienceResult.data && experienceResult.data.length
      ? experienceResult.data
      : contentDefaults.experience.map((entry, index) => ({
          id: `starter-experience-${index}`,
          ...entry,
          sort_order: index + 1,
          source: "fallback"
        }));

  state.content = normalizeContent({
    profile,
    showStarterProjects: profileResult.data ? profileResult.data.show_starter_projects : true,
    toolkit: state.toolkitRows.map((item) => item.name),
    experience: state.experienceRows.map((item) => ({
      title: item.title,
      description: item.description
    }))
  });

  renderContent();
}

async function refreshAuthState() {
  if (!isBackendReady()) {
    state.user = null;
    state.isAdmin = false;
    updateAdminUi();
    return;
  }

  const { data } = await supabaseClient.auth.getSession();
  state.user = data.session ? data.session.user : null;
  state.isAdmin = false;

  if (state.user) {
    const { data: isAdmin, error } = await supabaseClient.rpc("is_admin");
    state.isAdmin = !error && Boolean(isAdmin);
  }

  updateAdminUi();
  renderCards();
}

async function ensureAdmin() {
  if (!isBackendReady()) {
    window.alert("Content editing is not configured yet.");
    return false;
  }

  await refreshAuthState();

  if (!state.user) {
    if (elements.authDialog) {
      elements.authDialog.showModal();
    } else if (elements.authForm) {
      elements.authForm.scrollIntoView({ behavior: "smooth", block: "center" });
      elements.authForm.querySelector("input")?.focus();
    }
    return false;
  }

  if (!state.isAdmin) {
    window.alert("You are logged in, but this account is not in the admin_users table.");
    return false;
  }

  return true;
}

function getFilteredItems() {
  const query = state.query.trim().toLowerCase();

  return state.items.filter((item) => {
    const matchesFilter = state.filter === "all" || item.category === state.filter;
    const searchable = [
      item.title,
      item.category,
      item.summary,
      normalizeTags(item.tags).join(" "),
      item.body || "",
      item.fileName || ""
    ]
      .join(" ")
      .toLowerCase();

    return matchesFilter && (!query || searchable.includes(query));
  });
}

function makePreview(type, title) {
  const preview = document.createElement("div");
  preview.className = `preview-document ${type === "pdf" ? "pdf-preview" : ""}`;
  preview.innerHTML = `
    <strong>${escapeHtml(type === "pdf" ? "PDF REPORT" : "WRITEUP")}</strong>
    <span></span>
    <span></span>
    <span></span>
    <small>${escapeHtml(title.slice(0, 42))}</small>
  `;
  return preview;
}

function renderCards() {
  const filteredItems = getFilteredItems();
  elements.workGrid.innerHTML = "";
  elements.emptyState.hidden = filteredItems.length > 0;

  filteredItems.forEach((item) => {
    const fragment = elements.cardTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".work-card");
    const hitbox = fragment.querySelector(".card-hitbox");
    const previewFrame = fragment.querySelector(".preview-frame");
    const category = fragment.querySelector(".category-pill");
    const date = fragment.querySelector(".date-pill");
    const title = fragment.querySelector("h3");
    const summary = fragment.querySelector("p");
    const tags = fragment.querySelector(".tag-row");
    const actions = fragment.querySelector(".card-actions");

    card.dataset.id = item.id;
    hitbox.dataset.id = item.id;
    category.textContent = item.category;
    date.textContent = formatDate(item.date);
    title.textContent = item.title;
    summary.textContent = item.summary;
    previewFrame.append(makePreview(item.type, item.title));

    normalizeTags(item.tags)
      .slice(0, 4)
      .forEach((tag) => {
        const tagElement = document.createElement("span");
        tagElement.textContent = tag;
        tags.append(tagElement);
      });

    if (isAdminPage && item.source === "remote" && state.isAdmin) {
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "edit-card-button";
      editButton.dataset.editId = item.id;
      editButton.textContent = "Edit";

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.dataset.deleteId = item.id;
      deleteButton.textContent = "Delete";
      actions.append(editButton, deleteButton);
    }

    elements.workGrid.append(fragment);
  });

  if (elements.projectCount) {
    elements.projectCount.textContent = state.items.length.toString();
  }
  if (elements.uploadCount) {
    elements.uploadCount.textContent = state.items.filter((item) => item.source === "remote").length.toString();
  }
  elements.workGrid.scrollLeft = 0;
  requestAnimationFrame(updateCarouselControls);
}

function getCarouselMetrics() {
  const card = elements.workGrid.querySelector(".work-card");
  const styles = window.getComputedStyle(elements.workGrid);
  const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;

  if (!card) {
    return {
      cardCount: 0,
      cardStep: 0,
      visibleCount: 0,
      maxScroll: 0
    };
  }

  const cardWidth = card.getBoundingClientRect().width;
  const cardStep = cardWidth + gap;
  const visibleCount = Math.max(1, Math.floor((elements.workGrid.clientWidth + gap) / cardStep));
  const maxScroll = Math.max(0, elements.workGrid.scrollWidth - elements.workGrid.clientWidth);

  return {
    cardCount: elements.workGrid.querySelectorAll(".work-card").length,
    cardStep,
    visibleCount,
    maxScroll
  };
}

function updateCarouselControls() {
  const { cardCount, cardStep, visibleCount, maxScroll } = getCarouselMetrics();
  const hasOverflow = maxScroll > 2;
  const scrollLeft = elements.workGrid.scrollLeft;

  elements.prevProject.disabled = !hasOverflow || scrollLeft <= 2;
  elements.nextProject.disabled = !hasOverflow || scrollLeft >= maxScroll - 2;

  if (!cardCount) {
    elements.carouselStatus.textContent = "";
    return;
  }

  const currentIndex = cardStep ? Math.round(scrollLeft / cardStep) : 0;
  const start = Math.min(cardCount, currentIndex + 1);
  const end = Math.min(cardCount, start + visibleCount - 1);
  elements.carouselStatus.textContent = start === end ? `${start} of ${cardCount}` : `${start}-${end} of ${cardCount}`;
}

function scrollProjects(direction) {
  const { cardStep, visibleCount } = getCarouselMetrics();
  if (!cardStep) {
    return;
  }

  elements.workGrid.scrollBy({
    left: direction * cardStep * visibleCount,
    behavior: "smooth"
  });
}

let carouselUpdateFrame = 0;

function scheduleCarouselUpdate() {
  if (carouselUpdateFrame) {
    return;
  }

  carouselUpdateFrame = requestAnimationFrame(() => {
    carouselUpdateFrame = 0;
    updateCarouselControls();
  });
}

async function refreshItems() {
  if (!isBackendReady()) {
    state.items = state.content.showStarterProjects ? [...starterWork] : [];
    renderCards();
    return;
  }

  const { data, error } = await supabaseClient
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const remoteItems = (data || []).map(rowToProject);
  state.items = remoteItems.length || !state.content.showStarterProjects ? remoteItems : [...starterWork];
  renderCards();
}

function getItemById(id) {
  return state.items.find((item) => item.id === id);
}

function releaseActiveObjectUrl() {
  if (state.activeObjectUrl) {
    URL.revokeObjectURL(state.activeObjectUrl);
    state.activeObjectUrl = null;
  }
}

function renderReader(item) {
  releaseActiveObjectUrl();
  elements.readerTitle.textContent = item.title;
  elements.readerCategory.textContent = item.category;
  elements.readerMeta.innerHTML = "";
  elements.readerBody.innerHTML = "";

  [formatDate(item.date), item.source === "remote" ? "Uploaded" : "Starter", ...normalizeTags(item.tags)].forEach(
    (value) => {
      const pill = document.createElement("span");
      pill.textContent = value;
      elements.readerMeta.append(pill);
    }
  );

  const externalUrl = normalizeExternalUrl(item.externalUrl);
  if (externalUrl) {
    const fullWriteup = document.createElement("a");
    fullWriteup.className = "download-link reader-download";
    fullWriteup.href = externalUrl;
    fullWriteup.target = "_blank";
    fullWriteup.rel = "noopener noreferrer";
    fullWriteup.textContent = "Read full writeup";
    elements.readerBody.append(fullWriteup);
  }

  if (item.type === "pdf" && item.fileUrl) {
    const download = document.createElement("a");
    download.className = "download-link reader-download";
    download.href = item.fileUrl;
    download.target = "_blank";
    download.rel = "noopener";
    download.textContent = "Open PDF";

    const iframe = document.createElement("iframe");
    iframe.title = `${item.title} PDF preview`;
    iframe.src = item.fileUrl;

    elements.readerBody.append(download, iframe);
  } else {
    const article = document.createElement("div");
    article.className = "article-content";
    article.innerHTML = item.type === "html" ? sanitizeHtml(item.body) : markdownToHtml(item.body || item.summary);
    elements.readerBody.append(article);
  }

  elements.readerDialog.showModal();
}

async function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function isPdfFile(file) {
  return file && (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));
}

function isHtmlFile(file) {
  return file && (file.type === "text/html" || file.name.toLowerCase().endsWith(".html"));
}

async function uploadProjectFile(file) {
  const path = `${makeId()}-${sanitizeFileName(file.name)}`;
  const { error } = await supabaseClient.storage.from(filesBucket).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || "application/octet-stream",
    upsert: false
  });

  if (error) {
    throw error;
  }

  return path;
}

async function insertProject(item) {
  const { error } = await supabaseClient.from("projects").insert(projectToRow(item));
  if (error) {
    throw error;
  }
}

async function updateProject(id, item) {
  const { error } = await supabaseClient.from("projects").update(projectToRow(item)).eq("id", id);
  if (error) {
    throw error;
  }
}

async function handleUpload(event) {
  event.preventDefault();

  if (!(await ensureAdmin())) {
    return;
  }

  const formData = new FormData(elements.uploadForm);
  const projectId = String(formData.get("projectId") || "");
  const existingProject = projectId ? getItemById(projectId) : null;
  const file = formData.get("file");
  const pastedBody = String(formData.get("body") || "").trim();
  const externalUrl = normalizeExternalUrl(formData.get("externalUrl"));
  const title = String(formData.get("title") || "").trim();
  const summary = String(formData.get("summary") || "").trim();

  if (!title || !summary) {
    elements.formNote.textContent = "Add a title and summary first.";
    return;
  }

  if (String(formData.get("externalUrl") || "").trim() && !externalUrl) {
    elements.formNote.textContent = "Use a valid http or https link for the full writeup.";
    return;
  }

  if ((!file || !file.name) && !pastedBody && !externalUrl && !existingProject) {
    elements.formNote.textContent = "Add a highlight, paste an article, upload a file, or attach a Substack link.";
    return;
  }

  const upload = {
    type: existingProject ? existingProject.type : file && file.name && isPdfFile(file) ? "pdf" : file && file.name && isHtmlFile(file) ? "html" : "post",
    title,
    category: normalizeCategory(formData.get("category")),
    date: String(formData.get("date")),
    summary,
    tags: normalizeTags(formData.get("tags")),
    body: existingProject ? existingProject.body || "" : "",
    filePath: existingProject ? existingProject.filePath || "" : "",
    fileName: existingProject ? existingProject.fileName || "" : "",
    mimeType: existingProject ? existingProject.mimeType || "" : "",
    externalUrl
  };
  let uploadedFilePath = "";

  try {
    const oldFilePath = existingProject ? existingProject.filePath : "";

    if (file && file.name) {
      upload.fileName = file.name;
      upload.mimeType = file.type || "application/octet-stream";

      if (isPdfFile(file)) {
        upload.type = "pdf";
        upload.filePath = await uploadProjectFile(file);
        uploadedFilePath = upload.filePath;
        upload.body = "";
      } else {
        upload.type = isHtmlFile(file) ? "html" : "post";
        upload.body = await readFileAsText(file);
        upload.filePath = "";
        upload.fileName = "";
        upload.mimeType = "";
      }
    } else if (pastedBody) {
      upload.type = existingProject && existingProject.type === "html" ? "html" : "post";
      upload.body = pastedBody;
      upload.filePath = "";
      upload.fileName = "";
      upload.mimeType = "";
    }

    if (projectId) {
      await updateProject(projectId, upload);
      if (oldFilePath && oldFilePath !== upload.filePath) {
        await supabaseClient.storage.from(filesBucket).remove([oldFilePath]);
      }
    } else {
      await insertProject(upload);
    }

    resetProjectForm();
    elements.formNote.textContent = projectId ? "Project updated." : "Saved. The preview is now in your library.";
    await refreshItems();
  } catch (error) {
    console.error(error);
    elements.formNote.textContent = "The project could not be saved. Check your content policies and connection.";
    if (uploadedFilePath) {
      await supabaseClient.storage.from(filesBucket).remove([uploadedFilePath]);
    }
  }
}

function dataUrlToBlob(dataUrl) {
  const [meta, base64] = dataUrl.split(",");
  const mimeMatch = meta.match(/data:([^;]+);base64/);
  const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mime });
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function exportPortfolioData() {
  const payload = {
    exportedAt: new Date().toISOString(),
    content: state.content,
    toolkit: state.toolkitRows.filter((item) => item.source !== "fallback"),
    experience: state.experienceRows.filter((item) => item.source !== "fallback"),
    projects: state.items.filter((item) => item.source === "remote").map(projectToRow)
  };

  downloadJson("cybersecurity-portfolio-supabase-backup.json", payload);
}

async function replaceToolkit(names = []) {
  const { error: deleteError } = await supabaseClient.from("toolkit_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (deleteError) {
    throw deleteError;
  }

  if (!names.length) {
    return;
  }

  const { error } = await supabaseClient.from("toolkit_items").insert(
    names.map((name, index) => ({
      name,
      sort_order: index + 1
    }))
  );

  if (error) {
    throw error;
  }
}

async function replaceExperience(entries = []) {
  const { error: deleteError } = await supabaseClient
    .from("experience_entries")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (deleteError) {
    throw deleteError;
  }

  if (!entries.length) {
    return;
  }

  const { error } = await supabaseClient.from("experience_entries").insert(
    entries.map((entry, index) => ({
      title: entry.title,
      description: entry.description,
      sort_order: index + 1
    }))
  );

  if (error) {
    throw error;
  }
}

async function importPortfolioData(file) {
  if (!file || !(await ensureAdmin())) {
    return;
  }

  const text = await readFileAsText(file);
  const payload = JSON.parse(text);
  const content = normalizeContent(payload.content || {});

  const { error: profileError } = await supabaseClient.from("profile").upsert(
    {
      id: 1,
      name: content.profile.name,
      phone: content.profile.phone,
      email: content.profile.email,
      headline: content.profile.headline,
      intro: content.profile.intro,
      show_starter_projects: content.showStarterProjects
    },
    { onConflict: "id" }
  );

  if (profileError) {
    throw profileError;
  }

  await replaceToolkit(content.toolkit);
  await replaceExperience(content.experience);

  const importedProjects = payload.projects || payload.items || [];
  for (const project of importedProjects) {
    if (project.source === "sample") {
      continue;
    }

    const item = {
      title: project.title,
      category: project.category,
      date: project.project_month || project.date,
      summary: project.summary,
      tags: normalizeTags(project.tags),
      type: project.type || "post",
      body: project.body || "",
      filePath: project.file_path || project.filePath || "",
      fileName: project.file_name || project.fileName || "",
      mimeType: project.mime_type || project.mimeType || "",
      externalUrl: project.external_url || project.externalUrl || ""
    };

    if (project.fileDataUrl && item.type === "pdf") {
      const blob = dataUrlToBlob(project.fileDataUrl);
      const name = item.fileName || `${sanitizeFileName(item.title)}.pdf`;
      item.filePath = await uploadProjectFile(new File([blob], name, { type: item.mimeType || "application/pdf" }));
      item.fileName = name;
    }

    await insertProject(item);
  }

  await loadRemoteContent();
  await refreshItems();
}

async function deleteProject(id) {
  if (!(await ensureAdmin())) {
    return;
  }

  const item = getItemById(id);
  if (!item || item.source !== "remote") {
    return;
  }

  const confirmed = window.confirm(`Delete "${item.title}" from your content library?`);
  if (!confirmed) {
    return;
  }

  const { error } = await supabaseClient.from("projects").delete().eq("id", id);
  if (error) {
    window.alert("The project could not be deleted.");
    console.error(error);
    return;
  }

  if (item.filePath) {
    await supabaseClient.storage.from(filesBucket).remove([item.filePath]);
  }

  await refreshItems();
}

async function clearProjects() {
  if (!(await ensureAdmin())) {
    return;
  }

  const confirmed = window.confirm("Remove all projects and writeups from your content library?");
  if (!confirmed) {
    return;
  }

  const filePaths = state.items.filter((item) => item.source === "remote" && item.filePath).map((item) => item.filePath);
  const { error } = await supabaseClient.from("projects").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    console.error(error);
    elements.formNote.textContent = "The projects could not be cleared.";
    return;
  }

  if (filePaths.length) {
    await supabaseClient.storage.from(filesBucket).remove(filePaths);
  }

  elements.formNote.textContent = "Projects cleared.";
  await refreshItems();
}

async function saveProfileFromCms() {
  const form = elements.cmsForm.elements;
  const row = {
    id: 1,
    name: form.profileName.value.trim() || contentDefaults.profile.name,
    phone: form.profilePhone.value.trim() || contentDefaults.profile.phone,
    email: form.profileEmail.value.trim() || contentDefaults.profile.email,
    headline: form.profileHeadline.value.trim() || contentDefaults.profile.headline,
    intro: form.profileIntro.value.trim() || contentDefaults.profile.intro,
    show_starter_projects: form.showStarterProjects.checked
  };

  const { error } = await supabaseClient.from("profile").upsert(row, { onConflict: "id" });
  if (error) {
    throw error;
  }

  await loadRemoteContent();
  await refreshItems();
  populateCmsForm();
}

async function addTool() {
  const value = elements.toolName.value.trim();
  if (!value) {
    elements.cmsNote.textContent = "Add a tool name first.";
    return;
  }

  if (!(await ensureAdmin())) {
    return;
  }

  const { error } = await supabaseClient.from("toolkit_items").insert({
    name: value,
    sort_order: state.toolkitRows.length + 1
  });

  if (error) {
    console.error(error);
    elements.cmsNote.textContent = "That service tag could not be added.";
    return;
  }

  elements.toolName.value = "";
  await loadRemoteContent();
  populateCmsForm();
  elements.cmsNote.textContent = "Tool added.";
}

async function addExperience() {
  const title = elements.experienceName.value.trim();
  const description = elements.experienceDescription.value.trim();
  if (!title || !description) {
    elements.cmsNote.textContent = "Add an experience title and description.";
    return;
  }

  if (!(await ensureAdmin())) {
    return;
  }

  const { error } = await supabaseClient.from("experience_entries").insert({
    title,
    description,
    sort_order: state.experienceRows.length + 1
  });

  if (error) {
    console.error(error);
    elements.cmsNote.textContent = "That experience could not be added.";
    return;
  }

  elements.experienceName.value = "";
  elements.experienceDescription.value = "";
  await loadRemoteContent();
  populateCmsForm();
  elements.cmsNote.textContent = "Experience added.";
}

async function deleteTool(id) {
  if (!(await ensureAdmin()) || id.startsWith("starter-")) {
    return;
  }

  const { error } = await supabaseClient.from("toolkit_items").delete().eq("id", id);
  if (error) {
    console.error(error);
    elements.cmsNote.textContent = "That service tag could not be removed.";
    return;
  }

  await loadRemoteContent();
  populateCmsForm();
  elements.cmsNote.textContent = "Tool removed.";
}

async function deleteExperience(id) {
  if (!(await ensureAdmin()) || id.startsWith("starter-")) {
    return;
  }

  const { error } = await supabaseClient.from("experience_entries").delete().eq("id", id);
  if (error) {
    console.error(error);
    elements.cmsNote.textContent = "That experience could not be removed.";
    return;
  }

  await loadRemoteContent();
  populateCmsForm();
  elements.cmsNote.textContent = "Experience removed.";
}

function bindEvents() {
  if (elements.openUpload) {
    elements.openUpload.addEventListener("click", async () => {
      if (await ensureAdmin()) {
        resetProjectForm();
        elements.uploadDialog.showModal();
      }
    });
  }

  if (elements.openCms) {
    elements.openCms.addEventListener("click", async () => {
      if (await ensureAdmin()) {
        populateCmsForm();
        elements.cmsDialog.showModal();
      }
    });
  }

  if (elements.closeUpload) {
    elements.closeUpload.addEventListener("click", () => {
      elements.uploadDialog.close();
    });
  }

  if (elements.closeCms) {
    elements.closeCms.addEventListener("click", () => {
      elements.cmsDialog.close();
    });
  }

  if (elements.closeAuth) {
    elements.closeAuth.addEventListener("click", () => {
      elements.authDialog.close();
    });
  }

  elements.closeReader.addEventListener("click", () => {
    elements.readerDialog.close();
  });

  elements.readerDialog.addEventListener("close", releaseActiveObjectUrl);

  if (elements.authForm) {
    elements.authForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!isBackendReady()) {
        elements.authNote.textContent = "Sign-in is not available yet.";
        return;
      }

      const formData = new FormData(elements.authForm);
      const email = String(formData.get("email") || "").trim();
      const password = String(formData.get("password") || "");

      if (!password) {
        elements.authNote.textContent = "Enter your password or use a magic link.";
        return;
      }

      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) {
        elements.authNote.textContent = getAuthErrorMessage(error);
        return;
      }

      await refreshAuthState();
      if (state.isAdmin) {
        populateCmsForm();
        return;
      }

      await supabaseClient.auth.signOut();
      state.user = null;
      state.isAdmin = false;
      updateAdminUi();
      elements.authNote.textContent = "Login succeeded, but this user is not in admin_users. Add the Supabase user id to admin_users, then try again.";
    });
  }

  if (elements.sendMagicLink) {
    elements.sendMagicLink.addEventListener("click", async () => {
      if (!isBackendReady()) {
        elements.authNote.textContent = "Sign-in is not available yet.";
        return;
      }

      const formData = new FormData(elements.authForm);
      const email = String(formData.get("email") || "").trim();
      if (!email) {
        elements.authNote.textContent = "Add your email first.";
        return;
      }

      const { error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.href }
      });

      elements.authNote.textContent = error ? getAuthErrorMessage(error) : "Magic link sent. Check your email.";
    });
  }

  if (elements.requestPasswordReset) {
    elements.requestPasswordReset.addEventListener("click", async () => {
      if (!isBackendReady()) {
        elements.authNote.textContent = "Password reset is not available yet.";
        return;
      }

      const formData = new FormData(elements.authForm);
      const email = String(formData.get("email") || "").trim();
      if (!email) {
        elements.authNote.textContent = "Add your email first.";
        return;
      }

      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin`
      });

      elements.authNote.textContent = error
        ? getAuthErrorMessage(error)
        : "Password reset sent. Use it if this Auth user does not have a password yet.";
    });
  }

  if (elements.logoutAdmin) {
    elements.logoutAdmin.addEventListener("click", async () => {
      if (isBackendReady()) {
        await supabaseClient.auth.signOut();
        await refreshAuthState();
        if (elements.cmsDialog?.open) {
          elements.cmsDialog.close();
        }
      }
    });
  }

  if (elements.uploadForm) {
    elements.uploadForm.addEventListener("submit", handleUpload);
  }

  if (elements.cmsForm) {
    elements.cmsForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!(await ensureAdmin())) {
        return;
      }

      try {
        await saveProfileFromCms();
        elements.cmsNote.textContent = "Profile saved.";
      } catch (error) {
        console.error(error);
        elements.cmsNote.textContent = "The profile could not be saved.";
      }
    });
  }

  if (elements.openUploadFromCms) {
    elements.openUploadFromCms.addEventListener("click", async () => {
      if (await ensureAdmin()) {
        resetProjectForm();
        elements.cmsDialog.close();
        elements.uploadDialog.showModal();
      }
    });
  }

  if (elements.addTool) {
    elements.addTool.addEventListener("click", addTool);
  }
  if (elements.addExperience) {
    elements.addExperience.addEventListener("click", addExperience);
  }

  if (elements.toolEditorList) {
    elements.toolEditorList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-tool-id]");
      if (button) {
        deleteTool(button.dataset.toolId);
      }
    });
  }

  if (elements.experienceEditorList) {
    elements.experienceEditorList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-experience-id]");
      if (button) {
        deleteExperience(button.dataset.experienceId);
      }
    });
  }

  elements.prevProject.addEventListener("click", () => scrollProjects(-1));
  elements.nextProject.addEventListener("click", () => scrollProjects(1));
  elements.workGrid.addEventListener("scroll", scheduleCarouselUpdate, { passive: true });
  window.addEventListener("resize", scheduleCarouselUpdate);

  elements.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value;
    renderCards();
  });

  elements.filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      elements.filterButtons.forEach((current) => current.classList.remove("active"));
      button.classList.add("active");
      state.filter = button.dataset.filter;
      renderCards();
    });
  });

  elements.workGrid.addEventListener("click", async (event) => {
    const editButton = event.target.closest("[data-edit-id]");
    if (editButton) {
      if (await ensureAdmin()) {
        const item = getItemById(editButton.dataset.editId);
        if (item) {
          populateProjectForm(item);
          elements.uploadDialog.showModal();
        }
      }
      return;
    }

    const deleteButton = event.target.closest("[data-delete-id]");
    if (deleteButton) {
      await deleteProject(deleteButton.dataset.deleteId);
      return;
    }

    const hitbox = event.target.closest(".card-hitbox");
    if (!hitbox) {
      return;
    }

    const item = getItemById(hitbox.dataset.id);
    if (item) {
      renderReader(item);
    }
  });

  if (elements.clearUploads) {
    elements.clearUploads.addEventListener("click", clearProjects);
  }
  if (elements.exportData) {
    elements.exportData.addEventListener("click", exportPortfolioData);
  }
  if (elements.exportDataCms) {
    elements.exportDataCms.addEventListener("click", exportPortfolioData);
  }
  if (elements.importData) {
    elements.importData.addEventListener("change", async (event) => {
      const [file] = event.target.files;
      try {
        await importPortfolioData(file);
      } catch (error) {
        window.alert("That import file could not be imported.");
        console.error(error);
      } finally {
        event.target.value = "";
      }
    });
  }

  if (isBackendReady()) {
    supabaseClient.auth.onAuthStateChange(async () => {
      await refreshAuthState();
    });
  }
}

async function init() {
  cleanCredentialQuery();
  bindEvents();
  await loadRemoteContent();
  renderContent();
  await refreshAuthState();
  await refreshItems();
}

init().catch((error) => {
  console.error(error);
  renderContent();
  updateAdminUi();
  elements.emptyState.hidden = false;
  elements.emptyState.textContent = "The portfolio could not load. Check your content connection.";
});
