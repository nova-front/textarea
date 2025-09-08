import type React from 'react';
import { memo, useCallback, useEffect, useRef } from 'react';

// 绘制点
interface RangeProps {
  startOffset: number;
  endOffset: number;
  height: number;
}

interface WaveUnderlineProps {
  ranges: RangeProps[]; // 绘制位置
  color?: string; // 波浪线颜色
  width?: number;
  height?: number;
  top?: number;
  left?: number;
}

export const WaveUnderline: React.FC<WaveUnderlineProps> = memo(
  ({
    ranges = [],
    color = '#ff0000',
    width = 100,
    height = 100,
    top = 0,
    left = 0,
  }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // 绘制波浪线的方法
    const drawWavyLine = useCallback(
      (
        ctx: CanvasRenderingContext2D,
        startX: number,
        endX: number,
        y: number,
      ) => {
        ctx.beginPath();
        ctx.moveTo(startX, y);

        const wavelength = 8; // 波长
        const amplitude = 2; // 振幅

        for (let x = startX; x <= endX; x += 2) {
          const radians = ((x - startX) * Math.PI) / wavelength;
          ctx.lineTo(x, y + Math.sin(radians) * amplitude);
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      },
      [color],
    );

    // 绘制主逻辑
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 高清屏适配
      const scale = window.devicePixelRatio;
      canvas.width = width * scale;
      canvas.height = height * scale;
      ctx.scale(scale, scale);

      // 清空并重新绘制
      ctx.clearRect(0, 0, width, height);
      for (const range of ranges) {
        drawWavyLine(ctx, range.startOffset, range.endOffset, range.height - 1);
      }
    }, [width, height, ranges, drawWavyLine]);

    return (
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: `${top}px`,
          left: `${left}px`,
          width: `${width}px`,
          height: `${height}px`,
          pointerEvents: 'none',
          transform: 'translateZ(0)', // GPU 加速
        }}
      />
    );
  },
);
