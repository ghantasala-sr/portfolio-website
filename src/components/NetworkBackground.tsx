"use client";

import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  type: "pod" | "service" | "node";
  pulsePhase: number;
}

const NODE_COLORS = {
  pod: { fill: "rgba(99, 102, 241, 0.6)", stroke: "rgba(99, 102, 241, 0.3)" },
  service: {
    fill: "rgba(34, 211, 238, 0.5)",
    stroke: "rgba(34, 211, 238, 0.3)",
  },
  node: {
    fill: "rgba(168, 85, 247, 0.4)",
    stroke: "rgba(168, 85, 247, 0.25)",
  },
};

export default function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Initialize nodes
    const nodeCount = Math.min(Math.floor(window.innerWidth / 40), 35);
    const types: Node["type"][] = ["pod", "service", "node"];
    nodesRef.current = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 2,
      type: types[Math.floor(Math.random() * types.length)],
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    const connectionDistance = 180;

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const nodes = nodesRef.current;

      // Update positions
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        node.x = Math.max(0, Math.min(canvas.width, node.x));
        node.y = Math.max(0, Math.min(canvas.height, node.y));
      });

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.15;

            // Data flow animation (dashed line moving)
            ctx.beginPath();
            ctx.setLineDash([4, 6]);
            ctx.lineDashOffset = -time * 0.02;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }

      // Draw nodes
      nodes.forEach((node) => {
        const pulse = Math.sin(time * 0.002 + node.pulsePhase) * 0.3 + 0.7;
        const colors = NODE_COLORS[node.type];

        // Glow
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = colors.stroke.replace(
          /[\d.]+\)$/,
          `${0.08 * pulse})`
        );
        ctx.fill();

        // Node body
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * pulse, 0, Math.PI * 2);
        ctx.fillStyle = colors.fill;
        ctx.fill();

        // Border ring (K8s pod style)
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}
