# 拼写检查与词典系统

本文档详细介绍了 @nova-fe/editor 的拼写检查和词典系统的实现原理与使用方法。

## 🏗️ 架构概览

拼写检查系统采用了多层架构设计：

```
┌─────────────────────────────────────────┐
│              React 组件层                │
│  ContentEditable / UndoableEditor      │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│            拼写检查 Hook                 │
│         useSpellChecker                 │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│             Web Worker                  │
│    异步拼写检查 + 缓存优化               │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│              词典层                      │
│  Typo.js + 自定义词典 + LRU缓存         │
└─────────────────────────────────────────┘
```

## 📚 词典实现

### 1. 基础英语词典

使用 Typo.js 库提供基础的英语拼写检查：

```ts
import { useSpellChecker } from '@nova-fe/editor';

function App() {
  const { check } = useSpellChecker();

  // 检查单词是否正确
  const isValid = check('apple'); // true
  const isInvalid = check('appl'); // false
}
```

### 2. 自定义词典

支持添加、删除和管理自定义单词：

```ts
import { useSpellChecker } from '@nova-fe/editor';

function App() {
  const {
    addWord,
    removeWord,
    addWords,
    removeWords,
    clearCustomWords,
    getAllCustomWords,
    getCustomWordCount,
  } = useSpellChecker();

  // 添加单个单词
  addWord('customword');

  // 批量添加单词
  addWords(['word1', 'word2', 'word3']);

  // 删除单词
  removeWord('customword');

  // 获取所有自定义单词
  const customWords = getAllCustomWords();

  // 获取自定义单词数量
  const count = getCustomWordCount();

  // 清空所有自定义单词
  clearCustomWords();
}
```

### 3. 词典导入导出

支持词典的导入导出功能：

```ts
import { useSpellChecker } from '@nova-fe/editor';

function App() {
  const { exportCustomDictionary, importCustomDictionary, addWordsFromText } =
    useSpellChecker();

  // 导出词典为 JSON
  const exportData = exportCustomDictionary();

  // 从 JSON 导入词典
  importCustomDictionary(exportData);

  // 从文本中提取并添加单词
  const result = addWordsFromText(
    '这是一段包含 customword1 和 customword2 的文本'
  );
  console.log(`添加了 ${result.added} 个单词`);
}
```

## ⚡ 性能优化

### 1. Web Worker 异步处理

所有拼写检查都在 Web Worker 中进行，避免阻塞主线程：

```ts
// Worker 中的处理流程
self.onmessage = (event) => {
  switch (event.data.type) {
    case 'CHECK_TEXT':
      // 异步检查整个文本
      const results = await processText(event.data.payload.fullText);
      self.postMessage({ type: 'CHECK_RESULT', payload: results });
      break;

    case 'CHECK_INCREMENTAL':
      // 增量检查（仅检查变化的部分）
      const incrementalResults = await processIncrementalText(
        event.data.payload.fullText,
        event.data.payload.regions
      );
      self.postMessage({ type: 'CHECK_RESULT', payload: incrementalResults });
      break;
  }
};
```

### 2. LRU 缓存机制

使用 LRU（Least Recently Used）缓存来提高检查性能：

```ts
class LRUCache<K, V> {
  private capacity: number = 5000; // 缓存容量

  // 单词检查缓存
  checkedCache = new LRUCache<string, boolean>(5000);

  // 区域检查缓存
  regionCache = new LRUCache<string, CheckResult[]>(1000);
}
```

### 3. 增量检查

对于大文本，只检查变化的区域：

```ts
// 计算需要检查的区域
const regions = calculateIncrementalCheckRegions(
  previousText,
  currentText,
  { contextWords: 5 } // 包含上下文单词
);

// 只检查变化的区域
worker.postMessage({
  type: 'CHECK_INCREMENTAL',
  payload: { fullText: currentText, regions },
});
```

## 🔧 配置选项

### 自定义词典配置

```ts
import { createCustomDictionary } from '@nova-fe/editor';

const customDict = createCustomDictionary({
  storageKey: 'my-app-dictionary', // 本地存储键名
  maxWords: 10000, // 最大单词数
  autoSave: true, // 自动保存到本地存储
});
```

### 拼写检查配置

```ts
<ContentEditable
  spellcheck={true}
  spellcheckOptions={{
    debounceMs: 300,        // 防抖延迟
    maxTextLength: 50000,   // 最大检查文本长度
    contextWords: 5,        // 增量检查上下文单词数
    cacheSize: 5000        // 缓存大小
  }}
/>
```

## 🎯 最佳实践

### 1. 性能优化建议

```ts
// ✅ 推荐：使用防抖来减少检查频率
const [text, setText] = useState("");
const debouncedText = useDebounce(text, 300);

<ContentEditable
  value={debouncedText}
  onChange={setText}
  spellcheck={true}
/>

// ✅ 推荐：对于大文本启用增量检查
<ContentEditable
  spellcheck={true}
  spellcheckOptions={{
    useIncremental: text.length > 1000
  }}
/>
```

### 2. 自定义词典管理

```ts
// ✅ 推荐：批量操作
const { addWords } = useSpellChecker();
addWords(['word1', 'word2', 'word3']); // 一次添加多个

// ❌ 不推荐：逐个添加
const { addWord } = useSpellChecker();
addWord('word1');
addWord('word2');
addWord('word3');
```

### 3. 错误处理

```ts
import { useSpellChecker } from '@nova-fe/editor';

function App() {
  const { addWord, isReady } = useSpellChecker();

  const handleAddWord = async (word: string) => {
    if (!isReady) {
      console.warn('拼写检查器尚未准备就绪');
      return;
    }

    try {
      const success = addWord(word);
      if (!success) {
        console.error('添加单词失败');
      }
    } catch (error) {
      console.error('添加单词时发生错误:', error);
    }
  };
}
```

## 🐛 故障排除

### 常见问题

1. **拼写检查不工作**
   - 检查是否设置了 `spellcheck={true}`
   - 确认浏览器支持 Web Workers
   - 检查控制台是否有错误信息

2. **性能问题**
   - 对于大文本，启用增量检查
   - 调整缓存大小
   - 使用防抖减少检查频率

3. **自定义单词不生效**
   - 确认单词已成功添加到词典
   - 检查单词格式（小写、无特殊字符）
   - 重新触发拼写检查

### 调试工具

```ts
import { useSpellChecker } from "@nova-fe/editor";

function DebugPanel() {
  const {
    getCustomWordCount,
    getAllCustomWords,
    isReady
  } = useSpellChecker();

  return (
    <div>
      <p>检查器状态: {isReady ? "就绪" : "加载中"}</p>
      <p>自定义单词数量: {getCustomWordCount()}</p>
      <details>
        <summary>所有自定义单词</summary>
        <pre>{JSON.stringify(getAllCustomWords(), null, 2)}</pre>
      </details>
    </div>
  );
}
```

## 📈 性能指标

在典型使用场景下的性能表现：

- **初始化时间**: < 500ms
- **单词检查延迟**: < 50ms（缓存命中）
- **大文本检查**: < 500ms（5万字符）
- **内存占用**: < 10MB（包含词典和缓存）
- **缓存命中率**: > 90%（典型文本）

## 🔮 未来规划

- [ ] 支持更多语言的拼写检查
- [ ] 语法检查功能
- [ ] 智能建议和自动纠正
- [ ] 更高级的缓存策略
- [ ] 离线词典支持
