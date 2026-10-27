(() => {
  if (window.__trustbridgePill || document.getElementById("trustbridge-extension")) return;
  window.__trustbridgePill = true;

  const API = globalThis.TRUSTBRIDGE_API || "http://localhost:3000";
  const host = document.createElement("div");
  host.id = "trustbridge-extension";
  host.style.cssText = "position:fixed;z-index:2147483647;right:20px;bottom:20px;";
  const root = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    * { box-sizing: border-box; }
    .tb-wrap { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .tb-pill { align-items: center; background: #1b4d3e; border: 0; border-radius: 999px; box-shadow: 0 10px 30px rgba(23,35,31,.28); color: #fff; cursor: pointer; display: flex; font-size: 13px; font-weight: 600; gap: 8px; padding: 12px 16px 12px 12px; }
    .tb-pill:hover { background: #143d31; }
    .tb-mark { align-items: center; background: #d4ec6a; border-radius: 50%; color: #1b4d3e; display: inline-flex; font-family: Georgia, serif; font-size: 14px; font-style: italic; font-weight: 700; height: 22px; justify-content: center; width: 22px; }
    .tb-panel { background: #fbfaf6; border: 1px solid #d7d9d0; border-radius: 10px; bottom: 58px; box-shadow: 0 24px 80px rgba(23,35,31,.3); color: #17231f; max-height: min(700px, calc(100vh - 110px)); overflow: auto; padding: 18px; position: absolute; right: 0; width: 390px; }
    .tb-panel[hidden], .tb-result[hidden] { display: none; }
    .tb-head { align-items: center; display: flex; justify-content: space-between; }
    .tb-brand { align-items: center; display: flex; font-size: 15px; font-weight: 700; gap: 8px; letter-spacing: -.03em; }
    .tb-close { background: transparent; border: 0; color: #718079; cursor: pointer; font-size: 22px; line-height: 1; padding: 2px 4px; }
    .tb-source { color: #8b968e; font-family: 'DM Mono', ui-monospace, monospace; font-size: 9px; letter-spacing: .04em; margin: 8px 0 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .tb-form { display: grid; gap: 10px; }
    .tb-form label { color: #59675f; display: block; font-family: 'DM Mono', ui-monospace, monospace; font-size: 8px; letter-spacing: .06em; text-transform: uppercase; }
    .tb-form input, .tb-form textarea { background: transparent; border: 0; border-bottom: 1px solid #c9d0c7; color: #17231f; display: block; font-family: inherit; font-size: 12px; margin-top: 5px; outline: 0; padding: 6px 0; width: 100%; }
    .tb-form textarea { border: 1px solid #c9d0c7; line-height: 1.45; padding: 8px; resize: vertical; }
    .tb-form input:focus, .tb-form textarea:focus { border-color: #1b4d3e; }
    .tb-actions { display: grid; gap: 7px; grid-template-columns: 1fr 1fr; margin-top: 4px; }
    .tb-run, .tb-demo { border: 0; cursor: pointer; font-family: inherit; font-size: 11px; font-weight: 600; padding: 10px; }
    .tb-run { background: #1b4d3e; color: #fff; }
    .tb-run:disabled { cursor: wait; opacity: .65; }
    .tb-demo { background: #eef3d8; color: #1b4d3e; }
    .tb-result { border-top: 1px solid #e0e0d8; margin-top: 16px; padding-top: 14px; }
    .tb-result-top { align-items: center; display: flex; justify-content: space-between; margin-bottom: 10px; }
    .tb-outcome { border-radius: 2px; font-family: 'DM Mono', ui-monospace, monospace; font-size: 8px; letter-spacing: .06em; padding: 5px 7px; text-transform: uppercase; }
    .tb-verified { background: #e8f1cf; color: #3d6a34; }
    .tb-verified-with-conditions { background: #eef3d8; color: #4e6b2f; }
    .tb-undetermined { background: #f5efdf; color: #8a6a2f; }
    .tb-contradicted { background: #f6e5df; color: #984c40; }
    .tb-id { color: #9ba49b; font-family: 'DM Mono', ui-monospace, monospace; font-size: 8px; }
    .tb-result h2 { font-size: 21px; letter-spacing: -.05em; line-height: 1.05; margin: 0 0 8px; }
    .tb-summary { color: #627069; font-size: 11px; line-height: 1.55; margin: 0 0 10px; }
    .tb-decision { background: #f0f3e7; color: #4e6b2f; font-family: 'DM Mono', ui-monospace, monospace; font-size: 9px; line-height: 1.4; margin: 0 0 12px; padding: 9px; text-transform: uppercase; }
    .tb-label { color: #8b968e; font-family: 'DM Mono', ui-monospace, monospace; font-size: 8px; letter-spacing: .06em; margin: 12px 0 5px; text-transform: uppercase; }
    .tb-list { color: #68756d; font-size: 10px; line-height: 1.45; list-style: none; margin: 0; padding: 0; }
    .tb-list li { border-bottom: 1px dotted #e0e0d8; padding: 5px 0; }
    .tb-claims { display: grid; gap: 9px; margin-top: 12px; }
    .tb-claim { background: #faf8f1; border: 1px solid #e5e5de; padding: 11px; }
    .tb-claim-head { align-items: center; display: flex; justify-content: space-between; }
    .tb-claim-outcome { border-radius: 2px; font-family: 'DM Mono', ui-monospace, monospace; font-size: 7px; letter-spacing: .05em; padding: 3px 5px; text-transform: uppercase; }
    .tb-material { color: #9ba49b; font-family: 'DM Mono', ui-monospace, monospace; font-size: 7px; letter-spacing: .05em; }
    .tb-claim h3 { font-size: 12px; letter-spacing: -.02em; line-height: 1.3; margin: 8px 0 5px; }
    .tb-claim-why { color: #68756d; font-size: 10px; line-height: 1.45; margin: 0; }
    .tb-evidence { border-top: 1px dotted #e0e0d8; margin-top: 7px; padding-top: 6px; }
    .tb-evidence-meta { align-items: center; display: flex; flex-wrap: wrap; gap: 5px; }
    .tb-tier { border-radius: 2px; font-family: 'DM Mono', ui-monospace, monospace; font-size: 7px; padding: 2px 4px; }
    .tb-tier-e0 { background: #f1e7e1; color: #8a5b4d; }
    .tb-tier-e1 { background: #ece8f4; color: #63558a; }
    .tb-tier-e2 { background: #f5efdf; color: #8a6a2f; }
    .tb-tier-e3 { background: #e3efd7; color: #3d6a34; }
    .tb-timing, .tb-relation { color: #8b968e; font-family: 'DM Mono', ui-monospace, monospace; font-size: 7px; }
    .tb-relation-supports { color: #4e7943; }
    .tb-relation-contradicts { color: #a14d43; }
    .tb-evidence-label { color: #53615b; font-size: 9px; line-height: 1.4; margin: 5px 0 2px; }
    .tb-evidence blockquote { border-left: 2px solid #d7d9d0; color: #53615b; font-family: Georgia, serif; font-size: 10px; font-style: italic; line-height: 1.4; margin: 4px 0; padding-left: 7px; }
    .tb-link { border-bottom: 1px solid #c9d0c7; color: #1b4d3e; display: inline-block; font-size: 8px; margin-top: 3px; text-decoration: none; }
    .tb-disclaimer { border-top: 1px solid #e0e0d8; color: #8b968e; font-size: 8px; line-height: 1.45; margin: 12px 0 0; padding-top: 9px; }
    .tb-error { background: #f6e5df; color: #984c40; font-size: 10px; line-height: 1.45; padding: 9px; }
  `;
  root.appendChild(style);

  const wrap = document.createElement("div");
  wrap.className = "tb-wrap";
  root.appendChild(wrap);

  const pill = document.createElement("button");
  pill.className = "tb-pill";
  pill.type = "button";
  pill.innerHTML = '<span class="tb-mark">T</span><span>Check this offer</span>';
  wrap.appendChild(pill);

  const panel = document.createElement("section");
  panel.className = "tb-panel";
  panel.hidden = true;
  panel.setAttribute("aria-label", "TrustBridge verification");
  panel.innerHTML = `
    <header class="tb-head">
      <div class="tb-brand"><span class="tb-mark">T</span> trustbridge</div>
      <button class="tb-close" type="button" aria-label="Close">×</button>
    </header>
    <p class="tb-source"></p>
    <form class="tb-form">
      <label>Organisation<input name="organization" placeholder="e.g. Google" required /></label>
      <label>Their email<input name="counterpartyEmail" placeholder="name@company.com" /></label>
      <label>What did they promise?<textarea name="promise" rows="3" placeholder="Paste the offer or promise." required></textarea></label>
      <label>Official link<input name="officialUrl" placeholder="https://company.com/careers" /></label>
      <div class="tb-actions">
        <button class="tb-run" type="submit">Run verification</button>
        <button class="tb-demo" type="button">Load fake internship</button>
      </div>
    </form>
    <div class="tb-result" hidden></div>
  `;
  wrap.appendChild(panel);

  const form = panel.querySelector(".tb-form");
  const result = panel.querySelector(".tb-result");
  const source = panel.querySelector(".tb-source");
  const runButton = panel.querySelector(".tb-run");
  const demoButton = panel.querySelector(".tb-demo");
  const closeButton = panel.querySelector(".tb-close");

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function outcomeClass(outcome) {
    return "tb-" + outcome.toLowerCase().replaceAll("_", "-");
  }

  function offerNode() {
    return document.querySelector("[data-trustbridge-offer]");
  }

  function prefill() {
    const offer = offerNode();
    const selection = window.getSelection() ? window.getSelection().toString().trim() : "";
    const org = offer ? offer.getAttribute("data-trustbridge-org") || "" : "";
    const email = offer ? offer.getAttribute("data-trustbridge-email") || "" : "";
    const official = offer ? offer.getAttribute("data-trustbridge-official") || "" : "";
    const promise = (offer ? offer.innerText : selection || document.title || "").trim().slice(0, 4000);

    form.elements.organization.value = org;
    form.elements.counterpartyEmail.value = email;
    form.elements.officialUrl.value = official;
    form.elements.promise.value = promise;
    source.textContent = "Reading " + location.hostname + (offer ? " · demo offer" : selection ? " · selected text" : " · page title");
  }

  function fillDemo() {
    form.elements.organization.value = "Google";
    form.elements.counterpartyEmail.value = "hr.google.intern@gmail.com";
    form.elements.promise.value = "You are selected for a remote AI internship. Pay a ₹1,500 refundable registration fee within 24 hours to confirm your seat.";
    form.elements.officialUrl.value = "https://www.google.com/about/careers/applications/how-we-hire/";
    source.textContent = "Reading demo offer · Google AI internship";
  }

  function render(data) {
    result.hidden = false;
    result.innerHTML = "";

    const top = el("div", "tb-result-top");
    top.appendChild(el("span", "tb-outcome " + outcomeClass(data.outcome), data.outcome.replaceAll("_", " ")));
    top.appendChild(el("span", "tb-id", "#" + data.id.slice(0, 6).toUpperCase()));
    result.appendChild(top);
    result.appendChild(el("h2", "", data.headline));
    result.appendChild(el("p", "tb-summary", data.summary));
    result.appendChild(el("p", "tb-decision", "Recommended: " + data.decision.replaceAll("_", " ").toLowerCase()));

    if (data.conditions && data.conditions.length) {
      result.appendChild(el("p", "tb-label", "Conditions"));
      const list = el("ul", "tb-list");
      data.conditions.forEach((item) => list.appendChild(el("li", "", item)));
      result.appendChild(list);
    }

    if (data.couldNotDetermine && data.couldNotDetermine.length) {
      result.appendChild(el("p", "tb-label", "Could not determine"));
      const list = el("ul", "tb-list");
      data.couldNotDetermine.slice(0, 4).forEach((item) => list.appendChild(el("li", "", item)));
      result.appendChild(list);
    }

    const claims = el("div", "tb-claims");
    data.claims.forEach((claim) => {
      const card = el("article", "tb-claim");
      const head = el("div", "tb-claim-head");
      head.appendChild(el("span", "tb-claim-outcome " + outcomeClass(claim.outcome), claim.outcome.replaceAll("_", " ")));
      head.appendChild(el("span", "tb-material", claim.material ? "MATERIAL" : "CONTEXT"));
      card.appendChild(head);
      card.appendChild(el("h3", "", claim.text));
      card.appendChild(el("p", "tb-claim-why", claim.rationale));

      claim.evidence.forEach((evidence) => {
        const row = el("div", "tb-evidence");
        const meta = el("div", "tb-evidence-meta");
        meta.appendChild(el("span", "tb-tier tb-tier-" + evidence.tier.toLowerCase(), evidence.tier));
        meta.appendChild(el("span", "tb-timing", evidence.timing));
        meta.appendChild(el("span", "tb-relation tb-relation-" + evidence.relation.toLowerCase(), evidence.relation));
        row.appendChild(meta);
        row.appendChild(el("p", "tb-evidence-label", evidence.label));
        if (evidence.quote) row.appendChild(el("blockquote", "", "“" + evidence.quote + "”"));
        if (evidence.url) {
          const link = el("a", "tb-link", "Open source ↗");
          link.href = evidence.url;
          link.target = "_blank";
          link.rel = "noreferrer";
          row.appendChild(link);
        }
        card.appendChild(row);
      });

      claims.appendChild(card);
    });
    result.appendChild(claims);
    result.appendChild(el("p", "tb-disclaimer", data.disclaimer));
    panel.scrollTop = 0;
  }

  async function run() {
    const payload = {
      organization: form.elements.organization.value,
      counterpartyEmail: form.elements.counterpartyEmail.value,
      promise: form.elements.promise.value,
      officialUrl: form.elements.officialUrl.value,
      amount: "",
      evidenceText: "Captured from " + location.href,
    };

    runButton.disabled = true;
    runButton.textContent = "Checking…";
    try {
      const response = await fetch(API + "/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-trustbridge-extension": "1" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The check failed.");
      render(data);
    } catch (error) {
      result.hidden = false;
      result.innerHTML = "";
      result.appendChild(el("p", "tb-error", error && error.message ? error.message : "Could not reach TrustBridge. Is the app running on localhost:3000?"));
    } finally {
      runButton.disabled = false;
      runButton.textContent = "Run verification";
    }
  }

  pill.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    if (!panel.hidden) {
      prefill();
    }
  });

  closeButton.addEventListener("click", () => {
    panel.hidden = true;
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  demoButton.addEventListener("click", () => {
    fillDemo();
    run();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") panel.hidden = true;
  });

  document.body.appendChild(host);

  if (offerNode()) {
    window.setTimeout(() => {
      panel.hidden = false;
      prefill();
    }, 500);
  }
})();
