const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navMenu = document.querySelector("[data-nav-menu]");
const progress = document.querySelector("[data-scroll-progress]");
const cursorGlow = document.querySelector("[data-cursor-glow]");
const typedTarget = document.querySelector("[data-typed-text]");
const emailScrollLinks = [...document.querySelectorAll("[data-email-scroll]")];
const contactEmail = document.querySelector("#contact-email");
const newsList = document.querySelector("[data-news-list]");
const newsMeta = document.querySelector("[data-news-meta]");
const newsCount = document.querySelector("[data-news-count]");
const newsLoading = document.querySelector("[data-news-loading]");
const newsFilters = [...document.querySelectorAll("[data-news-filter]")];
const tickerEl = document.querySelector("[data-news-ticker]");
const tickerItemsEl = document.querySelector("[data-ticker-items]");
const navLinks = [...document.querySelectorAll(".nav-links a[href^='#']")];
const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── Theme switcher ─────────────────────────────────────── */
const THEMES = ["horizon", "lidar", "neural", "carbon", "spectrum"];
const themeToggle = document.querySelector("[data-theme-toggle]");
const themePanel = document.querySelector("[data-theme-panel]");
const themeOptions = [...document.querySelectorAll("[data-theme-pick]")];

function applyTheme(name, animate = true) {
    if (!THEMES.includes(name)) return;
    if (animate && !prefersReducedMotion) {
        document.documentElement.classList.add("theme-transitioning");
        window.setTimeout(() => document.documentElement.classList.remove("theme-transitioning"), 380);
    }
    document.documentElement.setAttribute("data-theme", name);
    localStorage.setItem("theme", name);
    themeOptions.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.themePick === name));
    document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: name } }));
}

function openThemePanel() {
    themePanel.hidden = false;
    themeToggle.setAttribute("aria-expanded", "true");
}

function closeThemePanel() {
    themePanel.hidden = true;
    themeToggle.setAttribute("aria-expanded", "false");
}

if (themeToggle && themePanel) {
    const saved = localStorage.getItem("theme") || "horizon";
    themeOptions.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.themePick === saved));

    themeToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        themePanel.hidden ? openThemePanel() : closeThemePanel();
    });

    themeOptions.forEach((btn) => {
        btn.addEventListener("click", () => {
            applyTheme(btn.dataset.themePick);
            closeThemePanel();
        });
    });

    document.addEventListener("click", (e) => {
        if (!themePanel.hidden && !themePanel.contains(e.target) && e.target !== themeToggle) {
            closeThemePanel();
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !themePanel.hidden) closeThemePanel();
    });
}

