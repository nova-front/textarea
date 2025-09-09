import React, { useRef, useState } from 'react';
import {
  TextArea,
  TextAreaCore,
  TextAreaUndo,
  type TextAreaUndoHandle,
} from '@nova-fe/textarea';
import DemoSection from './components/DemoSection';
import './styles/global.css';

const App: React.FC = () => {
  const undoableEditorRef = useRef<TextAreaUndoHandle>(null);
  const [controlledValue, setControlledValue] = useState<string>('');

  return (
    <div className="app-container">
      <div className="page-header">
        <h1 className="page-title">@nova-fe/textarea</h1>
        <p className="page-description">
          一个基于 React 的高性能 TextArea，支持拼写检查、撤销重做等功能。
        </p>
      </div>

      <div className="main-content">
        <div className="container">
          <DemoSection
            title="📝 基础 TextArea（非受控）"
            description="最简单的 TextArea 使用方式，支持基本的文本编辑功能"
          >
            <TextArea
              placeholder="请输入内容..."
              borderRadius="6px"
              minHeight="120px"
              border="1px solid #d9d9d9"
              padding="12px"
            />
          </DemoSection>

          <DemoSection
            title="🎛️ 受控 TextArea"
            description="通过 value 和 onChange 属性控制 TextArea 内容，实现双向数据绑定"
            code={`const [controlledValue, setControlledValue] = useState<string>('');

<TextArea
  placeholder="受控模式"
  value={controlledValue}
  onChange={setControlledValue}
  borderRadius="6px"
  padding="12px"
  minHeight="120px"
  border="1px solid #1677ff"
/>

{/* 显示当前内容和字符数 */}
<div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f0f5ff' }}>
  <strong>当前内容：</strong> {controlledValue || '（空）'}
  <br />
  <strong>字符数：</strong> {controlledValue.length}
</div>`}
          >
            <TextArea
              placeholder="受控模式"
              value={controlledValue}
              onChange={setControlledValue}
              borderRadius="6px"
              padding="12px"
              minHeight="120px"
              border="1px solid #1677ff"
            />
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#f0f5ff',
                borderRadius: '6px',
                border: '1px solid #adc6ff',
              }}
            >
              <strong>当前内容：</strong> {controlledValue || '（空）'}
              <br />
              <strong>字符数：</strong> {controlledValue.length}
            </div>
          </DemoSection>

          <DemoSection
            title="🎨 自定义样式 TextArea"
            description="通过样式属性自定义 TextArea 外观，支持丰富的样式配置"
            code={`<TextArea
  fontSize="18px"
  lineHeight={1.8}
  fontFamily="Georgia, serif"
  color="#2c3e50"
  backgroundColor="#fafafa"
  padding="16px"
  borderRadius="12px"
  minHeight="150px"
  border="2px solid #3498db"
  placeholder="自定义样式，试试输入一些文字..."
/>`}
          >
            <TextArea
              fontSize="18px"
              lineHeight={1.8}
              fontFamily="Georgia, serif"
              color="#2c3e50"
              backgroundColor="#fafafa"
              padding="16px"
              borderRadius="12px"
              minHeight="150px"
              border="2px solid #3498db"
              placeholder="自定义样式，试试输入一些文字..."
            />
          </DemoSection>

          <DemoSection
            title="🔧 核心 TextArea 组件"
            description="TextAreaCore 专注于文本编辑功能，不包含拼写检查，性能更优"
            code={`import { TextAreaCore } from "@nova-fe/textarea";

<TextAreaCore
  placeholder="这是核心 TextArea 组件，专注于文本编辑，不包含拼写检查功能"
  fontSize="16px"
  lineHeight={1.6}
  padding="12px"
  minHeight="120px"
  border="1px solid #52c41a"
  borderRadius="6px"
  backgroundColor="#f6ffed"
/>`}
          >
            <TextAreaCore
              placeholder="这是核心 TextArea 组件，专注于文本编辑，不包含拼写检查功能"
              fontSize="16px"
              lineHeight={1.6}
              padding="12px"
              minHeight="120px"
              border="1px solid #52c41a"
              borderRadius="6px"
              backgroundColor="#f6ffed"
            />
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#f0f9ff',
                borderRadius: '6px',
                border: '1px solid #bae7ff',
              }}
            >
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#1677ff' }}>
                💡 使用建议
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#666' }}>
                <li>需要纯文本编辑时使用 TextAreaCore</li>
                <li>需要拼写检查时使用 TextArea</li>
                <li>需要撤销重做时使用 TextAreaUndo</li>
              </ul>
            </div>
          </DemoSection>

          <DemoSection
            title="↩️ 撤销重做 TextArea"
            description="TextAreaUndo 提供完整的撤销重做功能，支持手动控制和快捷键操作"
            code={`import { TextAreaUndo, type TextAreaUndoHandle } from "@nova-fe/textarea";

const undoableEditorRef = useRef<TextAreaUndoHandle>(null);

<TextAreaUndo
  ref={undoableEditorRef}
  placeholder="支持撤销重做功能的 TextArea，试试 Ctrl+Z 和 Ctrl+Y"
  fontSize="16px"
  lineHeight={1.6}
  padding="12px"
  minHeight="150px"
  border="1px solid #722ed1"
  borderRadius="6px"
  backgroundColor="#f9f0ff"
/>

{/* 手动控制按钮 */}
<button onClick={() => undoableEditorRef.current?.undo()}>
  ↶ 撤销 (Ctrl+Z)
</button>
<button onClick={() => undoableEditorRef.current?.redo()}>
  ↷ 重做 (Ctrl+Y)
</button>`}
          >
            <TextAreaUndo
              ref={undoableEditorRef}
              placeholder="支持撤销重做功能的 TextArea，试试 Ctrl+Z 和 Ctrl+Y"
              fontSize="16px"
              lineHeight={1.6}
              padding="12px"
              minHeight="150px"
              border="1px solid #722ed1"
              borderRadius="6px"
              backgroundColor="#f9f0ff"
            />
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-primary"
                onClick={() => undoableEditorRef.current?.undo()}
              >
                ↶ 撤销 (Ctrl+Z)
              </button>
              <button
                className="btn btn-primary"
                onClick={() => undoableEditorRef.current?.redo()}
              >
                ↷ 重做 (Ctrl+Y)
              </button>
            </div>
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#fff7e6',
                borderRadius: '6px',
                border: '1px solid #ffd591',
              }}
            >
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                ✓ 撤销重做 ✓ 快捷键支持 ✓ 手动控制
              </div>
            </div>
          </DemoSection>

          <DemoSection
            title="🔍 拼写检查"
            description="拼写检查功能，只支持英文拼写纠错"
            code={`<TextArea
  placeholder="Try typing some text with spelling mistakes here..."
  spellcheck={true}
  fontSize="16px"
  lineHeight={1.6}
  padding="12px"
  minHeight="120px"
  border="1px solid #fa8c16"
  borderRadius="6px"
  backgroundColor="#fff7e6"
/>`}
          >
            <TextArea
              placeholder="Try typing some text with spelling mistakes here..."
              spellcheck={true}
              fontSize="16px"
              lineHeight={1.6}
              padding="12px"
              minHeight="120px"
              border="1px solid #fa8c16"
              borderRadius="6px"
              backgroundColor="#fff7e6"
            />
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#f6ffed',
                borderRadius: '6px',
                border: '1px solid #b7eb8f',
              }}
            >
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#52c41a' }}>
                🌟 拼写检查特性
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#666' }}>
                <li>拼写检查支持</li>
                <li>右键菜单建议修正</li>
                <li>红色波浪线标记错误</li>
              </ul>
            </div>
          </DemoSection>

          <DemoSection
            title="🏗️ 组件对比"
            description="不同 TextArea 组件的功能对比，帮助选择最适合的组件"
            code={`// 根据需求选择合适的组件

// 1. 轻量级文本编辑 - TextAreaCore
import { TextAreaCore } from "@nova-fe/textarea";
<TextAreaCore placeholder="轻量级组件" />

// 2. 标准文本编辑 - TextArea
import { TextArea } from "@nova-fe/textarea";
<TextArea placeholder="标准组件" spellcheck={true} />

// 3. 完整功能 - TextAreaUndo
import { TextAreaUndo, type TextAreaUndoHandle } from "@nova-fe/textarea";
const ref = useRef<TextAreaUndoHandle>(null);
<TextAreaUndo ref={ref} placeholder="完整功能组件" />`}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '6px',
                  border: '1px solid #bae7ff',
                }}
              >
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#1677ff' }}>
                  TextAreaCore
                </h4>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                  轻量级文本编辑组件
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#666' }}>
                  <li>✅ 基础文本编辑</li>
                  <li>✅ 高性能</li>
                  <li>❌ 无拼写检查</li>
                  <li>❌ 无撤销重做</li>
                </ul>
              </div>

              <div
                style={{
                  padding: '1rem',
                  backgroundColor: '#f6ffed',
                  borderRadius: '6px',
                  border: '1px solid #b7eb8f',
                }}
              >
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#52c41a' }}>
                  TextArea
                </h4>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                  标准文本编辑组件
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#666' }}>
                  <li>✅ 基础文本编辑</li>
                  <li>✅ 拼写检查</li>
                  <li>✅ 性能优化</li>
                  <li>❌ 无撤销重做</li>
                </ul>
              </div>

              <div
                style={{
                  padding: '1rem',
                  backgroundColor: '#f9f0ff',
                  borderRadius: '6px',
                  border: '1px solid #d3adf7',
                }}
              >
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#722ed1' }}>
                  TextAreaUndo
                </h4>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                  完整功能文本编辑组件
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#666' }}>
                  <li>✅ 基础文本编辑</li>
                  <li>✅ 拼写检查</li>
                  <li>✅ 撤销重做</li>
                  <li>✅ 完整功能</li>
                </ul>
              </div>
            </div>
          </DemoSection>
        </div>
      </div>
    </div>
  );
};

export default App;
