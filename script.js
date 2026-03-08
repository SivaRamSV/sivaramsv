// Animated star field background
const canvas = document.getElementById('stars');
const ctx = canvas.getContext('2d');

let stars = [];
const STAR_COUNT = 200;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function createStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.5 + 0.5,
            speed: Math.random() * 0.3 + 0.1,
            opacity: Math.random() * 0.5 + 0.3,
            twinkle: Math.random() * Math.PI * 2
        });
    }
}

function drawStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const time = Date.now() * 0.001;
    
    stars.forEach(star => {
        // Twinkle effect
        const opacity = star.opacity + Math.sin(time * 2 + star.twinkle) * 0.2;
        
        // Draw star with glow
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, opacity)})`;
        ctx.fill();
        
        // Subtle movement
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });
    
    requestAnimationFrame(drawStars);
}

window.addEventListener('resize', () => {
    resize();
    createStars();
});

resize();
createStars();
drawStars();

// Add subtle parallax on mouse move
document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 10;
    const y = (e.clientY / window.innerHeight - 0.5) * 10;
    
    stars.forEach((star, i) => {
        if (i % 3 === 0) {
            star.x += x * 0.01;
            star.y += y * 0.01;
        }
    });
});
