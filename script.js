// ====================================================================
// MONOCHROME REACTIVE SQUARE GRID BACKGROUND (BLACK & WHITE)
// ====================================================================

(function() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = document.getElementById('grid-canvas');
    const ctx = canvas.getContext('2d');

    // Mouse Tracking
    const mouse = {
        x: -9999,
        y: -9999,
        targetX: -9999,
        targetY: -9999,
        vx: 0,
        vy: 0,
        lastX: 0,
        lastY: 0
    };

    window.addEventListener('mousemove', (e) => {
        mouse.targetX = e.clientX;
        mouse.targetY = e.clientY;
        mouse.vx = e.clientX - mouse.lastX;
        mouse.vy = e.clientY - mouse.lastY;
        mouse.lastX = e.clientX;
        mouse.lastY = e.clientY;
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
        mouse.targetX = -9999;
        mouse.targetY = -9999;
    });

    // Square Grid Setup
    const CELL_SIZE = 54; // Width & height of each square tile
    const MOUSE_RADIUS = 180; // Radius of interaction
    let cols = 0, rows = 0;
    let gridNodes = [];
    let litSquares = new Map(); // Track glowing squares with decay

    function resizeGrid() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        cols = Math.ceil(w / CELL_SIZE) + 1;
        rows = Math.ceil(h / CELL_SIZE) + 1;
        const startX = (w - (cols - 1) * CELL_SIZE) / 2;
        const startY = (h - (rows - 1) * CELL_SIZE) / 2;

        gridNodes = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const px = startX + c * CELL_SIZE;
                const py = startY + r * CELL_SIZE;
                gridNodes.push({
                    restX: px,
                    restY: py,
                    x: px,
                    y: py,
                    vx: 0,
                    vy: 0
                });
            }
        }
    }

    function updateGridPhysics() {
        const mx = mouse.x;
        const my = mouse.y;

        // Physics step on each grid intersection node
        for (let i = 0; i < gridNodes.length; i++) {
            const node = gridNodes[i];
            const dx = node.x - mx;
            const dy = node.y - my;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Move / repel away from cursor when hovered
            if (dist < MOUSE_RADIUS && dist > 0.1) {
                const force = (1 - dist / MOUSE_RADIUS) * 35;
                const nx = dx / dist;
                const ny = dy / dist;
                node.vx += nx * force * 0.18;
                node.vy += ny * force * 0.18;
            }

            // Spring return to rest grid square position
            const springX = node.restX - node.x;
            const springY = node.restY - node.y;
            node.vx += 0.05 * springX;
            node.vy += 0.05 * springY;

            // Damping (elastic wobble)
            node.vx *= 0.84;
            node.vy *= 0.84;

            node.x += node.vx;
            node.y += node.vy;
        }

        // Ignite the square cell under the mouse
        if (mx > 0 && my > 0) {
            const startX = (window.innerWidth - (cols - 1) * CELL_SIZE) / 2;
            const startY = (window.innerHeight - (rows - 1) * CELL_SIZE) / 2;
            const colIdx = Math.floor((mx - startX) / CELL_SIZE);
            const rowIdx = Math.floor((my - startY) / CELL_SIZE);

            if (colIdx >= 0 && colIdx < cols - 1 && rowIdx >= 0 && rowIdx < rows - 1) {
                const key = `${colIdx}_${rowIdx}`;
                litSquares.set(key, { col: colIdx, row: rowIdx, alpha: 1.0 });
            }
        }
    }

    function drawReactiveSquareGrid() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        ctx.clearRect(0, 0, w, h);

        const mx = mouse.x;
        const my = mouse.y;

        // 1. Draw glowing square cell fills (Monochrome White Glow)
        litSquares.forEach((sq, key) => {
            sq.alpha -= 0.02; // Smooth fade decay
            if (sq.alpha <= 0) {
                litSquares.delete(key);
                return;
            }

            const i0 = sq.row * cols + sq.col;
            const i1 = sq.row * cols + sq.col + 1;
            const i2 = (sq.row + 1) * cols + sq.col + 1;
            const i3 = (sq.row + 1) * cols + sq.col;

            const n0 = gridNodes[i0];
            const n1 = gridNodes[i1];
            const n2 = gridNodes[i2];
            const n3 = gridNodes[i3];

            if (n0 && n1 && n2 && n3) {
                ctx.beginPath();
                ctx.moveTo(n0.x, n0.y);
                ctx.lineTo(n1.x, n1.y);
                ctx.lineTo(n2.x, n2.y);
                ctx.lineTo(n3.x, n3.y);
                ctx.closePath();

                ctx.fillStyle = `rgba(255, 255, 255, ${sq.alpha * 0.18})`;
                ctx.fill();
            }
        });

        // 2. Ambient radial cursor light (Soft White Spotlight)
        if (mx > -100 && my > -100) {
            const radialLight = ctx.createRadialGradient(mx, my, 0, mx, my, 340);
            radialLight.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
            radialLight.addColorStop(0.5, 'rgba(255, 255, 255, 0.03)');
            radialLight.addColorStop(1, 'transparent');
            ctx.fillStyle = radialLight;
            ctx.fillRect(0, 0, w, h);
        }

        // 3. Draw horizontal grid lines
        ctx.lineWidth = 0.8;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols - 1; c++) {
                const n1 = gridNodes[r * cols + c];
                const n2 = gridNodes[r * cols + c + 1];

                const midX = (n1.x + n2.x) * 0.5;
                const midY = (n1.y + n2.y) * 0.5;
                const dist = Math.sqrt((midX - mx) ** 2 + (midY - my) ** 2);
                const proximity = Math.max(0, 1 - dist / 240);

                const lineAlpha = 0.07 + proximity * 0.45;
                ctx.strokeStyle = `rgba(255, 255, 255, ${lineAlpha})`;

                ctx.beginPath();
                ctx.moveTo(n1.x, n1.y);
                ctx.lineTo(n2.x, n2.y);
                ctx.stroke();
            }
        }

        // 4. Draw vertical grid lines
        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows - 1; r++) {
                const n1 = gridNodes[r * cols + c];
                const n2 = gridNodes[(r + 1) * cols + c];

                const midX = (n1.x + n2.x) * 0.5;
                const midY = (n1.y + n2.y) * 0.5;
                const dist = Math.sqrt((midX - mx) ** 2 + (midY - my) ** 2);
                const proximity = Math.max(0, 1 - dist / 240);

                const lineAlpha = 0.07 + proximity * 0.45;
                ctx.strokeStyle = `rgba(255, 255, 255, ${lineAlpha})`;

                ctx.beginPath();
                ctx.moveTo(n1.x, n1.y);
                ctx.lineTo(n2.x, n2.y);
                ctx.stroke();
            }
        }

        // 5. Draw corner dots on every square intersection
        for (let i = 0; i < gridNodes.length; i++) {
            const node = gridNodes[i];
            const dist = Math.sqrt((node.x - mx) ** 2 + (node.y - my) ** 2);
            const proximity = Math.max(0, 1 - dist / 200);

            const size = 1.6 + proximity * 2.4;
            const dotAlpha = 0.16 + proximity * 0.7;

            ctx.fillStyle = `rgba(255, 255, 255, ${dotAlpha})`;
            ctx.fillRect(node.x - size * 0.5, node.y - size * 0.5, size, size);
        }
    }

    function loop() {
        // Smooth mouse lerp
        mouse.x += (mouse.targetX - mouse.x) * 0.2;
        mouse.y += (mouse.targetY - mouse.y) * 0.2;

        updateGridPhysics();
        drawReactiveSquareGrid();

        requestAnimationFrame(loop);
    }

    window.addEventListener('resize', resizeGrid);
    resizeGrid();

    if (!prefersReducedMotion) {
        requestAnimationFrame(loop);
    }

    // ================================================================
    // SPOTLIGHT CARDS
    // ================================================================
    const spotlightCards = document.querySelectorAll('.stat-card, .project-card-inner, .blog-card, .education-card, .service-card, .contact-card');

    spotlightCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    // ================================================================
    // NAVIGATION & SCROLL OBSERVERS
    // ================================================================
    const nav = document.getElementById('nav');
    const navToggle = document.getElementById('nav-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }, { passive: true });

    navToggle.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.contains('open');
        mobileMenu.classList.toggle('open');
        navToggle.classList.toggle('active');
        navToggle.setAttribute('aria-expanded', !isOpen);
        document.body.style.overflow = isOpen ? '' : 'hidden';
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('open');
            navToggle.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        });
    });

    // Enhanced Easing Smooth Anchor Scrolling
    function smoothScrollTo(targetY, duration = 650) {
        const startY = window.pageYOffset;
        const diff = targetY - startY;
        let start = null;

        function step(timestamp) {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            // EaseInOutCubic curve
            const ease = progress < 0.5 
                ? 4 * progress * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            window.scrollTo(0, startY + diff * ease);

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        }
        window.requestAnimationFrame(step);
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (targetId === '#' || !targetId) return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const navHeight = nav ? nav.offsetHeight : 0;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 10;
                if (prefersReducedMotion) {
                    window.scrollTo(0, targetPosition);
                } else {
                    smoothScrollTo(targetPosition, 600);
                }
            }
        });
    });

    // Section reveal on scroll
    const revealSections = document.querySelectorAll('.reveal-section');
    if (!prefersReducedMotion) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

        revealSections.forEach(sec => revealObserver.observe(sec));
    } else {
        revealSections.forEach(sec => sec.classList.add('visible'));
    }

    // Active nav highlighting
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a');
    const activeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
            }
        });
    }, { threshold: 0.3, rootMargin: '-60px 0px -40% 0px' });

    sections.forEach(sec => activeObserver.observe(sec));
})();