/* ── Site-wide neural background ────────────────────────── */
(function initSiteBackground() {
    const canvas = document.querySelector("[data-site-background]");
    if (!canvas || prefersReducedMotion) return;

    const ctx = canvas.getContext("2d");
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let nodes = [];
    let signals = [];
    let rafId = 0;
    let isRunning = false;
    let pointerX = 0.5;
    let pointerY = 0.35;
    let palette = {
        teal: [53, 208, 186],
        amber: [242, 184, 96],
        coral: [255, 120, 103],
        blue: [124, 180, 255],
    };

    function hexToRgb(hex) {
        const clean = hex.trim().replace("#", "");
        if (clean.length !== 6) return null;
        return [
            parseInt(clean.slice(0, 2), 16),
            parseInt(clean.slice(2, 4), 16),
            parseInt(clean.slice(4, 6), 16),
        ];
    }

    function cssColorToRgb(value) {
        const hex = hexToRgb(value);
        if (hex) return hex;

        const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        if (!match) return null;
        return [Number(match[1]), Number(match[2]), Number(match[3])];
    }

    function readPalette() {
        const style = getComputedStyle(document.documentElement);
        ["teal", "amber", "coral", "blue"].forEach((name) => {
            const next = cssColorToRgb(style.getPropertyValue(`--${name}`));
            if (next) palette[name] = next;
        });
    }

    function rgba(color, alpha) {
        return `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
    }

    function makeNode(i, total) {
        const colorNames = ["teal", "blue", "amber", "coral"];
        const band = i / total;
        const orbit = Math.random() * 0.28 + 0.1;
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.006,
            vy: (Math.random() - 0.5) * 0.005,
            r: Math.random() * 2.4 + 1.1,
            phase: Math.random() * Math.PI * 2,
            drift: Math.random() * 0.08 + 0.025,
            orbitX: orbit,
            orbitY: orbit * (Math.random() * 0.55 + 0.58),
            color: colorNames[Math.floor(band * colorNames.length) % colorNames.length],
        };
    }

    function makeSignal() {
        return {
            from: Math.floor(Math.random() * nodes.length),
            to: Math.floor(Math.random() * nodes.length),
            t: Math.random(),
            speed: Math.random() * 0.00016 + 0.000055,
            color: ["teal", "amber", "coral", "blue"][Math.floor(Math.random() * 4)],
        };
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.floor(width * DPR);
        canvas.height = Math.floor(height * DPR);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

        const count = Math.round(Math.min(138, Math.max(64, width / 13)));
        nodes = Array.from({ length: count }, (_, i) => makeNode(i, count));
        signals = Array.from({ length: Math.round(count * 0.55) }, makeSignal);
    }

    function drawBackground(time) {
        const px = pointerX * width;
        const py = pointerY * height;

        ctx.clearRect(0, 0, width, height);

        const glow = ctx.createRadialGradient(px, py, 0, px, py, Math.max(width, height) * 0.72);
        glow.addColorStop(0, rgba(palette.teal, 0.12));
        glow.addColorStop(0.34, rgba(palette.blue, 0.06));
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        ctx.globalAlpha = 0.5;
        for (let x = -80; x < width + 160; x += 160) {
            ctx.beginPath();
            ctx.moveTo(x + Math.sin(time * 0.000012 + x) * 12, 0);
            ctx.lineTo(x + 120 + Math.cos(time * 0.00001 + x) * 12, height);
            ctx.strokeStyle = rgba(palette.blue, 0.14);
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        ctx.restore();
    }

    function tick(time) {
        if (!isRunning) return;

        drawBackground(time);

        for (const node of nodes) {
            const dx = pointerX * width - node.x;
            const dy = pointerY * height - node.y;
            const dist = Math.hypot(dx, dy) || 1;
            const pull = dist < 260 ? (1 - dist / 260) * 0.00022 : 0;

            node.vx += Math.cos(time * 0.000006 + node.phase) * 0.000055;
            node.vy += Math.sin(time * 0.000007 + node.phase) * 0.000048;
            node.vx += (dx / dist) * pull;
            node.vy += (dy / dist) * pull;
            node.vx *= 0.965;
            node.vy *= 0.965;
            node.x += node.vx + Math.sin(time * 0.000014 + node.phase) * node.drift * node.orbitX;
            node.y += node.vy + Math.cos(time * 0.000011 + node.phase) * node.drift * node.orbitY;

            if (node.x < -30) node.x = width + 30;
            if (node.x > width + 30) node.x = -30;
            if (node.y < -30) node.y = height + 30;
            if (node.y > height + 30) node.y = -30;
        }

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i];
                const b = nodes[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const dist = Math.hypot(dx, dy);
                const maxDist = width < 720 ? 112 : 158;
                if (dist > maxDist) continue;

                const alpha = (1 - dist / maxDist) * 0.34;
                const color = palette[a.color] || palette.teal;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.strokeStyle = rgba(color, alpha);
                ctx.lineWidth = 0.7;
                ctx.stroke();
            }
        }

        for (const signal of signals) {
            const from = nodes[signal.from];
            const to = nodes[signal.to];
            if (!from || !to || from === to) continue;

            signal.t += signal.speed;
            if (signal.t > 1) {
                Object.assign(signal, makeSignal(), { t: 0 });
                continue;
            }

            const x = from.x + (to.x - from.x) * signal.t;
            const y = from.y + (to.y - from.y) * signal.t;
            const color = palette[signal.color] || palette.teal;
            ctx.beginPath();
            ctx.arc(x, y, 2.2, 0, Math.PI * 2);
            ctx.fillStyle = rgba(color, 0.86);
            ctx.shadowColor = rgba(color, 0.8);
            ctx.shadowBlur = 16;
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        for (const node of nodes) {
            const color = palette[node.color] || palette.teal;
            const pulse = 0.45 + Math.sin(time * 0.000055 + node.phase) * 0.18;
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.r + pulse, 0, Math.PI * 2);
            ctx.fillStyle = rgba(color, 0.68);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(node.x, node.y, node.r * 5.4, 0, Math.PI * 2);
            ctx.strokeStyle = rgba(color, 0.08);
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        if (isRunning) rafId = requestAnimationFrame(tick);
    }

    function start() {
        if (isRunning) return;
        isRunning = true;
        rafId = requestAnimationFrame(tick);
    }

    function stop() {
        isRunning = false;
        cancelAnimationFrame(rafId);
    }

    readPalette();
    resize();
    start();

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", (event) => {
        pointerX = event.clientX / Math.max(1, width);
        pointerY = event.clientY / Math.max(1, height);
    }, { passive: true });
    document.addEventListener("themechange", readPalette);
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            stop();
        } else {
            start();
        }
    });
}());

/* ── Hero particle canvas ───────────────────────────────── */
(function initCanvas() {
    const canvas = document.querySelector("[data-hero-canvas]");
    if (!canvas || prefersReducedMotion) return;

    const ctx = canvas.getContext("2d");
    const NUM = 48;
    const CONNECT_DIST = 115;
    let particles = [];
    let heroMX = -999;
    let heroMY = -999;
    let particleColor = [53, 208, 186];

    function readThemeColor() {
        const hex = getComputedStyle(document.documentElement).getPropertyValue("--teal").trim().replace("#", "");
        if (hex.length === 6) {
            particleColor = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
        }
    }

    function resize() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }

    function makeParticle() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.38,
            vy: (Math.random() - 0.5) * 0.38,
            r: Math.random() * 1.4 + 0.5,
        };
    }

    function tick() {
        const { width, height } = canvas;
        const [r, g, b] = particleColor;

        ctx.clearRect(0, 0, width, height);

        for (const p of particles) {
            const dx = heroMX - p.x;
            const dy = heroMY - p.y;
            const dist2 = dx * dx + dy * dy;
            if (dist2 < 18000) {
                const d = Math.sqrt(dist2);
                p.vx += (dx / d) * 0.012;
                p.vy += (dy / d) * 0.012;
            }
            p.vx *= 0.97;
            p.vy *= 0.97;
            p.x = (p.x + p.vx + width) % width;
            p.y = (p.y + p.vy + height) % height;
        }

        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < CONNECT_DIST) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - dist / CONNECT_DIST) * 0.22})`;
                    ctx.lineWidth = 0.7;
                    ctx.stroke();
                }
            }
        }

        ctx.fillStyle = `rgba(${r},${g},${b},0.55)`;
        for (const p of particles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        }

        requestAnimationFrame(tick);
    }

    resize();
    readThemeColor();
    particles = Array.from({ length: NUM }, makeParticle);
    tick();

    window.addEventListener("resize", () => {
        resize();
        particles = Array.from({ length: NUM }, makeParticle);
    }, { passive: true });

    canvas.closest(".hero")?.addEventListener("pointermove", (e) => {
        const rect = canvas.getBoundingClientRect();
        heroMX = e.clientX - rect.left;
        heroMY = e.clientY - rect.top;
    }, { passive: true });

    canvas.closest(".hero")?.addEventListener("pointerleave", () => {
        heroMX = -999;
        heroMY = -999;
    }, { passive: true });

    document.addEventListener("themechange", readThemeColor);
}());

