# API 参考文档

## 组件 API

### TextArea

基础的可编辑文本 TextArea 组件。

#### Props

```typescript
interface TextAreaProps {
  // 基础属性
  value?: string; // 受控模式下的值
  onChange?: (text: string) => void; // 内容变化回调
  placeholder?: string; // 占位符文本
  disabled?: boolean; // 是否禁用
  className?: string; // CSS 类名

  // 事件回调
  onFocus?: () => void; // 获得焦点
  onBlur?: () => void; // 失去焦点
  onInput?: () => void; // 输入事件
  onSelectionChange?: (selection: { start: number; end: number }) => void;

  // 拼写检查
  spellcheck?: boolean; // 是否启用拼写检查
  customDictionary?: string[]; // 自定义词典单词列表

  // 样式属性
  fontSize?: string | number; // 字体大小
  lineHeight?: string | number; // 行高
  fontFamily?: string; // 字体族
  padding?: string | number; // 内边距
  minHeight?: string | number; // 最小高度
  maxHeight?: string | number; // 最大高度
  borderRadius?: string | number; // 圆角
  backgroundColor?: string; // 背景色
  color?: string; // 文字颜色
  border?: string; // 边框
}
```

#### Ref Methods

```typescript
interface ContentEditableHandle {
  getElement: () => HTMLElement | null; // 获取 DOM 元素
  getSelection: () => { start: number; end: number } | null; // 获取选择范围
  focus: () => void; // 聚焦
  blur: () => void; // 失焦
  insertText: (text: string) => void; // 插入文本
  replaceText: (start: number, end: number, text: string) => void; // 替换文本
}
```

### TextAreaCore Props

轻量级的核心 TextArea 组件，专注于文本编辑功能，不包含拼写检查。

继承 `TextArea` 的所有样式属性，但不包含拼写检查相关功能：

- 更轻量级，性能更优
- 专注于纯文本编辑
- 适合不需要拼写检查的场景

### TextAreaUndo

带撤销重做功能的 TextArea，继承 `TextArea` 的所有属性。

#### 额外功能

- 自动撤销重做历史记录
- `Ctrl+Z` / `Cmd+Z` 撤销
- `Ctrl+Y` / `Cmd+Shift+Z` 重做

#### Ref Methods

```typescript
interface TextAreaUndoHandle {
  undo: () => void; // 撤销
  redo: () => void; // 重做
  getState: () => {
    // 获取当前状态
    content: string;
    selection: { start: number; end: number };
  };
}
```

## Hooks API

### useSpellChecker

拼写检查相关的 Hook。

```typescript
interface SpellCheckerHook {
  // 状态
  worker: Worker | null; // Web Worker 实例
  isReady: boolean; // 是否准备就绪

  // 基础检查
  check: (word: string) => boolean; // 检查单词

  // 自定义词典管理
  addWord: (word: string) => boolean;
  removeWord: (word: string) => boolean;
  addWords: (words: string[]) => { added: number; failed: string[] };
  removeWords: (words: string[]) => { removed: number; notFound: string[] };
  clearCustomWords: () => void;
  getAllCustomWords: () => string[];
  getCustomWordCount: () => number;
  addWordsFromText: (text: string) => { added: number; failed: string[] };

  // 导入导出
  exportCustomDictionary: () => string;
  importCustomDictionary: (jsonData: string) => boolean;

  // 建议功能
  getSuggestions: (word: string) => Promise<string[]>;
}
```

## 工具函数 API

### 文本处理

```typescript
// HTML 转纯文本
function htmlConvertText(html: string): string;

// 计算增量检查区域
function calculateIncrementalCheckRegions(
  oldText: string,
  newText: string,
  options?: { contextWords?: number }
): IncrementalCheckRegion[];

// 获取字符偏移
function getCharacterOffset(
  element: HTMLElement,
  node: Node,
  offset: number
): number;

// 查找节点和偏移
function findNodeAndOffset(
  element: HTMLElement,
  characterOffset: number
): { node: Node; offset: number } | null;
```

### 类型定义

```typescript
// 文本位置
interface TextPosition {
  word: string;
  start: number;
  end: number;
  rect: DOMRect;
}

// 文本变化
interface TextChange {
  type: 'insert' | 'delete' | 'replace';
  start: number;
  end: number;
  text: string;
}

// 增量检查区域
interface IncrementalCheckRegion {
  start: number;
  end: number;
  text: string;
}
```

## 自定义词典 API

### CustomDictionary 类

