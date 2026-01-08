// ===========================
// Configuration & Data
// ===========================

const jobsDatabase = [
    {
        id: 1,
        company: "Airbus",
        title: "Stage Ingénieur Aéronautique",
        type: "stage",
        description: "Rejoignez notre équipe d'ingénierie pour travailler sur les programmes A320 et A350. Formation en analyse structurelle et aérodynamique.",
        location: "Toulouse",
        posted: "Il y a 2h",
        badge: "stage"
    },
    {
        id: 2,
        company: "Decathlon",
        title: "Vendeur Sportif - Temps Partiel",
        type: "petit-boulot",
        description: "Passionné de sport ? Rejoignez notre équipe pour conseiller nos clients. Horaires flexibles compatibles avec les études.",
        location: "Toulouse",
        posted: "Il y a 5h",
        badge: "petit-boulot"
    },
    {
        id: 3,
        company: "Capgemini",
        title: "Consultant Junior Data Analytics",
        type: "cdi",
        description: "Intégrez notre practice Data & AI. Formation assurée aux outils Microsoft Power BI et Python. Déplacements clients occasionnels.",
        location: "Toulouse",
        posted: "Il y a 1j",
        badge: "cdi"
    },
    {
        id: 4,
        company: "BNP Paribas",
        title: "Chargé de Clientèle - CDD 6 mois",
        type: "cdd",
        description: "Accompagnez nos clients particuliers dans leurs projets financiers. Formation bancaire assurée. CDD avec possibilité de CDI.",
        location: "Toulouse",
        posted: "Il y a 1j",
        badge: "cdd"
    },
    {
        id: 5,
        company: "L'Oréal",
        title: "Stage Marketing Digital",
        type: "stage",
        description: "Participez au lancement de nos campagnes digitales. Création de contenu, analyse de performance, réseaux sociaux.",
        location: "Paris",
        posted: "Il y a 2j",
        badge: "stage"
    },
    {
        id: 6,
        company: "Carrefour",
        title: "Hôte de Caisse - Week-ends",
        type: "petit-boulot",
        description: "Travail uniquement les samedis et dimanches. Horaires compatibles avec vos études. Équipe dynamique.",
        location: "Toulouse",
        posted: "Il y a 2j",
        badge: "petit-boulot"
    },
    {
        id: 7,
        company: "Sopra Steria",
        title: "Développeur Full Stack Junior",
        type: "cdi",
        description: "React, Node.js, MongoDB. Projets innovants pour grands comptes. Télétravail 2j/semaine. Ambiance startup.",
        location: "Toulouse",
        posted: "Il y a 3j",
        badge: "cdi"
    },
    {
        id: 8,
        company: "Orange",
        title: "Conseiller Client - CDD 3 mois",
        type: "cdd",
        description: "Support technique et commercial en boutique. Formation produits assurée. Prime sur objectifs.",
        location: "Toulouse",
        posted: "Il y a 3j",
        badge: "cdd"
    },
    {
        id: 9,
        company: "Deloitte",
        title: "Auditeur Junior - Stage",
        type: "stage",
        description: "Missions d'audit financier chez nos clients grands comptes. Formation aux normes IFRS. Stage pré-embauche.",
        location: "Toulouse",
        posted: "Il y a 4j",
        badge: "stage"
    }
];

// ===========================
// Navigation & Scroll
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initMobileMenu();
    initSmoothScroll();
    initStatsAnimation();
    initJobsDisplay();
    initFilters();
    initForm();
    initScrollEffects();
});

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section, .hero');

    // Observer pour détecter les sections visibles
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

function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
        });

        // Fermer le menu au clic sur un lien
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
            });
        });
    }
}

function initSmoothScroll() {
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
}

function initScrollEffects() {
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.boxShadow = 'none';
        }

        lastScroll = currentScroll;
    });
}

// ===========================
// Stats Animation
// ===========================

function initStatsAnimation() {
    const statNumbers = document.querySelectorAll('.stat-number');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                entry.target.classList.add('animated');
                animateValue(entry.target, 0, parseInt(entry.target.getAttribute('data-target')), 2000);
            }
        });
    }, observerOptions);

    statNumbers.forEach(stat => observer.observe(stat));
}