const typedPhrases = [
    "explainable automated vehicles",
    "computer vision evidence for AV decisions",
    "LLM and NLP explanation generation",
    "human-centred trust calibration",
];

const panelContent = {
    perception: {
        title: "Perception to explanation",
        body: "Connects computer vision, vehicle state, and scene context to explanation-ready evidence.",
    },
    language: {
        title: "Language as an interface",
        body: "Transforms structured AV evidence into natural language explanations that are clear, situated, and useful.",
    },
    human: {
        title: "Human-centred evaluation",
        body: "Studies whether explanations support understanding, trust calibration, and safer interaction with automated systems.",
    },
};

function setHeaderState() {
    header?.classList.toggle("is-scrolled", window.scrollY > 12);
}

function setScrollProgress() {
    if (!progress) return;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    progress.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
}

setHeaderState();
setScrollProgress();
window.addEventListener("scroll", setHeaderState, { passive: true });
window.addEventListener("scroll", setScrollProgress, { passive: true });

navToggle?.addEventListener("click", () => {
    const isOpen = navMenu?.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
});

navLinks.forEach((link) => {
    link.addEventListener("click", () => {
        navMenu?.classList.remove("is-open");
        navToggle?.setAttribute("aria-expanded", "false");
    });
});

emailScrollLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
        if (!contactEmail) return;

        event.preventDefault();
        contactEmail.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
        window.history.pushState(null, "", link.getAttribute("href"));

        window.setTimeout(() => {
            contactEmail.focus({ preventScroll: true });
            contactEmail.classList.remove("is-highlighted");
            void contactEmail.offsetWidth;
            contactEmail.classList.add("is-highlighted");
        }, prefersReducedMotion ? 0 : 420);
    });
});

