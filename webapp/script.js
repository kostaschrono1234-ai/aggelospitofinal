/* ===== AGGELOSPITO - Premium Effects JS ===== */
/* Performance-first: rAF-throttled scroll, GPU compositing, no layout thrashing */

document.addEventListener('DOMContentLoaded', () => {

    // ===== LOADING SCREEN =====
    const loader = document.getElementById('pageLoader');
    if (loader) {
        window.addEventListener('load', () => {
            loader.classList.add('loaded');
            setTimeout(() => loader.remove(), 600);
        });
        // Fallback: remove after 3s even if load doesn't fire
        setTimeout(() => {
            if (loader && loader.parentNode) {
                loader.classList.add('loaded');
                setTimeout(() => { if (loader.parentNode) loader.remove(); }, 600);
            }
        }, 3000);
    }

    // ===== SCROLL PROGRESS BAR (rAF-throttled) =====
    const progressBar = document.getElementById('scrollProgress');
    let ticking = false;

    function updateScrollProgress() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        if (progressBar) progressBar.style.width = progress + '%';
        ticking = false;
    }

    // ===== GLASSMORPHISM HEADER + BACK-TO-TOP (combined scroll handler) =====
    const header = document.querySelector('.header');
    const backToTop = document.getElementById('backToTop');

    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrollY = window.scrollY;

                // Header glassmorphism
                if (header) {
                    if (scrollY > 60) header.classList.add('scrolled');
                    else header.classList.remove('scrolled');
                }

                // Back to top button
                if (backToTop) {
                    if (scrollY > 500) backToTop.classList.add('visible');
                    else backToTop.classList.remove('visible');
                }

                // Scroll progress
                updateScrollProgress();

                ticking = false;
            });
            ticking = true;
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // Back to top click
    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ===== MOBILE MENU =====
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navOverlay = document.querySelector('.nav-overlay');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navLinks.classList.toggle('open');
            if (navOverlay) navOverlay.classList.toggle('active');
            document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
        });
    }

    if (navOverlay) {
        navOverlay.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            navLinks.classList.remove('open');
            navOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('open')) {
                menuToggle.classList.remove('active');
                navLinks.classList.remove('open');
                if (navOverlay) navOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // ===== SCROLL ANIMATIONS (IntersectionObserver — zero scroll cost) =====
    const animateElements = document.querySelectorAll('.animate-on-scroll, .animate-slide-left, .animate-slide-right, .animate-scale');

    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                scrollObserver.unobserve(entry.target);
            }
        });
    }, { root: null, rootMargin: '0px 0px -60px 0px', threshold: 0.12 });

    animateElements.forEach(el => scrollObserver.observe(el));

    // ===== TYPEWRITER EFFECT ON HERO H1 =====
    const heroH1 = document.querySelector('.hero .hero-content h1');
    if (heroH1 && !heroH1.dataset.typed) {
        heroH1.dataset.typed = 'true';
        const fullText = heroH1.textContent;
        heroH1.textContent = '';
        heroH1.style.visibility = 'visible';
        heroH1.classList.add('typewriter-active');
        let charIndex = 0;

        function typeChar() {
            if (charIndex < fullText.length) {
                heroH1.textContent += fullText[charIndex];
                charIndex++;
                setTimeout(typeChar, 45);
            } else {
                heroH1.classList.remove('typewriter-active');
                heroH1.classList.add('typewriter-done');
            }
        }

        // Start after a small delay so page is visually ready
        setTimeout(typeChar, 800);
    }

    // ===== ANIMATED COUNTERS =====
    const counterElements = document.querySelectorAll('[data-count]');

    if (counterElements.length > 0) {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.dataset.count);
                    const suffix = el.dataset.suffix || '';
                    const duration = 1800;
                    const start = performance.now();

                    function animateCount(now) {
                        const elapsed = now - start;
                        const progress = Math.min(elapsed / duration, 1);
                        // Ease out cubic
                        const ease = 1 - Math.pow(1 - progress, 3);
                        const current = Math.floor(ease * target);
                        el.textContent = current + suffix;
                        if (progress < 1) requestAnimationFrame(animateCount);
                        else el.textContent = target + suffix;
                    }

                    requestAnimationFrame(animateCount);
                    counterObserver.unobserve(el);
                }
            });
        }, { threshold: 0.5 });

        counterElements.forEach(el => counterObserver.observe(el));
    }

    // ===== 3D TILT EFFECT ON IMAGES =====
    const tiltElements = document.querySelectorAll('.tilt-3d');

    tiltElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -8;
            const rotateY = ((x - centerX) / centerX) * 8;

            el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
            el.style.boxShadow = `${-rotateY * 2}px ${rotateX * 2}px 40px rgba(0,0,0,0.2)`;
        });

        el.addEventListener('mouseleave', () => {
            el.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale(1)';
            el.style.boxShadow = '';
        });
    });

    // ===== FAQ ACCORDION =====
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', () => {
                const isOpen = item.classList.contains('open');
                faqItems.forEach(i => i.classList.remove('open'));
                if (!isOpen) item.classList.add('open');
            });
        }
    });

    // ===== SET ACTIVE NAV LINK =====
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    document.querySelectorAll('.nav-links a').forEach(a => {
        const href = a.getAttribute('href');
        if (!href) return;
        const linkPath = href.replace(/\/$/, '') || '/';
        if (currentPath === '/' || currentPath === '/index.html' || currentPath === '') {
            if (linkPath === '/' || linkPath === 'index.html' || linkPath === './index.html') {
                a.classList.add('active');
            }
        } else if (linkPath === currentPath || currentPath.endsWith(linkPath)) {
            a.classList.add('active');
        }
    });

    // ===== STAGGERED ANIMATION DELAYS =====
    document.querySelectorAll('.features-grid .feature-card').forEach((card, i) => {
        card.style.transitionDelay = `${i * 0.1}s`;
    });

    document.querySelectorAll('.montessori-grid .montessori-item').forEach((item, i) => {
        item.style.transitionDelay = `${i * 0.08}s`;
    });

    document.querySelectorAll('.gallery-grid .gallery-item, .photos-grid .gallery-item').forEach((item, i) => {
        item.style.transitionDelay = `${i * 0.06}s`;
    });

    document.querySelectorAll('.activities-grid .activity-card').forEach((card, i) => {
        card.style.transitionDelay = `${i * 0.1}s`;
    });

    document.querySelectorAll('.reviews-grid .review-card').forEach((card, i) => {
        card.style.transitionDelay = `${i * 0.15}s`;
    });

    // ===== LAZY LOAD IMAGES (native) =====
    document.querySelectorAll('img:not([loading])').forEach(img => {
        img.setAttribute('loading', 'lazy');
    });

    // ===== SMOOTH SECTION DIVIDER REVEAL =====
    document.querySelectorAll('.section-divider').forEach(divider => {
        scrollObserver.observe(divider);
    });

    // ===== LOAD MORE REVIEWS BUTTON =====
    const loadMoreReviewsBtn = document.getElementById('loadMoreReviewsBtn');
    if (loadMoreReviewsBtn) {
        let isExpanded = false;
        loadMoreReviewsBtn.addEventListener('click', function () {
            const hiddenReviews = document.querySelectorAll('.hidden-review');
            isExpanded = !isExpanded;

            if (isExpanded) {
                // Show reviews
                hiddenReviews.forEach(review => {
                    review.style.display = 'block';
                    setTimeout(() => {
                        review.style.opacity = '1';
                        review.classList.add('visible');
                    }, 50);
                });
                this.textContent = 'Δείτε λιγότερα';
            } else {
                // Hide reviews
                hiddenReviews.forEach(review => {
                    review.style.opacity = '0';
                    review.classList.remove('visible');
                    setTimeout(() => {
                        review.style.display = 'none';
                    }, 300); // Wait for fade out
                });
                this.textContent = 'Διαβάστε περισσότερα!';

                // Optional: scroll slightly up if it feels disconnected, but keeping it simple for now
            }
        });
    }

});
