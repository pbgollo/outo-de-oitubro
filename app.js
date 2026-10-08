(() => {
  const data = window.SURPRISE;
  if (!data) {
    console.error("content.js não carregou.");
    return;
  }

  const intro = document.getElementById("intro");
  const letter = document.getElementById("letter");
  const letterPage = document.getElementById("letter-page");
  const letterSheet = document.getElementById("letter-sheet");
  const letterContent = document.getElementById("letter-content");
  const openBtn = document.getElementById("open-btn");
  const continueBtn = document.getElementById("continue-btn");
  const heroName = document.getElementById("hero-name");
  const heroTitle = document.getElementById("hero-title");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const turnMs = 520;
  const SHEET_TILTS = [-0.75, 0.55, -0.35, 0.7, -0.5, 0.4, -0.65, 0.3];

  const ICONS = {
    next: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,
    home: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M3.5 12a8.5 8.5 0 1 0 2.4-5.9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M3.5 4.5v4.8h4.8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,
  };

  let stepIndex = 0;
  let typing = false;
  let turning = false;
  let opening = false;
  let typeTimer = null;
  let homeTimer = null;
  let arrowMode = "next";
  let skipTyping = null;

  const app = document.querySelector(".app");

  heroName.textContent = data.name;
  heroTitle.textContent = data.title;
  openBtn.textContent = data.openLabel;
  document.title = `Para ${data.name}`;

  intro.classList.add("is-active");
  setArrowMode("next");

  const heartPath = intro.querySelector(".cover__heart-path");
  if (heartPath && typeof heartPath.getTotalLength === "function") {
    const heartLen = heartPath.getTotalLength();
    heartPath.style.strokeDasharray = `${heartLen}`;
    heartPath.style.strokeDashoffset = `${heartLen}`;
  }

  function clearTypeTimer() {
    if (typeTimer) {
      clearTimeout(typeTimer);
      typeTimer = null;
    }
    skipTyping = null;
  }

  function clearHomeTimer() {
    if (homeTimer) {
      clearTimeout(homeTimer);
      homeTimer = null;
    }
  }

  function setContinueEnabled(enabled) {
    continueBtn.disabled = !enabled;
    continueBtn.classList.toggle("is-disabled", !enabled);
  }

  function setArrowMode(mode) {
    arrowMode = mode;
    continueBtn.innerHTML = ICONS[mode];
    continueBtn.setAttribute(
      "aria-label",
      mode === "home" ? data.homeLabel || "Voltar ao início" : data.nextLabel || "Próxima página"
    );
    continueBtn.classList.toggle("is-home", mode === "home");
  }

  function setContentMode(_mode) {
    // Folha única: texto e fotos ficam no papel
  }

  function applySheetTilt(index) {
    if (!letterSheet) return;
    const deg = SHEET_TILTS[index % SHEET_TILTS.length];
    letterSheet.style.transform = `rotate(${deg}deg)`;
  }

  function prepareArrowForStep(index) {
    clearHomeTimer();
    const isLast = index >= data.steps.length - 1;

    if (isLast) {
      setArrowMode("home");
      continueBtn.classList.add("is-hidden");
      setContinueEnabled(false);
      return;
    }

    setArrowMode("next");
    continueBtn.classList.remove("is-hidden", "is-appearing");
    setContinueEnabled(false);
  }

  function revealHomeArrow() {
    continueBtn.classList.remove("is-hidden");
    continueBtn.classList.remove("is-appearing");
    void continueBtn.offsetWidth;
    continueBtn.classList.add("is-appearing");
    setContinueEnabled(true);
  }

  function waitForTurn(className, ms = turnMs) {
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        letterPage.removeEventListener("animationend", onEnd);
        window.clearTimeout(fallback);
        resolve();
      };
      const onEnd = (event) => {
        if (event.target === letterPage) finish();
      };
      letterPage.addEventListener("animationend", onEnd);
      const fallback = window.setTimeout(finish, ms + 60);

      void letterPage.offsetWidth;
      letterPage.classList.add(className);
    });
  }

  function resetCoverMotion() {
    const cover = intro.querySelector(".cover");
    const heartPath = intro.querySelector(".cover__heart-path");
    intro.classList.remove("is-opening");
    if (!cover) return;

    cover.style.animation = "none";
    cover.style.filter = "";
    cover.style.opacity = "";
    cover.style.transform = "";
    if (heartPath) heartPath.style.animation = "none";
    void cover.offsetWidth;
    cover.style.animation = "";
    if (heartPath) heartPath.style.animation = "";
  }

  function switchToLetter() {
    if (!letter.hidden || opening) return;

    opening = true;
    openBtn.disabled = true;

    const cover = intro.querySelector(".cover");
    intro.classList.remove("is-active");
    intro.classList.remove("is-opening");
    if (cover) {
      cover.style.animation = "none";
      void cover.offsetWidth;
      cover.style.animation = "";
    }

    intro.classList.add("is-opening");
    app.classList.add("is-revealing");

    const coverMs = 820;
    const paperMs = 920;

    window.setTimeout(() => {
      intro.hidden = true;
      letter.hidden = false;
      letter.classList.remove("is-active", "is-entering");
      letterContent.innerHTML = "";
      continueBtn.classList.add("is-hidden");
      setContinueEnabled(false);

      void letter.offsetWidth;
      letter.classList.add("is-entering", "is-active");

      const sheet = document.getElementById("letter-sheet");
      if (sheet) {
        sheet.style.animation = "none";
        void sheet.offsetWidth;
        sheet.style.animation = "";
      }

      window.setTimeout(() => {
        letter.classList.remove("is-entering");
        app.classList.remove("is-revealing");
        openBtn.disabled = false;
        opening = false;
        showStep(0);
      }, paperMs);
    }, coverMs);
  }

  function finishGoToCover() {
    setArrowMode("next");
    app.classList.remove("is-revealing");
    letter.classList.remove("is-active", "is-entering");

    window.setTimeout(() => {
      letter.hidden = true;
      letterPage.classList.remove(
        "is-turning-out",
        "is-turning-in",
        "is-rewind-out",
        "is-rewind-in"
      );
      letterContent.innerHTML = "";
      stepIndex = 0;
      turning = false;

      intro.hidden = false;
      resetCoverMotion();
      requestAnimationFrame(() => {
        intro.classList.add("is-active");
      });
    }, reduceMotion ? 0 : 280);
  }

  function paintStepInstant(index) {
    clearTypeTimer();
    typing = false;
    stepIndex = index;
    applySheetTilt(index);
    const step = data.steps[index];
    letterContent.innerHTML = "";
    continueBtn.classList.add("is-hidden");
    continueBtn.classList.remove("is-appearing");
    setContinueEnabled(false);

    if (!step) return;

    if (step.type === "text" || step.type === "closing") {
      const wrap = document.createElement("div");
      wrap.className = step.type === "closing" ? "step step--closing" : "step step--text";
      const p = document.createElement("p");
      p.textContent = step.body;
      wrap.appendChild(p);
      letterContent.appendChild(wrap);
      return;
    }

    if (step.type === "photo") {
      const wrap = document.createElement("figure");
      wrap.className = "step step--photo";

      const frame = document.createElement("div");
      frame.className =
        step.orientation === "landscape"
          ? "photo-frame photo-frame--landscape"
          : "photo-frame";

      const img = document.createElement("img");
      img.src = step.src;
      img.alt = step.alt || "";
      img.loading = "eager";
      frame.appendChild(img);
      wrap.appendChild(frame);

      if (step.caption) {
        const cap = document.createElement("figcaption");
        cap.className = "photo-caption";
        cap.textContent = step.caption;
        wrap.appendChild(cap);
      }

      letterContent.appendChild(wrap);
    }
  }

  async function rewindToCover() {
    if (turning || opening) return;

    turning = true;
    clearTypeTimer();
    clearHomeTimer();
    typing = false;
    setContinueEnabled(false);
    continueBtn.classList.add("is-hidden");
    continueBtn.classList.remove("is-appearing");

    const rewindMs = reduceMotion ? 0 : 150;
    let current = stepIndex;

    while (current > 0) {
      letterPage.classList.remove(
        "is-turning-in",
        "is-turning-out",
        "is-rewind-in",
        "is-rewind-out"
      );

      await waitForTurn("is-rewind-out", rewindMs);
      letterPage.classList.remove("is-rewind-out");

      current -= 1;
      paintStepInstant(current);

      await waitForTurn("is-rewind-in", rewindMs);
      letterPage.classList.remove("is-rewind-in");
    }

    finishGoToCover();
  }

  function goToCover() {
    rewindToCover();
  }

  function typeText(element, fullText, done, options = {}) {
    const speed = reduceMotion ? 0.7 : 1;
    let finished = false;

    typing = true;
    setContinueEnabled(false);

    // Reserva a altura final pra textos centralizados não subirem ao digitar
    if (options.reserveHeight) {
      element.style.visibility = "hidden";
      element.textContent = fullText;
      element.style.minHeight = `${element.offsetHeight}px`;
      element.style.visibility = "";
    }

    element.textContent = "";

    let i = 0;

    const finish = () => {
      if (finished) return;
      finished = true;
      clearTypeTimer();
      skipTyping = null;
      typing = false;
      element.textContent = fullText;
      done();
    };

    skipTyping = finish;

    const tick = () => {
      if (finished) return;

      if (i >= fullText.length) {
        finish();
        return;
      }

      element.textContent += fullText[i];
      i += 1;

      const ch = fullText[i - 1];
      let delay = 74 * speed;
      if (ch === "\n") delay = 280 * speed;
      else if (/[.,!?;:]/.test(ch)) delay = 210 * speed;
      else if (ch === " ") delay = 90 * speed;

      typeTimer = window.setTimeout(tick, Math.max(24, delay));
    };

    tick();
  }

  function onLetterTap(event) {
    if (!typing || !skipTyping) return;
    if (event.target.closest("#continue-btn")) return;
    skipTyping();
  }

  function renderStep(index) {
    clearTypeTimer();
    clearHomeTimer();
    typing = false;
    stepIndex = index;
    applySheetTilt(index);
    const step = data.steps[index];
    letterContent.innerHTML = "";
    prepareArrowForStep(index);

    if (!step) return;

    if (step.type === "text") {
      setContentMode("paper");
      const wrap = document.createElement("div");
      wrap.className = "step step--text";
      const p = document.createElement("p");
      wrap.appendChild(p);
      letterContent.appendChild(wrap);
      typeText(p, step.body, () => setContinueEnabled(true));
      return;
    }

    if (step.type === "photo") {
      setContentMode("paper");
      const wrap = document.createElement("figure");
      wrap.className = "step step--photo";

      const frame = document.createElement("div");
      frame.className =
        step.orientation === "landscape"
          ? "photo-frame photo-frame--landscape"
          : "photo-frame";

      const img = document.createElement("img");
      img.src = step.src;
      img.alt = step.alt || "";
      img.loading = "eager";
      frame.appendChild(img);
      wrap.appendChild(frame);

      if (step.caption) {
        const cap = document.createElement("figcaption");
        cap.className = "photo-caption";
        cap.textContent = step.caption;
        wrap.appendChild(cap);
      }

      letterContent.appendChild(wrap);
      setContinueEnabled(true);
      return;
    }

    if (step.type === "closing") {
      setContentMode("paper");
      const wrap = document.createElement("div");
      wrap.className = "step step--closing";
      const p = document.createElement("p");
      wrap.appendChild(p);
      letterContent.appendChild(wrap);

      const fullText = data.signature
        ? `${step.body}\n\n${data.signature}`
        : step.body;

      typeText(
        p,
        fullText,
        () => {
          homeTimer = window.setTimeout(revealHomeArrow, 1000);
        },
        { reserveHeight: true }
      );
    }
  }

  function showStep(index) {
    letterPage.classList.remove("is-turning-out", "is-turning-in");
    renderStep(index);
  }

  async function turnTo(index) {
    if (typing || turning || continueBtn.disabled || continueBtn.classList.contains("is-hidden")) {
      return;
    }

    turning = true;
    setContinueEnabled(false);
    letterPage.classList.remove("is-turning-in", "is-turning-out");

    await waitForTurn("is-turning-out");
    letterPage.classList.remove("is-turning-out");
    renderStep(index);

    await waitForTurn("is-turning-in");
    letterPage.classList.remove("is-turning-in");
    turning = false;
  }

  function onCornerClick() {
    if (typing || turning || continueBtn.disabled) return;

    if (arrowMode === "home") {
      goToCover();
      return;
    }

    if (stepIndex >= data.steps.length - 1) return;
    turnTo(stepIndex + 1);
  }

  openBtn.addEventListener("click", switchToLetter);
  continueBtn.addEventListener("click", onCornerClick);
  letterPage.addEventListener("click", onLetterTap);

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      if (
        !letter.hidden &&
        arrowMode === "next" &&
        !continueBtn.disabled &&
        !continueBtn.classList.contains("is-hidden")
      ) {
        event.preventDefault();
        onCornerClick();
      }
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") return;
    if (letter.hidden) {
      if (
        document.activeElement === openBtn ||
        !document.activeElement ||
        document.activeElement === document.body
      ) {
        event.preventDefault();
        switchToLetter();
      }
      return;
    }
    if (typing && skipTyping) {
      event.preventDefault();
      skipTyping();
      return;
    }
    if (!continueBtn.disabled && !continueBtn.classList.contains("is-hidden")) {
      event.preventDefault();
      onCornerClick();
    }
  });
})();
