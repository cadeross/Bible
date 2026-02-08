"use client";

import { useEffect, useRef } from "react";

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
}

export function ParticlesBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationId: number;
        let particles: Particle[] = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const createParticle = (): Particle => ({
            x: Math.random() * canvas.width,
            y: canvas.height + Math.random() * 100,
            vx: (Math.random() - 0.5) * 0.3,
            vy: -Math.random() * 0.5 - 0.2,
            size: Math.random() * 2 + 1,
            opacity: Math.random() * 0.3 + 0.1,
        });

        const initParticles = () => {
            particles = [];
            const count = Math.min(50, Math.floor((canvas.width * canvas.height) / 20000));
            for (let i = 0; i < count; i++) {
                const p = createParticle();
                p.y = Math.random() * canvas.height; // Spread initially
                particles.push(p);
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Get computed primary color from CSS
            const style = getComputedStyle(document.documentElement);
            const primaryColor = style.getPropertyValue("--primary").trim() || "#646cff";

            particles.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;

                // Reset particle when it goes off top
                if (p.y < -10) {
                    particles[i] = createParticle();
                }

                // Slight horizontal drift
                p.vx += (Math.random() - 0.5) * 0.01;
                p.vx = Math.max(-0.5, Math.min(0.5, p.vx));

                // Draw particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `color-mix(in srgb, ${primaryColor} ${p.opacity * 100}%, transparent)`;
                ctx.fill();
            });

            animationId = requestAnimationFrame(animate);
        };

        resize();
        initParticles();
        animate();

        window.addEventListener("resize", resize);

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ opacity: 0.6 }}
        />
    );
}