function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            element.textContent = end.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
}

// ===========================
// Jobs Display & Filters
// ===========================

function initJobsDisplay() {
    displayJobs(jobsDatabase);
}

function displayJobs(jobs) {
    const jobsGrid = document.getElementById('jobsGrid');
    if (!jobsGrid) return;

    jobsGrid.innerHTML = '';

    jobs.forEach((job, index) => {
        const jobCard = createJobCard(job);
        jobCard.style.animationDelay = `${index * 0.1}s`;
        jobsGrid.appendChild(jobCard);
    });
}

function createJobCard(job) {
    const card = document.createElement('div');
    card.className = 'job-card';
    card.setAttribute('data-type', job.type);

    card.innerHTML = `
        <div class="job-header">
            <div>
                <div class="job-company">${job.company}</div>
                <h3 class="job-title">${job.title}</h3>
            </div>
            <span class="job-badge">${job.badge}</span>
        </div>
        <p class="job-description">${job.description}</p>
        <div class="job-footer">
            <span class="job-location">📍 ${job.location}</span>
            <span class="job-time">🕐 ${job.posted}</span>
        </div>
    `;

    card.addEventListener('click', () => {
        showJobDetails(job);
    });

    return card;
}

function showJobDetails(job) {
    // Ici, vous pouvez implémenter une modal pour afficher les détails
    alert(`Détails du poste:\n\n${job.title}\n${job.company}\n\n${job.description}\n\nPour postuler, contactez: contact@easyjob-tbs.fr`);
}

function initFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Retirer la classe active de tous les boutons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Ajouter la classe active au bouton cliqué
            button.classList.add('active');

            const filter = button.getAttribute('data-filter');
            filterJobs(filter);
        });
    });
}

function filterJobs(filter) {
    if (filter === 'all') {
        displayJobs(jobsDatabase);
    } else {
        const filteredJobs = jobsDatabase.filter(job => job.type === filter);
        displayJobs(filteredJobs);
    }
}

// ===========================
// Form Handling
// ===========================

function initForm() {
    const contactForm = document.querySelector('.contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', handleFormSubmit);
    }
}

function handleFormSubmit(e) {
    e.preventDefault();

    const formData = {
        company: document.getElementById('company').value,
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        jobTitle: document.getElementById('job-title').value,
        contractType: document.getElementById('contract-type').value,
        description: document.getElementById('description').value
    };

    // Validation basique
    if (!formData.company || !formData.name || !formData.email || !formData.jobTitle || !formData.contractType || !formData.description) {
        showNotification('Veuillez remplir tous les champs requis.', 'error');
        return;
    }

    // Validation email
    if (!isValidEmail(formData.email)) {
        showNotification('Veuillez entrer une adresse email valide.', 'error');
        return;
    }

    // Simulation d'envoi
    showNotification('Votre offre a été envoyée avec succès ! Notre équipe vous contactera sous 24h.', 'success');

    // Réinitialiser le formulaire
    e.target.reset();

    // En production, vous enverriez ces données à votre backend
    console.log('Données du formulaire:', formData);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showNotification(message, type = 'info') {
    // Créer la notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Styles inline pour la notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '100px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '0.5rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        zIndex: '9999',
        maxWidth: '400px',
        fontSize: '0.875rem',
        fontWeight: '500',
        animation: 'slideIn 0.3s ease',
        backgroundColor: type === 'success' ? '#10b981' : '#ef4444',
        color: '#ffffff'
    });

    document.body.appendChild(notification);

    // Retirer après 5 secondes
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Ajouter les animations CSS pour les notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===========================
// Utility Functions
// ===========================

// Debounce function pour optimiser les performances
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===========================
// Export pour utilisation externe
// ===========================

window.EasyJobApp = {
    displayJobs,
    filterJobs,
    showJobDetails,
    jobsDatabase
};

console.log('🚀 EasyJob App initialized successfully!');
