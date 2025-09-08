# 性能优化指南

本文档介绍如何优化 @nova-fe/editor 的性能，以获得最佳的用户体验。

## 🎯 性能目标

- **初始化时间**: < 500ms
- **输入响应**: < 16ms (60 FPS)
- **拼写检查延迟**: < 500ms
- **大文本支持**: 50,000+ 字符
- **内存占用**: < 20MB

## ⚡ 核心优化策略

### 1. Web Worker 异步处理

所有拼写检查都在 Web Worker 中进行，避免阻塞主线程：

```typescript
// ✅ 推荐：异步拼写检查
<TextArea
  spellcheck={true}  // 自动使用 Web Worker
  placeholder="输入大量文本..."
/>

// ❌ 避免：同步处理大量文本
const checkText = (text: string) => {
  // 这会阻塞主线程
  return expensiveSpellCheck(text);
};
```

### 2. 增量检查

对于大文本，只检查变化的部分：

```typescript
// 自动启用增量检查（文本长度 > 1000 字符）
<TextArea
  value={longText}
  spellcheck={true}
  onChange={setText}
/>

// 手动配置增量检查
<ContentEditable
  spellcheck={true}
  spellcheckOptions={{
    useIncremental: true,
    contextWords: 5  // 包含上下文单词数
  }}
/>
```

### 3. LRU 缓存优化

内置 LRU 缓存提高重复检查的性能：

```typescript
// 缓存配置
const cacheConfig = {
  wordCache: 5000, // 单词检查缓存
  regionCache: 1000, // 区域检查缓存
  suggestionCache: 500, // 建议缓存
};
```

## 🚀 最佳实践

### 1. 防抖输入

使用防抖减少不必要的检查：

```typescript
import { useState, useMemo } from 'react';
import { ContentEditable } from '@nova-fe/editor';

function OptimizedEditor() {
  const [text, setText] = useState('');

  // ✅ 推荐：使用防抖
  const debouncedText = useDebounce(text, 300);

  return (
    <ContentEditable
      value={debouncedText}
      onChange={setText}
      spellcheck={true}
    />
  );
}

// 简单的防抖 Hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

### 2. 虚拟化长文本

对于超长文本，考虑使用虚拟化：

```typescript
import { ContentEditable } from '@nova-fe/editor';

function VirtualizedEditor({ text }: { text: string }) {
  // 只渲染可见区域的文本
  const visibleText = useMemo(() => {
    if (text.length < 10000) return text;

    // 实现虚拟化逻辑
    return getVisibleText(text, viewport);
  }, [text, viewport]);

  return (
    <ContentEditable
      value={visibleText}
      spellcheck={true}
      maxHeight="400px"
    />
  );
}
```

### 3. 批量词典操作

批量操作比单个操作更高效：

```typescript
import { useSpellChecker } from '@nova-fe/editor';

function DictionaryManager() {
  const { addWords, removeWords } = useSpellChecker();

  // ✅ 推荐：批量添加
  const addMultipleWords = (words: string[]) => {
    addWords(words);
  };

  // ❌ 避免：逐个添加
  const addWordsOneByOne = (words: string[]) => {
    words.forEach((word) => addWord(word)); // 效率低
  };
}
```

### 4. 内存管理

合理管理组件生命周期：

```typescript
import { useEffect } from 'react';
import { ContentEditable, useSpellChecker } from '@nova-fe/editor';

function ManagedEditor() {
  const { worker, clearCustomWords } = useSpellChecker();

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      // 清理大量自定义词典（如果不需要持久化）
      if (shouldClearOnUnmount) {
        clearCustomWords();
      }

      // Worker 会自动清理，无需手动处理
    };
  }, []);

  return <ContentEditable spellcheck={true} />;
}
```

## 📊 性能监控

### 1. 性能指标收集

```typescript
import { useSpellChecker } from '@nova-fe/editor';

