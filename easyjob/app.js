// ═══════════════════════════════════════════════════
// EASYJOB - Design System "Connexions"
// JavaScript Interactions & Animations
// ═══════════════════════════════════════════════════

// ═══════════════════════════════════════════════════
// BASE DE DONNÉES OFFRES
// ═══════════════════════════════════════════════════

const jobsDatabase = [
    {
        id: 1,
        company: "Airbus",
        title: "Stage Ingénieur Aéronautique",
        type: "stage",
        description: "Rejoignez notre équipe d'ingénierie pour travailler sur les programmes A320 et A350. Formation en analyse structurelle.",
        location: "Toulouse",
        posted: "Il y a 2h"
    },
    {
        id: 2,
        company: "Capgemini",
        title: "Consultant Junior Data Analytics",
        type: "cdi",
        description: "Intégrez notre practice Data & AI. Formation aux outils Microsoft Power BI et Python. Projets clients innovants.",
        location: "Toulouse",
        posted: "Il y a 4h"
    },
    {
        id: 3,
        company: "BNP Paribas",
        title: "Chargé de Clientèle",
        type: "cdd",
        description: "Accompagnez nos clients particuliers dans leurs projets financiers. Formation bancaire assurée. CDD 6 mois.",
        location: "Toulouse",
        posted: "Il y a 1j"
    },
    {
        id: 4,
        company: "L'Oréal",
        title: "Stage Marketing Digital",
        type: "stage",
        description: "Participez au lancement de nos campagnes digitales. Création de contenu, analyse de performance, réseaux sociaux.",
        location: "Paris",
        posted: "Il y a 1j"
    },
    {
        id: 5,
        company: "Deloitte",
        title: "Auditeur Junior",
        type: "stage",
        description: "Missions d'audit financier chez nos clients grands comptes. Formation aux normes IFRS. Stage pré-embauche.",
        location: "Toulouse",
        posted: "Il y a 2j"
    },
    {
        id: 6,
        company: "Decathlon",
        title: "Vendeur Sportif",
        type: "petit-boulot",
        description: "Passionné de sport ? Rejoignez notre équipe pour conseiller nos clients. Horaires flexibles compatibles études.",
        location: "Toulouse",
        posted: "Il y a 3j"
    }
];

// ═══════════════════════════════════════════════════
// INITIALISATION
// ═══════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initMobileMenu();
    initCounters();
    initLineAnimations();
    initJobsDisplay();
    initScrollReveal();
});

// ═══════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════

function initNavigation() {
    const nav = document.getElementById('nav');
    const navLinks = document.querySelectorAll('.nav-link');

    // Effet scrolled sur la nav
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    // Active state sur scroll
    const sections = document.querySelectorAll('.section');

    const observerOptions = {
        root: null,
        rootMargin: '-50% 0px -50% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.id;
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        if (section.id) {
            observer.observe(section);
        }
    });
}

// ═══════════════════════════════════════════════════
// MENU MOBILE
// ═══════════════════════════════════════════════════

function initMobileMenu() {
    const toggle = document.getElementById('navMobileToggle');
    const menu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (toggle) {
        toggle.addEventListener('click', () => {
            menu.classList.toggle('active');
        });

        // Fermer le menu au clic sur un lien
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                menu.classList.remove('active');
            });
        });
    }
}

// ═══════════════════════════════════════════════════
// COMPTEURS ANIMÉS
// ═══════════════════════════════════════════════════

function initCounters() {
    const statNumbers = document.querySelectorAll('.stat-number');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                entry.target.classList.add('counted');
                const target = parseInt(entry.target.getAttribute('data-target'));
                animateCounter(entry.target, 0, target, 1200);
            }
        });
    }, observerOptions);

    statNumbers.forEach(stat => observer.observe(stat));
}

function animateCounter(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            element.textContent = end;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// ═══════════════════════════════════════════════════
// LIGNES CONNECTEURS
// ═══════════════════════════════════════════════════

function initLineAnimations() {
    const connectorLine = document.querySelector('.connector-line');
    const processConnector = document.querySelector('.process-connector');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.3
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                entry.target.classList.add('animated');
            }
        });
    }, observerOptions);

    if (connectorLine) observer.observe(connectorLine);
    if (processConnector) observer.observe(processConnector);
}

// ═══════════════════════════════════════════════════
// AFFICHAGE DES OFFRES
// ═══════════════════════════════════════════════════

function initJobsDisplay() {
    const jobsGrid = document.getElementById('jobsGrid');
    if (!jobsGrid) return;

    jobsGrid.innerHTML = '';

    jobsDatabase.forEach(job => {
        const jobCard = createJobCard(job);
        jobsGrid.appendChild(jobCard);
    });
}

function createJobCard(job) {
    const card = document.createElement('div');
    card.className = 'job-card';

    card.innerHTML = `
        <div class="job-card-header">
            <div class="job-company">${job.company}</div>
            <span class="job-badge ${job.type}">${getBadgeText(job.type)}</span>
        </div>
        <h3 class="job-title">${job.title}</h3>
        <p class="job-description">${job.description}</p>
        <div class="job-card-footer">
            <span class="job-location">📍 ${job.location}</span>
            <span class="job-time">${job.posted}</span>
        </div>
    `;

    card.addEventListener('click', () => {
        showJobDetails(job);
    });

    return card;
}

function getBadgeText(type) {
    const badges = {
        'stage': 'Stage',
        'cdd': 'CDD',
        'cdi': 'CDI',
        'petit-boulot': 'Job'
    };
    return badges[type] || type;
}

function showJobDetails(job) {
    // Simulation de modal ou navigation vers page détail
    alert(`${job.title}\n\n${job.company}\n${job.location}\n\n${job.description}\n\nPour postuler : contact@easyjob-tbs.fr`);
}

// ═══════════════════════════════════════════════════
// SCROLL REVEAL
// ═══════════════════════════════════════════════════

function initScrollReveal() {
    const jobCards = document.querySelectorAll('.job-card');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, observerOptions);

    jobCards.forEach(card => {
        observer.observe(card);
    });
}

// ═══════════════════════════════════════════════════
// SMOOTH SCROLL
// ═══════════════════════════════════════════════════

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// ═══════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════

window.EasyJobApp = {
    jobsDatabase,
    createJobCard,
    showJobDetails
};

console.log('✨ EasyJob "Connexions" initialized');