const activeObserver = new IntersectionObserver(
    (entries) => {
        const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        navLinks.forEach((link) => {
            link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`);
        });
    },
    {
        rootMargin: "-20% 0px -65% 0px",
        threshold: [0.1, 0.35, 0.65],
    }
);

sections.forEach((section) => activeObserver.observe(section));

const revealObserver = new IntersectionObserver(
    (entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    },
    { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

if (typedTarget) {
    if (prefersReducedMotion) {
        typedTarget.textContent = typedPhrases[0];
    } else {
        let phraseIndex = 0;
        let charIndex = 0;
        let deleting = false;

        const typeNext = () => {
            const phrase = typedPhrases[phraseIndex];
            typedTarget.textContent = phrase.slice(0, charIndex);

            if (!deleting && charIndex < phrase.length) {
                charIndex += 1;
                window.setTimeout(typeNext, 44);
                return;
            }

            if (!deleting) {
                deleting = true;
                window.setTimeout(typeNext, 1200);
                return;
            }

            if (charIndex > 0) {
                charIndex -= 1;
                window.setTimeout(typeNext, 24);
                return;
            }

            deleting = false;
            phraseIndex = (phraseIndex + 1) % typedPhrases.length;
            window.setTimeout(typeNext, 260);
        };

        typeNext();
    }
}

if (cursorGlow && !prefersReducedMotion && window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("pointermove", (event) => {
        document.documentElement.style.setProperty("--mouse-x", `${event.clientX}px`);
        document.documentElement.style.setProperty("--mouse-y", `${event.clientY}px`);
        cursorGlow.style.transform = `translate3d(${event.clientX - 9}px, ${event.clientY - 9}px, 0)`;
    }, { passive: true });

    document.querySelectorAll("a, button, [data-tilt]").forEach((element) => {
        element.addEventListener("pointerenter", () => cursorGlow.classList.add("is-active"));
        element.addEventListener("pointerleave", () => cursorGlow.classList.remove("is-active"));
    });
}

if (!prefersReducedMotion && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
        card.addEventListener("pointermove", (event) => {
            const rect = card.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `perspective(900px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg) translateY(-2px)`;
        });

        card.addEventListener("pointerleave", () => {
            card.style.transform = "";
        });
    });
}

const tabs = [...document.querySelectorAll("[data-panel-tab]")];
const panelOutput = document.querySelector("[data-panel-output]");
const researchCards = [...document.querySelectorAll("[data-research-card]")];

tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        const key = tab.dataset.panelTab;
        const content = panelContent[key];
        if (!content || !panelOutput) return;

        tabs.forEach((item) => {
            const active = item === tab;
            item.classList.toggle("is-active", active);
            item.setAttribute("aria-selected", String(active));
        });

        researchCards.forEach((card) => {
            card.classList.toggle("is-emphasized", card.dataset.researchCard === key);
        });

        panelOutput.innerHTML = `<strong>${content.title}</strong><p>${content.body}</p>`;
    });
});

const categoryLabels = {
    "automated-vehicles": "Automated Vehicles",
    ai: "AI",
    llm: "LLMs",
    nlp: "NLP",
    vlm: "Vision-Language Models",
    "computer-vision": "Computer Vision",
};

const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
}[char]));

const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Recent";
    return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(date);
};

const formatGeneratedAt = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Updated recently";
    return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(date);
};

let newsItems = [];
let activeNewsFilter = "all";

function populateTicker() {
    if (!tickerEl || !tickerItemsEl || !newsItems.length) return;

    const items = newsItems.map((item) => `
        <span class="ticker-item" data-cat="${escapeHTML(item.category)}">
            <span class="ticker-item-cat">${escapeHTML(categoryLabels[item.category] || "News")}</span>
            <a href="${escapeHTML(item.url)}" target="_blank" rel="noopener">${escapeHTML(item.topic || item.title)}</a>
            <span class="ticker-sep" aria-hidden="true"></span>
        </span>`).join("");

    tickerItemsEl.innerHTML = items + items;

    const charCount = newsItems.reduce((sum, item) => sum + (item.topic || item.title || "").length, 0);
    const duration = Math.max(30, Math.round(charCount * 0.28));
    tickerItemsEl.style.animationDuration = `${duration}s`;

    tickerEl.removeAttribute("aria-hidden");
    requestAnimationFrame(() => tickerEl.classList.add("is-visible"));
}

function applyNewsFeed(feed) {
    newsItems = Array.isArray(feed?.items) ? feed.items : [];
    if (newsMeta) {
        newsMeta.textContent = formatGeneratedAt(feed?.generated_at);
    }
    if (newsLoading) {
        newsLoading.hidden = true;
    }
    populateTicker();
    renderNews();
}

function renderNews() {
    if (!newsList) return;

    const visibleItems = activeNewsFilter === "all"
        ? newsItems
        : newsItems.filter((item) => item.category === activeNewsFilter);

    if (newsCount) {
        newsCount.textContent = visibleItems.length
            ? `${visibleItems.length} article${visibleItems.length !== 1 ? "s" : ""}`
            : "";
    }

    if (!visibleItems.length) {
        newsList.innerHTML = "<div class=\"news-empty\">No articles available for this topic.</div>";
        return;
    }

    const badgeClass = (cat) => `news-badge news-badge--${escapeHTML(cat)}`;
    const renderBadge = (item) => `<span class="${badgeClass(item.category)}">${escapeHTML(categoryLabels[item.category] || "News")}</span>`;
    const renderMeta = (item) => `<span class="news-source">${escapeHTML(item.source)} · ${formatDate(item.published)}</span>`;
    const renderLink = (item) => `<a class="news-read-more" href="${escapeHTML(item.url)}" target="_blank" rel="noopener">Read article →</a>`;

    const [featured, ...rest] = visibleItems;

    const featuredCard = `
        <article class="news-card news-card--featured" data-category="${escapeHTML(featured.category)}">
            <div class="news-card-visual" aria-hidden="true"></div>
            <div class="news-card-content">
                <div class="news-card-header">
                    ${renderBadge(featured)}
                    ${renderMeta(featured)}
                </div>
                <h3>${escapeHTML(featured.topic || featured.title)}</h3>
                <p>${escapeHTML(featured.abstract || featured.summary)}</p>
                <div class="news-card-footer">
                    ${renderLink(featured)}
                </div>
            </div>
        </article>`;

    const regularCards = rest.map((item) => `
        <article class="news-card" data-category="${escapeHTML(item.category)}">
            <div class="news-card-content">
                <div class="news-card-header">
                    ${renderBadge(item)}
                    ${renderMeta(item)}
                </div>
                <h3>${escapeHTML(item.topic || item.title)}</h3>
                <p>${escapeHTML(item.abstract || item.summary)}</p>
                <div class="news-card-footer">
                    ${renderLink(item)}
                </div>
            </div>
        </article>`).join("");

    newsList.innerHTML = `<div class="news-grid">${featuredCard}${regularCards}</div>`;
}

newsFilters.forEach((filter) => {
    filter.addEventListener("click", () => {
        activeNewsFilter = filter.dataset.newsFilter || "all";
        newsFilters.forEach((item) => {
            const active = item === filter;
            item.classList.toggle("is-active", active);
            item.setAttribute("aria-selected", String(active));
        });

        newsList.classList.add("is-transitioning");
        window.setTimeout(() => {
            renderNews();
            newsList.classList.remove("is-transitioning");
        }, 180);
    });
});

if (newsList) {
    if (window.NEWS_FEED) {
        applyNewsFeed(window.NEWS_FEED);
    }

    fetch("data/news.json", { cache: "no-store" })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Feed request failed: ${response.status}`);
            }
            return response.json();
        })
        .then(applyNewsFeed)
        .catch(() => {
            if (!newsItems.length && newsMeta) {
                newsMeta.textContent = "Feed unavailable";
            }
            if (!newsItems.length) {
                newsList.innerHTML = "<div class=\"news-empty\">News feed unavailable.</div>";
            }
        });
}

