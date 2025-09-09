# @nova-fe/textarea

一个基于 React 的高性能 TextArea，支持拼写检查、撤销重做等功能。

## 🌐 在线演示

[![Deploy Demo](https://github.com/[用户名]/textarea/actions/workflows/deploy-demo.yml/badge.svg)](https://github.com/[用户名]/textarea/actions/workflows/deploy-demo.yml)

**[🚀 查看在线演示](https://[用户名].github.io/textarea/)**

> 演示包含了所有组件的使用示例和功能展示

## ✨ 特性

- 🚀 **高性能**：支持 2w+ 字符实时编辑（60FPS）
- 🔍 **智能拼写检查**：内置英语拼写检查，延时 < 500ms
- 📝 **自定义词典**：支持添加/删除自定义单词
- ↩️ **撤销重做**：完整的撤销重做功能，保持原生编辑体验
- 🎨 **灵活样式**：支持丰富的样式自定义
- 🔧 **TypeScript**：完整的类型支持
- 📦 **轻量级**：基于 Web Worker 的异步处理

## 📦 安装

```bash
npm install @nova-fe/textarea
# 或
yarn add @nova-fe/textarea
# 或
pnpm add @nova-fe/textarea
```

## 🚀 快速开始

### 基础 TextArea（非受控）

```tsx
import { TextArea } from '@nova-fe/textarea';

function App() {
  return <TextArea placeholder="请输入内容..." />;
}
```

### 受控 TextArea

```tsx
import { TextArea } from '@nova-fe/textarea';
import { useState } from 'react';

function App() {
  const [value, setValue] = useState('');

  return (
    <TextArea placeholder="请输入内容..." value={value} onChange={setValue} />
  );
}
```

### 带拼写检查的 TextArea

```tsx
import { TextArea } from '@nova-fe/textarea';

function App() {
  return <TextArea placeholder="请输入内容..." spellcheck={true} />;
}
```

### 撤销重做 TextArea

```tsx
import { TextAreaUndo } from '@nova-fe/textarea';

function App() {
  return <TextAreaUndo placeholder="请输入内容..." spellcheck={true} />;
}
```

## 📖 API 文档

### TextArea Props

| 属性               | 类型                     | 默认值      | 描述               |
| ------------------ | ------------------------ | ----------- | ------------------ |
| `value`            | `string`                 | `undefined` | 受控模式下的值     |
| `onChange`         | `(text: string) => void` | `undefined` | 内容变化回调       |
| `placeholder`      | `string`                 | `undefined` | 占位符文本         |
| `spellcheck`       | `boolean`                | `false`     | 是否启用拼写检查   |
| `customDictionary` | `string[]`               | `[]`        | 自定义词典单词列表 |
| `disabled`         | `boolean`                | `false`     | 是否禁用编辑       |
| `onFocus`          | `() => void`             | `undefined` | 获得焦点回调       |
| `onBlur`           | `() => void`             | `undefined` | 失去焦点回调       |
| `className`        | `string`                 | `undefined` | CSS 类名           |

#### 样式属性

| 属性              | 类型               | 默认值                | 描述     |
| ----------------- | ------------------ | --------------------- | -------- |
| `fontSize`        | `string \| number` | `"14px"`              | 字体大小 |
| `lineHeight`      | `string \| number` | `"1.5"`               | 行高     |
| `fontFamily`      | `string`           | `undefined`           | 字体族   |
| `padding`         | `string \| number` | `"8px"`               | 内边距   |
| `minHeight`       | `string \| number` | `"100px"`             | 最小高度 |
| `maxHeight`       | `string \| number` | `undefined`           | 最大高度 |
| `borderRadius`    | `string \| number` | `"6px"`               | 圆角     |
| `backgroundColor` | `string`           | `"#fff"`              | 背景色   |
| `color`           | `string`           | `undefined`           | 文字颜色 |
| `border`          | `string`           | `"1px solid #d9d9d9"` | 边框     |

### TextAreaUndo Props

继承 `TextArea` 的所有属性，额外支持：

- 自动撤销重做功能
- `Ctrl+Z` / `Cmd+Z` 撤销
- `Ctrl+Y` / `Cmd+Shift+Z` 重做

### 自定义词典 API

```tsx
import { useSpellChecker } from '@nova-fe/textarea';

function App() {
  const { addWord, removeWord, getAllCustomWords } = useSpellChecker();

  const handleAddWord = () => {
    addWord('customword');
  };

  const handleRemoveWord = () => {
    removeWord('customword');
  };

  return (
    <div>
      <button onClick={handleAddWord}>添加单词</button>
      <button onClick={handleRemoveWord}>删除单词</button>
    </div>
  );
}
```

## 🎨 样式自定义示例

### 自定义外观

```tsx
<TextArea
  placeholder="请输入内容..."
  fontSize="16px"
  lineHeight="1.6"
  fontFamily="'Helvetica Neue', Arial, sans-serif"
  padding="16px"
  minHeight="200px"
  borderRadius="8px"
  backgroundColor="#f8f9fa"
  color="#333"
  border="2px solid #e9ecef"
  spellcheck={true}
/>
```

### 深色主题

```tsx
<TextArea
  placeholder="请输入内容..."
  backgroundColor="#1a1a1a"
  color="#ffffff"
  border="1px solid #333"
  spellcheck={true}
/>
```

## ⚙️ 配置

### Vite 配置

如果在 Vite 项目中使用，可能需要调整配置：

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['typo-js'],
  },
  worker: {
    format: 'es',
  },
});
```

### Webpack 配置

对于 Webpack 项目，确保支持 Web Workers：

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.worker\.js$/,
        use: { loader: 'worker-loader' },
      },
    ],
  },
};
```

