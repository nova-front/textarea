interface WaveData {
  startOffset: number;
  endOffset: number;
  height: number;
}

interface GenerateOptions {
  canvasWidth: number;
  canvasHeight: number;
  fontSize?: number; // 字体大小（单位：px）
  lineHeightMultiplier?: number; // 行高系数（默认1.5）
  minWaveLength?: number; // 默认20px
  maxWaveLength?: number; // 默认100px
}

// 生成测试数据的方法【实际不需要用到】
export const generateTestData = (options: GenerateOptions) => {
  const {
    canvasWidth,
    canvasHeight,
    fontSize = 12,
    lineHeightMultiplier = 1.5,
    minWaveLength = 20,
    maxWaveLength = 100,
  } = options;

  // 计算行高
  const lineHeight = fontSize * lineHeightMultiplier;

  const waves: WaveData[] = [];
  let currentY = lineHeight; // 初始Y坐标为行高

  while (waves.length < 1000 && currentY <= canvasHeight) {
    let currentX = 0;

    // 生成单行波浪线
    while (currentX < canvasWidth) {
      const remainingWidth = canvasWidth - currentX;
      if (remainingWidth < minWaveLength) break;

      const waveLength = Math.min(
        Math.random() * (maxWaveLength - minWaveLength) + minWaveLength,
        remainingWidth,
      );

      waves.push({
        startOffset: currentX,
        endOffset: currentX + waveLength,
        height: currentY, // 波浪线的Y位置为当前行高
      });

      currentX += waveLength + fontSize; // 字体大小作为水平间距
      if (waves.length >= 1000) break;
    }

    // 按行高下移
    currentY += lineHeight;
  }

  return waves.slice(0, 1000);
};