function PerformanceMonitor() {
  const { worker } = useSpellChecker();

  useEffect(() => {
    if (!worker) return;

    // 监听性能指标
    worker.onmessage = (event) => {
      if (event.data.type === 'PERFORMANCE_METRICS') {
        const metrics = event.data.payload;
        console.log('拼写检查性能:', {
          checkTime: metrics.checkTime,
          cacheHitRate: metrics.cacheHitRate,
          wordsChecked: metrics.wordsChecked,
        });
      }
    };
  }, [worker]);
}
```

### 2. 性能分析工具

```typescript
// 性能分析 Hook
function usePerformanceAnalysis() {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    inputLatency: 0,
    spellCheckTime: 0,
  });

  const measureRender = useCallback(() => {
    const start = performance.now();

    return () => {
      const end = performance.now();
      setMetrics((prev) => ({
        ...prev,
        renderTime: end - start,
      }));
    };
  }, []);

  return { metrics, measureRender };
}
```

## 🔧 配置优化

### 1. 编辑器配置

```typescript
// 高性能配置
<TextArea
  spellcheck={true}
  spellcheckOptions={{
    debounceMs: 300,        // 防抖延迟
    maxTextLength: 50000,   // 最大检查长度
    cacheSize: 5000,        // 缓存大小
    useIncremental: true,   // 启用增量检查
    contextWords: 3         // 减少上下文单词数
  }}
  // 样式优化
  minHeight="200px"
  maxHeight="600px"        // 限制高度避免过度渲染
/>
```

### 2. 构建优化

```typescript
// Vite 配置优化
export default defineConfig({
  optimizeDeps: {
    include: ['typo-js'],
    exclude: ['@nova-fe/editor'], // 避免预构建
  },
  worker: {
    format: 'es',
    plugins: [
      // Worker 代码分割
      splitVendorChunkPlugin(),
    ],
  },
  build: {
    rollupOptions: {
      output: {
        // 代码分割
        manualChunks: {
          'editor-core': ['@nova-fe/editor'],
          dictionary: ['typo-js'],
        },
      },
    },
  },
});
```

## 🐛 性能问题排查

### 1. 常见性能问题

| 问题       | 症状             | 解决方案                 |
| ---------- | ---------------- | ------------------------ |
| 输入卡顿   | 输入延迟 > 100ms | 启用防抖、减少检查频率   |
| 内存泄漏   | 内存持续增长     | 检查事件监听器、清理缓存 |
| 初始化慢   | 首次加载 > 2s    | 预加载词典、代码分割     |
| 拼写检查慢 | 检查延迟 > 1s    | 启用增量检查、优化缓存   |

### 2. 调试工具

```typescript
// 性能调试组件
function PerformanceDebugger() {
  const { isReady, getCustomWordCount } = useSpellChecker();
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    // 收集性能指标
    const collectMetrics = () => {
      setMetrics({
        isReady,
        customWords: getCustomWordCount(),
        memory: (performance as any).memory?.usedJSHeapSize || 0,
        timing: performance.timing
      });
    };

    const interval = setInterval(collectMetrics, 1000);
    return () => clearInterval(interval);
  }, [isReady, getCustomWordCount]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      fontSize: '12px'
    }}>
      <h4>性能指标</h4>
      <pre>{JSON.stringify(metrics, null, 2)}</pre>
    </div>
  );
}
```

## 📈 性能基准测试

### 测试场景

1. **小文本** (< 1000 字符)
   - 目标：输入延迟 < 16ms
   - 拼写检查 < 100ms

2. **中等文本** (1000-10000 字符)
   - 目标：输入延迟 < 50ms
   - 拼写检查 < 300ms

3. **大文本** (10000-50000 字符)
   - 目标：输入延迟 < 100ms
   - 拼写检查 < 500ms

### 基准测试代码

```typescript
// 性能测试工具
async function runPerformanceTest(textSize: number) {
  const testText = generateTestText(textSize);
  const startTime = performance.now();

  // 模拟输入
  const editor = document.querySelector('[contenteditable]');
  editor.textContent = testText;
  editor.dispatchEvent(new Event('input', { bubbles: true }));

  // 等待拼写检查完成
  await waitForSpellCheck();

  const endTime = performance.now();
  return {
    textSize,
    totalTime: endTime - startTime,
    throughput: (textSize / (endTime - startTime)) * 1000, // 字符/秒
  };
}
```

通过遵循这些性能优化指南，您可以确保编辑器在各种使用场景下都能提供流畅的用户体验。