```typescript
class CustomDictionary {
  constructor(options?: {
    storageKey?: string; // 存储键名，默认 'editor-custom-dictionary'
    maxWords?: number; // 最大单词数，默认 10000
    autoSave?: boolean; // 自动保存，默认 true
  });

  // 单词管理
  addWord(word: string): boolean;
  removeWord(word: string): boolean;
  hasWord(word: string): boolean;

  // 批量操作
  addWords(words: string[]): { added: number; failed: string[] };
  removeWords(words: string[]): { removed: number; notFound: string[] };

  // 获取信息
  getAllWords(): string[];
  getWordCount(): number;
  clear(): void;

  // 存储管理
  saveToStorage(): void;
  loadFromStorage(): void;

  // 导入导出
  exportToJSON(): string;
  importFromJSON(jsonData: string): boolean;

  // 文本处理
  addWordsFromText(text: string): { added: number; failed: string[] };
}
```

### 创建自定义词典

```typescript
import { createCustomDictionary } from '@nova-fe/editor';

const customDict = createCustomDictionary({
  storageKey: 'my-app-dictionary',
  maxWords: 5000,
  autoSave: true,
});
```

## 事件系统

### Worker 消息类型

```typescript
// 发送到 Worker 的消息
type WorkerMessage =
  | { type: 'INIT_DICTIONARY'; payload: { affData: string; dicData: string } }
  | { type: 'CHECK_TEXT'; payload: { fullText: string } }
  | { type: 'CHECK_INCREMENTAL'; payload: { fullText: string; regions: any[] } }
  | { type: 'ADD_WORD'; payload: { word: string } }
  | { type: 'REMOVE_WORD'; payload: { word: string } }
  | { type: 'GET_SUGGESTIONS'; payload: { word: string } };

// Worker 返回的消息
type WorkerResponse =
  | { type: 'DICTIONARY_READY'; payload: { ready: boolean } }
  | {
      type: 'CHECK_RESULT';
      payload: { invalidWords: any[]; currentCheckCache: Map<string, boolean> };
    }
  | { type: 'DICTIONARY_UPDATED'; payload: { action: string; word: string } }
  | {
      type: 'SUGGESTIONS_RESULT';
      payload: { word: string; suggestions: string[] };
    };
```

## 错误处理

### 错误类型

```typescript
// 词典错误
class DictionaryError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'DictionaryError';
  }
}

// Worker 错误
class WorkerError extends Error {
  constructor(
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'WorkerError';
  }
}
```

### 错误处理示例

```typescript
import { useSpellChecker } from '@nova-fe/editor';

function App() {
  const { addWord, isReady } = useSpellChecker();

  const handleAddWord = (word: string) => {
    try {
      if (!isReady) {
        throw new Error('拼写检查器尚未准备就绪');
      }

      const success = addWord(word);
      if (!success) {
        throw new Error('添加单词失败');
      }
    } catch (error) {
      console.error('操作失败:', error.message);
    }
  };
}
```

## 自定义词典使用示例

### 基础用法

```typescript
import { ContentEditable, useSpellChecker } from "@nova-fe/editor";

const MyEditor = () => {
  const [customWords, setCustomWords] = useState(['React', 'TypeScript', 'JavaScript']);
  const { addWord, removeWord, getAllCustomWords } = useSpellChecker();

  return (
    <ContentEditable
      spellcheck={true}
      customDictionary={customWords}
      placeholder="输入文本，自定义词典中的单词不会被标记为错误..."
    />
  );
};
```

### 动态管理自定义词典

```typescript
const EditorWithDictionary = () => {
  const [customWords, setCustomWords] = useState<string[]>([]);
  const { addWord, removeWord, getAllCustomWords, isReady } = useSpellChecker();

  // 添加单词到自定义词典
  const handleAddWord = (word: string) => {
    if (addWord(word)) {
      setCustomWords(getAllCustomWords());
    }
  };

  // 从自定义词典删除单词
  const handleRemoveWord = (word: string) => {
    if (removeWord(word)) {
      setCustomWords(getAllCustomWords());
    }
  };

  // 同步自定义词典状态
  useEffect(() => {
    if (isReady) {
      setCustomWords(getAllCustomWords());
    }
  }, [isReady, getAllCustomWords]);

  return (
    <div>
      <ContentEditable
        spellcheck={true}
        customDictionary={customWords}
        placeholder="输入文本进行拼写检查..."
      />

      <div>
        <button onClick={() => handleAddWord(prompt('输入单词:') || '')}>
          添加单词
        </button>
        <div>
          {customWords.map(word => (
            <span key={word} onClick={() => handleRemoveWord(word)}>
              {word} ×
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
```