/* ── News Archive ───────────────────────────────────────── */
const archivePanel = document.querySelector("[data-archive-panel]");
const archiveToggle = document.querySelector("[data-archive-toggle]");
const archiveClose = document.querySelector("[data-archive-close]");
const archiveList = document.querySelector("[data-archive-list]");
const archiveLoading = document.querySelector("[data-archive-loading]");
const archiveFilters = [...document.querySelectorAll("[data-archive-filter]")];

let archiveItems = [];
let archiveLoaded = false;
let activeArchiveFilter = "all";

function groupByMonth(items) {
    const groups = {};
    for (const item of items) {
        const d = new Date(item.published);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
        if (!groups[key]) groups[key] = { key, label, items: [] };
        groups[key].items.push(item);
    }
    return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key));
}

function renderArchive() {
    if (!archiveList) return;
    const filtered = activeArchiveFilter === "all"
        ? archiveItems
        : archiveItems.filter((item) => item.category === activeArchiveFilter);

    if (!filtered.length) {
        archiveList.innerHTML = "<div class=\"news-empty\">No archived articles for this topic.</div>";
        return;
    }

    const groups = groupByMonth(filtered);
    archiveList.innerHTML = groups.map((group) => `
        <div class="archive-month">
            <h4 class="archive-month-label">${escapeHTML(group.label)}</h4>
            <div class="archive-items">
                ${group.items.map((item) => `
                    <article class="archive-item">
                        <div class="archive-item-header">
                            <span class="news-badge news-badge--${escapeHTML(item.category)}">${escapeHTML(categoryLabels[item.category] || "News")}</span>
                            <span class="news-source">${escapeHTML(item.source)} · ${formatDate(item.published)}</span>
                        </div>
                        <a class="archive-item-title" href="${escapeHTML(item.url)}" target="_blank" rel="noopener">${escapeHTML(item.topic || item.title)}</a>
                        <p class="archive-item-abstract">${escapeHTML(item.abstract || item.summary)}</p>
                    </article>
                `).join("")}
            </div>
        </div>
    `).join("");
}

