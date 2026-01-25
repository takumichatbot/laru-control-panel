// src/components/NeuralBackground.tsx を以下の「安定版」に差し替えてください

'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';

export const NeuralBackground = () => {
  const [mounted, setMounted] = useState(false);
  const [size, setSize] = useState({ w: 1200, h: 1200 });

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setSize({ w: window.innerWidth, h: window.innerHeight });
    }
  }, []);

  // 【修正】背景の玉のデータを「固定」する
  // これにより、長文が届いてReactが再描画されても、背景が暴走しなくなります
  const blobs = useMemo(() => {
    return [...Array(5)].map((_, i) => ({
      id: i,
      size: Math.random() * 200 + 200,
      color: i % 2 === 0 ? '#06b6d4' : '#ec4899',
      startX: Math.random() * 100,
      startY: Math.random() * 100,
      duration: Math.random() * 20 + 20,
    }));
  }, []);

  if (!mounted) return <div className="fixed inset-0 bg-black -z-50" />;

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-[#000]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(20,20,30,0.4)_0%,_#000_100%)]" />
      {blobs.map((blob) => (
        <motion.div
          key={blob.id}
          className="absolute rounded-full blur-[100px] opacity-20"
          style={{
            background: blob.color,
            width: blob.size,
            height: blob.size,
            left: `${blob.startX}%`,
            top: `${blob.startY}%`,
          }}
          animate={{
            x: [0, 50, -50, 0],
            y: [0, -50, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: blob.duration,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};