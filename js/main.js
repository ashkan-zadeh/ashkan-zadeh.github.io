const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navMenu = document.querySelector("[data-nav-menu]");
const progress = document.querySelector("[data-scroll-progress]");
const cursorGlow = document.querySelector("[data-cursor-glow]");
const typedTarget = document.querySelector("[data-typed-text]");
const navLinks = [...document.querySelectorAll(".nav-links a[href^='#']")];
const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
