document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const MEMBER_PASSWORD = "BigJigglyBalls";
  const MEMBERS_NUMBER = "(646) 444-4277";
  const MENU_JSON_PATH = "menu.json";

  const logoTrigger = document.getElementById("logoTrigger");
  const membersSection = document.getElementById("members");
  const toast = document.getElementById("toast");
  const pressureEl = document.getElementById("pressureLevel");
  const cultEl = document.getElementById("cultLine");
  const taglineEl = document.getElementById("taglineText");

  const gate = document.getElementById("gate");
  const memberContent = document.getElementById("memberContent");
  const passInput = document.getElementById("memberPass");
  const unlockBtn = document.getElementById("unlockBtn");
  const gateMsg = document.getElementById("gateMsg");

  const numberEl = document.getElementById("burnerNumber");
  const copyBtn = document.getElementById("copyBtn");
  const copyMsg = document.getElementById("copyMsg");
  const smsLink = document.getElementById("smsLink");

  const menuGrid = document.getElementById("menuGrid");
  const menuStatus = document.getElementById("menuStatus");

  const neonLeafContainer = document.getElementById("leafContainer");

  let isUnlocked = false;

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 1400);
  }

  function setPressure(state) {
    if (!pressureEl) return;
    pressureEl.textContent = `PRESSURE LEVEL: ${state}`;
  }

  showToast("JS ONLINE");

  // After Dark mode (10PM–5AM)
  const hour = new Date().getHours();
  const afterDark = (hour >= 22 || hour < 5);
  if (afterDark) {
    document.body.classList.add("after-dark");
    if (taglineEl) taglineEl.textContent = "After Hours Protocol Active.";
  }

  // Cult phrases
  const cultPhrases = afterDark
    ? ["We see you.", "Keep your voice low.", "Not everyone gets in.", "You weren’t supposed to find this."]
    : ["Members move in silence.", "Stay discreet.", "Access is earned.", "Say less."];

  function rotateCult() {
    if (!cultEl) return;
    cultEl.textContent = cultPhrases[Math.floor(Math.random() * cultPhrases.length)];
  }
  rotateCult();
  setInterval(rotateCult, 9000);

  // Hold logo to reveal members
  let holdTimer = null;
  let holding = false;

  function revealMembers() {
    if (!membersSection) return;
    membersSection.classList.remove("hidden");
    showToast("Members unlocked.");
    setPressure("ELEVATED");
    setTimeout(() => membersSection.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    setTimeout(() => passInput && passInput.focus(), 400);
  }

  function startHold(e) {
    if (e.type.startsWith("touch")) e.preventDefault();
    if (holding) return;
    holding = true;
    holdTimer = setTimeout(revealMembers, 1200);
  }

  function endHold() {
    holding = false;
    if (holdTimer) clearTimeout(holdTimer);
    holdTimer = null;
  }

  if (logoTrigger) {
    logoTrigger.addEventListener("touchstart", startHold, { passive: false });
    logoTrigger.addEventListener("touchend", endHold);
    logoTrigger.addEventListener("touchcancel", endHold);
    logoTrigger.addEventListener("mousedown", startHold);
    logoTrigger.addEventListener("mouseup", endHold);
    logoTrigger.addEventListener("mouseleave", endHold);
  }

  function setLockedUI() {
    isUnlocked = false;

    if (numberEl) numberEl.textContent = "••• ••• ••••";
    if (copyBtn) copyBtn.disabled = true;

    if (smsLink) {
      smsLink.classList.add("disabled");
      smsLink.setAttribute("aria-disabled", "true");
      smsLink.href = "#";
    }

    if (copyMsg) copyMsg.textContent = "";
    if (menuGrid) menuGrid.innerHTML = "";
    if (menuStatus) menuStatus.textContent = "";
  }

  function setUnlockedUI() {
    isUnlocked = true;

    if (gate) gate.classList.add("hidden");
    if (memberContent) memberContent.classList.remove("hidden");

    if (numberEl) numberEl.textContent = MEMBERS_NUMBER;
    if (copyBtn) copyBtn.disabled = false;

    if (smsLink) {
      smsLink.classList.remove("disabled");
      smsLink.removeAttribute("aria-disabled");
      smsLink.href = `sms:${encodeURIComponent(MEMBERS_NUMBER)}`;
    }

    showToast("Access granted.");
    setPressure("CLEARED");

    loadMenu();
  }

  setLockedUI();

  function isVideo(path = "") {
    return /\.(mp4|webm|ogg|mov)$/i.test(path);
  }

  function escapeHtml(s = "") {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[c]));
  }

  function normalizeCategory(cat = "") {
    const c = String(cat || "").trim();
    return c || "Other";
  }

  function categoryTitle(cat) {
    return normalizeCategory(cat).toUpperCase();
  }

  function groupByCategory(items) {
    const map = new Map();
    for (const it of items) {
      const cat = normalizeCategory(it.category);
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(it);
    }
    return map;
  }

  function renderCategoryHeader(cat) {
    const header = document.createElement("div");
    header.className = "menu-section";
    header.innerHTML = `
      <div class="menu-section-title">${escapeHtml(categoryTitle(cat))}</div>
      <div class="menu-section-line"></div>
    `;
    return header;
  }

  async function loadMenu() {
    if (!menuGrid || !menuStatus) return;

    menuStatus.textContent = "Loading menu…";
    menuGrid.innerHTML = "";

    try {
      const res = await fetch(MENU_JSON_PATH, { cache: "no-store" });
      if (!res.ok) throw new Error("menu.json not found");
      const data = await res.json();
      if (!Array.isArray(data.items)) throw new Error("menu.json invalid");

      if (data.items.length === 0) {
        menuStatus.textContent = "Menu is empty. Add items to menu.json.";
        return;
      }

      menuStatus.textContent = "";
      const grouped = groupByCategory(data.items);

      for (const [cat, items] of grouped.entries()) {
        menuGrid.appendChild(renderCategoryHeader(cat));

        for (const item of items) {
          const name = escapeHtml(item.name || "");
          const price = escapeHtml(item.price || "");
          const desc = escapeHtml(item.desc || item.description || "");
          const media = (item.media || "").trim();

          const card = document.createElement("div");
          card.className = "menu-item";

          let mediaHtml = "";
          if (media) {
            if (isVideo(media)) {
              mediaHtml = `
                <div class="menu-media">
                  <video controls playsinline preload="metadata" src="${escapeHtml(media)}"></video>
                </div>`;
            } else {
              mediaHtml = `
                <div class="menu-media">
                  <img loading="lazy" src="${escapeHtml(media)}" alt="${name}">
                </div>`;
            }
          }

          card.innerHTML = `
            <div class="menu-top">
              <div>
                <div class="menu-name">${name}</div>
                <div class="menu-cat">${escapeHtml(cat)}</div>
              </div>
              <div class="menu-price">${price}</div>
            </div>
            ${desc ? `<div class="menu-desc">${desc}</div>` : ""}
            ${mediaHtml}
          `;

          menuGrid.appendChild(card);
        }
      }
    } catch {
      menuStatus.textContent = "Menu failed to load. Check menu.json + commit.";
    }
  }

  function unlockAttempt() {
    const attempt = (passInput?.value || "").normalize("NFKC").trim();

    if (!attempt) {
      if (gateMsg) gateMsg.textContent = "Enter the password.";
      return;
    }

    if (attempt === MEMBER_PASSWORD) {
      if (gateMsg) gateMsg.textContent = "";
      setUnlockedUI();
      return;
    }

    if (gateMsg) gateMsg.textContent = "WRONG PASSWORD.";
    if (passInput) {
      passInput.value = "";
      passInput.focus();
    }
  }

  unlockBtn?.addEventListener("click", unlockAttempt);
  passInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") unlockAttempt();
  });

  copyBtn?.addEventListener("click", async () => {
    if (!isUnlocked) return;
    try {
      await navigator.clipboard.writeText(MEMBERS_NUMBER);
      if (copyMsg) copyMsg.textContent = "Copied.";
      setTimeout(() => { if (copyMsg) copyMsg.textContent = ""; }, 1200);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = MEMBERS_NUMBER;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      if (copyMsg) copyMsg.textContent = "Copied.";
      setTimeout(() => { if (copyMsg) copyMsg.textContent = ""; }, 1200);
    }
  });

  /* =========================================================
     LEAVES — realism + OBVIOUS wind gusts
  ========================================================= */
  if (neonLeafContainer) {
    const leafSVG = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
        <path fill="rgba(60,255,132,0.92)"
          d="M128 16c10 38 13 70 9 105 27-43 67-75 125-90-28 58-64 97-111 129
             52-10 99-7 141 11-52 37-99 50-141 47 31 30 53 72 58 142
             -58-31-93-73-116-118-23 45-58 87-116 118
             5-70 27-112 58-142-42 3-89-10-141-47
             42-18 89-21 141-11C67 128 31 89 3 31
             61 46 101 78 128 121c-4-35-1-67 0-105z"/>
        <path fill="rgba(0,0,0,0.16)"
          d="M128 40c8 30 8 58 4 88 22-29 50-49 88-61-21 39-45 64-78 83
             36-7 68-5 98 8-37 25-69 34-98 33 23 22 39 53 41 97
             -41-23-66-53-83-87-17 34-42 64-83 87 2-44 18-75 41-97
             -29 1-61-8-98-33 30-13 62-15 98-8-33-19-57-44-78-83
             38 12 66 32 88 61-4-30-4-58 4-88z"/>
      </svg>
    `;

    let gustUntil = 0;
    let gustStrength = 0;
    let nextGustAt = Date.now() + (8000 + Math.random() * 9000);

    function startGust() {
      const now = Date.now();
      const dir = Math.random() < 0.5 ? -1 : 1;

      gustStrength = dir * (220 + Math.random() * 260); // 220–480px
      gustUntil = now + (3500 + Math.random() * 2500);  // 3.5–6s
      nextGustAt = now + (14000 + Math.random() * 18000); // 14–32s

      if (pressureEl) {
        const prev = pressureEl.textContent;
        pressureEl.textContent = "PRESSURE LEVEL: WIND SHIFT";
        setTimeout(() => {
          if (pressureEl) pressureEl.textContent = prev || "PRESSURE LEVEL: STABLE";
        }, 1000);
      }
    }

    function maybeStartGust() {
      const now = Date.now();
      if (now >= nextGustAt && now >= gustUntil) startGust();
    }

    function spawnLeaf() {
      maybeStartGust();

      const leaf = document.createElement("div");
      leaf.className = "neon-leaf";
      leaf.innerHTML = leafSVG;

      const depth = Math.random(); // 0 far → 1 near

      const size = 12 + depth * 26;          // 12–38px (bigger = less blocky)
      const opacity = 0.05 + depth * 0.18;   // 0.05–0.23
      const blur = (1 - depth) * 1.2;        // 0–1.2px
      const duration = 11 + (1 - depth) * 18; // 11–29s

      const baseDrift = (Math.random() * 220 - 110);
      const now = Date.now();
      const gusting = now < gustUntil;

      const drift = (baseDrift + (gusting ? gustStrength : 0)).toFixed(0) + "px";
      const rot0 = (Math.random() * 360).toFixed(0) + "deg";
      const rot1 = (
        Math.random() * 720 - 360 +
        (gusting ? (Math.random() * 520 - 260) : 0)
      ).toFixed(0) + "deg";

      leaf.style.width = size + "px";
      leaf.style.height = size + "px";
      leaf.style.left = (Math.random() * 100) + "vw";

      leaf.style.setProperty("--drift", drift);
      leaf.style.setProperty("--rot0", rot0);
      leaf.style.setProperty("--rot1", rot1);

      leaf.style.animationDuration = duration + "s";
      leaf.style.opacity = opacity.toFixed(2);

      // slight hue variance: some greener, some slightly teal
      const hueShift = -8 + Math.random() * 14; // -8..+6
      const glowA = (0.12 + depth * 0.24).toFixed(2);
      const glowB = (0.06 + depth * 0.10).toFixed(2);

      leaf.style.filter =
        `hue-rotate(${hueShift.toFixed(0)}deg) ` +
        `drop-shadow(0 0 ${2 + depth * 5}px rgba(60,255,132,${glowA})) ` +
        `drop-shadow(0 0 ${6 + depth * 12}px rgba(60,255,132,${glowB})) ` +
        `blur(${blur.toFixed(2)}px)`;

      neonLeafContainer.appendChild(leaf);
      setTimeout(() => leaf.remove(), Math.ceil(duration * 1000) + 5000);
    }

    // initial burst
    for (let i = 0; i < 14; i++) setTimeout(spawnLeaf, i * 140);

    // steady rain
    setInterval(spawnLeaf, 600);
  }
});