## 🔧 高级用法

### 获取 TextArea 实例

```tsx
import { TextArea, TextAreaHandle } from '@nova-fe/textarea';
import { useRef } from 'react';

function App() {
  const editorRef = useRef<TextAreaHandle>(null);

  const handleGetContent = () => {
    const element = editorRef.current?.getElement();
    console.log(element?.textContent);
  };

  return (
    <div>
      <TextArea ref={editorRef} />
      <button onClick={handleGetContent}>获取内容</button>
    </div>
  );
}
```

### 自定义拼写检查

```tsx
import { TextArea, useSpellChecker } from '@nova-fe/textarea';

function App() {
  const { addWords, exportCustomDictionary } = useSpellChecker();

  const handleImportWords = () => {
    addWords(['word1', 'word2', 'word3']);
  };

  return (
    <div>
      <TextArea spellcheck={true} />
      <button onClick={handleImportWords}>导入单词</button>
    </div>
  );
}
```

## 🐛 常见问题

### Q: 拼写检查不工作？

A: 确保设置了 `spellcheck={true}` 属性，并且浏览器支持 Web Workers。

### Q: 撤销重做不生效？

A: 使用 `TextAreaUndo` 组件而不是 `TextArea`。

### Q: 样式不生效？

A: 检查是否使用了正确的样式属性名，避免使用 `style` 对象。

### Q: 性能问题？

A: 对于大量文本，编辑器会自动启用增量检查和缓存优化。

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 🚀 部署和演示

### 在线演示
- **演示地址**: [https://[用户名].github.io/textarea/](https://[用户名].github.io/textarea/)
- **自动部署**: 推送到主分支自动更新演示
- **构建状态**: 查看 [GitHub Actions](https://github.com/[用户名]/textarea/actions)

### 本地运行演示
```bash
# 构建组件库
npm run build

# 运行演示
cd demo
npm install
npm run dev
```

### 部署到 GitHub Pages
项目已配置自动部署，详见 [部署说明](./DEPLOYMENT.md)

## 📚 更多文档

- [拼写检查详细文档](./doc/Dictionary.md)
- [性能优化指南](./doc/Performance.md)
- [API 参考](./doc/API.md)
- [部署说明](./DEPLOYMENT.md)
