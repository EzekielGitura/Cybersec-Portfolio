const siteDefaults = {
  profile: {
    name: "Ezekiel's Portfolio",
    phone: "+254727550182",
    email: "gituraezekiel@gmail.com",
    headline: "Showcase incident response, security research, and hands-on labs.",
    intro:
      "A working portfolio hub for PDF reports, blog posts, project writeups, and experience notes. Add your own evidence, preview it in place, and let reviewers move through your work without leaving the site."
  },
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

const siteBackend = window.portfolioBackend || {};
const siteSupabase = siteBackend.client;

function siteBackendReady() {
  return Boolean(siteBackend.isConfigured && siteBackend.isConfigured() && siteSupabase);
}

function compactPhone(value = "") {
  return value.replace(/[^\d+]/g, "");
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = value;
  }
}

function setHref(selector, value) {
  const element = document.querySelector(selector);
  if (element) {
    element.href = value;
  }
}

function setTextAndHref(selector, text, href) {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = text;
    element.href = href;
  }
}

async function loadSiteContent() {
  if (!siteBackendReady()) {
    return siteDefaults;
  }

  const [profileResult, toolkitResult, experienceResult] = await Promise.all([
    siteSupabase.from("profile").select("*").eq("id", 1).maybeSingle(),
    siteSupabase.from("toolkit_items").select("name").order("sort_order", { ascending: true }),
    siteSupabase.from("experience_entries").select("title, description").order("sort_order", { ascending: true })
  ]);

  const profile = profileResult.data
    ? {
        ...siteDefaults.profile,
        name: profileResult.data.name,
        phone: profileResult.data.phone,
        email: profileResult.data.email,
        headline: profileResult.data.headline,
        intro: profileResult.data.intro
      }
    : siteDefaults.profile;

  return {
    profile,
    toolkit:
      toolkitResult.data && toolkitResult.data.length
        ? toolkitResult.data.map((item) => item.name)
        : siteDefaults.toolkit,
    experience:
      experienceResult.data && experienceResult.data.length ? experienceResult.data : siteDefaults.experience
  };
}

function renderExperience(items) {
  const list = document.querySelector("#experienceList");
  if (!list) {
    return;
  }

  list.innerHTML = "";
  items.forEach((item, index) => {
    const article = document.createElement("article");
    const number = document.createElement("span");
    const body = document.createElement("div");
    const title = document.createElement("h3");
    const description = document.createElement("p");

    number.textContent = String(index + 1).padStart(2, "0");
    title.textContent = item.title;
    description.textContent = item.description;
    body.append(title, description);
    article.append(number, body);
    list.append(article);
  });
}

function renderToolkit(items) {
  const grid = document.querySelector("#toolkitGrid");
  if (!grid) {
    return;
  }

  grid.innerHTML = "";
  items.forEach((tool) => {
    const item = document.createElement("span");
    item.textContent = tool;
    grid.append(item);
  });
}

async function initSite() {
  const content = await loadSiteContent();
  const { profile } = content;

  setText("#brandName", "Ezekiel's Portfolio");
  setText("#contactBrandName", "Ezekiel's Portfolio");
  setText("#heroTitle", profile.headline);
  setText("#heroText", profile.intro);
  setTextAndHref("#phoneDisplay", profile.phone, `tel:${compactPhone(profile.phone)}`);
  setTextAndHref("#emailDisplay", profile.email, `mailto:${profile.email}`);
  setHref("#phoneLink", `tel:${compactPhone(profile.phone)}`);
  setHref("#emailLink", `mailto:${profile.email}`);
  renderExperience(content.experience);
  renderToolkit(content.toolkit);
}

initSite().catch((error) => {
  console.error(error);
  renderExperience(siteDefaults.experience);
  renderToolkit(siteDefaults.toolkit);
});