function loadArchive() {
    if (archiveLoaded) {
        renderArchive();
        return;
    }
    if (archiveLoading) archiveLoading.hidden = false;
    fetch("data/news-archive.json", { cache: "no-store" })
        .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then((data) => {
            archiveItems = Array.isArray(data?.items) ? data.items : [];
            archiveLoaded = true;
            if (archiveLoading) archiveLoading.hidden = true;
            renderArchive();
        })
        .catch(() => {
            if (archiveLoading) archiveLoading.hidden = true;
            if (archiveList) archiveList.innerHTML = "<div class=\"news-empty\">Archive unavailable.</div>";
        });
}

if (archiveToggle && archivePanel) {
    archiveToggle.addEventListener("click", () => {
        const isHidden = archivePanel.hidden;
        archivePanel.hidden = !isHidden;
        archiveToggle.setAttribute("aria-expanded", String(isHidden));
        archiveToggle.textContent = isHidden ? "Hide Archive ↑" : "View Archive →";
        if (isHidden) {
            archivePanel.scrollIntoView({ behavior: "smooth", block: "start" });
            loadArchive();
        }
    });
}

if (archiveClose && archivePanel) {
    archiveClose.addEventListener("click", () => {
        archivePanel.hidden = true;
        archiveToggle.setAttribute("aria-expanded", "false");
        archiveToggle.textContent = "View Archive →";
    });
}

archiveFilters.forEach((filter) => {
    filter.addEventListener("click", () => {
        activeArchiveFilter = filter.dataset.archiveFilter || "all";
        archiveFilters.forEach((f) => {
            const active = f === filter;
            f.classList.toggle("is-active", active);
            f.setAttribute("aria-selected", String(active));
        });
        renderArchive();
    });
});
