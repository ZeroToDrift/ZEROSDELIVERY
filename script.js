document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  try {
    const MEMBER_PASSWORD = "BigJigglyBalls";
    const MEMBERS_NUMBER = "(646) 444-4277";
    const MENU_JSON_PATH = "menu.json";

    // Public / vibe
    const logoTrigger = document.getElementById("logoTrigger");
    const membersSection = document.getElementById("members");
    const toast = document.getElementById("toast");
    const pressureEl = document.getElementById("pressureLevel");
    const cultEl = document.getElementById("cultLine");
    const taglineEl = document.getElementById("taglineText");

    // Gate + members content
    const gate = document.getElementById("gate");
    const memberContent = document.getElementById("memberContent");
    const passInput = document.getElementById("memberPass");
    const unlockBtn = document.getElementById("unlockBtn");
    const gateMsg = document.getElementById("gateMsg");

    // Number + actions
    const numberEl = document.getElementById("burnerNumber");
    const copyBtn = document.getElementById("copyBtn");
    const copyMsg = document.getElementById("copyMsg");
    const smsLink = document.getElementById("smsLink");

    // Menu UI
    const menuGrid = document.getElementById("menuGrid");
    const menuStatus = document.getElementById("menuStatus");

    // Neon leaf layer
    const neonLeafContainer = document.getElementById("leafContainer");

    let isUnlocked = false;

    function showToast(msg) {
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.remove("hidden");
      window.setTimeout(() => toast.classList.add("hidden"), 1400);
    }

    function setPressure(state) {
      if (!pressureEl) return;
      pressureEl.textContent = `PRESSURE LEVEL: ${state}`;
    }

    // Boot toast
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
    window.setInterval(rotateCult, 9000);

    // Hold logo to reveal members
    let holdTimer = null;
    let holding = false;

    function revealMembers() {
      if (!membersSection) return;
      membersSection.classList.remove("hidden");
      showToast("Members unlocked.");
      setPressure("ELEVATED");
      window.setTimeout(() => membersSection.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
      window.setTimeout(() => passInput && passInput.focus(), 400);
    }

    function startHold(e) {
      // Only prevent default on touch to avoid weirdness
      if (e.type.startsWith("touch")) e.preventDefault();
      if (holding) return;
      holding = true;
      holdTimer = window.setTimeout(revealMembers, 1200);
    }

    function endHold() {
      holding = false;
      if (holdTimer) window.clearTimeout(holdTimer);
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

    // Locked state
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

    // Unlock attempt
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

    if (unlockBtn) unlockBtn.addEventListener("click", unlockAttempt);
    if (passInput) passInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") unlockAttempt();
    });

    // Copy guarded
    if (copyBtn) copyBtn.addEventListener("click", async () => {
      if (!isUnlocked) return;
      try {
        await navigator.clipboard.writeText(MEMBERS_NUMBER);
        if (copyMsg) copyMsg.textContent = "Copied.";
        window.setTimeout(() => { if (copyMsg) copyMsg.textContent = ""; }, 1200);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = MEMBERS_NUMBER;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        if (copyMsg) copyMsg.textContent = "Copied.";
        window.setTimeout(() => { if (copyMsg) copyMsg.textContent = ""; }, 1200);
      }
    });

    /* ==============================
       LEAVES — realism + safe gusts
    ============================== */
    if (neonLeafContainer) {
      const leafSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
          <path fill="rgba(60,255,132,0.92)"
            d="M63 10c3 20 4 33 2 48 9-16 24-29 44-36-11 25-23 40-40 54
               18-3 34-1 52 7-20 14-38 19-54 18 12 11 21 27 23 52
               -22-12-36-28-44-45-8 17-22 33-44 45
               2-25 11-41 23-52-16 1-34-4-54-18
               18-8 34-10 52-7-17-14-29-29-40-54
               20 7 35 20 44 36-2-15-1-28 2-48z"/>
          <path fill="rgba(0,0,0,0.18)"
            d="M64 20c2 14 2 28 0 42 10-12 22-20 36-25
               -9 15-18 27-31 36 13-2 26-1 39 5
               -15 9-28 13-40 12 10 9 17 21 18 39
               -16-9-26-20-32-33-6 13-16 24-32 33
               1-18 8-30 18-39-12 1-25-3-40-12
               13-6 26-7 39-5-13-9-22-21-31-36
               14 5 26 13 36 25-2-14-2-28 0-42z"/>
        </svg>
      `;

      let gustUntil = 0;
      let gustStrength = 0;

      function maybeStartGust() {
        const now = Date.now();
        if (now < gustUntil) return;

        // random chance to start a gust
        if (Math.random() < 0.012) { // ~ once every ~20-40s depending on spawn rate
          const dir = Math.random() < 0.5 ? -1 : 1;
          gustStrength = dir * (80 + Math.random() * 180);
          gustUntil = now + (2000 + Math.random() * 1500);
        }
      }

      function spawnLeaf() {
        maybeStartGust();

        const leaf = document.createElement("div");
        leaf.className = "neon-leaf";
        leaf.innerHTML = leafSVG;

        const depth = Math.random();

        const size = 10 + depth * 20;
        const opacity = 0.05 + depth * 0.16;
        const blur = (1 - depth) * 1.6;
        const duration = 12 + (1 - depth) * 18;

        const baseDrift = (Math.random() * 260 - 130);
        const now = Date.now();
        const gusting = now < gustUntil;
        const drift = (baseDrift + (gusting ? gustStrength : 0)).toFixed(0) + "px";

        const rot0 = (Math.random() * 360).toFixed(0) + "deg";
        const rot1 = (Math.random() * 720 - 360 + (gusting ? (Math.random() * 240 - 120) : 0)).toFixed(0) + "deg";

        leaf.style.width = size + "px";
        leaf.style.height = size + "px";
        leaf.style.left = (Math.random() * 100) + "vw";

        leaf.style.setProperty("--drift", drift);
        leaf.style.setProperty("--rot0", rot0);
        leaf.style.setProperty("--rot1", rot1);

        leaf.style.animationDuration = duration + "s";
        leaf.style.opacity = opacity.toFixed(2);

        const glowA = (0.12 + depth * 0.22).toFixed(2);
        const glowB = (0.06 + depth * 0.10).toFixed(2);

        leaf.style.filter =
          `drop-shadow(0 0 ${2 + depth * 4}px rgba(60,255,132,${glowA})) ` +
          `drop-shadow(0 0 ${6 + depth * 10}px rgba(60,255,132,${glowB})) ` +
          `blur(${blur.toFixed(2)}px)`;

        neonLeafContainer.appendChild(leaf);
        window.setTimeout(() => leaf.remove(), Math.ceil(duration * 1000) + 4000);
      }

      for (let i = 0; i < 12; i++) window.setTimeout(spawnLeaf, i * 160);
      window.setInterval(spawnLeaf, 650);
    }
  } catch (err) {
    // If anything fails, try to show it
    const t = document.getElementById("toast");
    if (t) {
      t.textContent = "JS ERROR — open console";
      t.classList.remove("hidden");
    }
    console.error(err);
  }
});
