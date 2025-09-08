import type React from 'react';
import {
  type ReactNode,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  findNodeAndOffset,
  getCharacterOffset,
  htmlConvertText,
} from '../../utils';

export interface ContentEditableCoreProps {
  value?: string;
  selection?: { start: number; end: number };
  onChange?: (text: string) => void;
  onSelectionChange?: (selection: { start: number; end: number }) => void;
  onInput?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onPaste?: (event: React.ClipboardEvent) => void;
  onUndoStateChange?: () => void; // 新增：用于撤销状态记录
  placeholder?: string;
  className?: string;
  children?: ReactNode;
  disabled?: boolean;
  // 样式属性 - 替代 style
  fontSize?: string | number;
  lineHeight?: string | number;
  fontFamily?: string;
  padding?: string | number;
  minHeight?: string | number;
  maxHeight?: string | number;
  borderRadius?: string | number;
  backgroundColor?: string;
  color?: string;
  border?: string;
}

export interface ContentEditableCoreHandle {
  focus: () => void;
  blur: () => void;
  getSelection: () => { start: number; end: number } | null;
  setSelection: (start: number, end: number) => void;
  insertText: (text: string) => void;
  replaceText: (start: number, end: number, text: string) => void;
  getElement: () => HTMLDivElement | null;
}

export const ContentEditableCore = forwardRef<
  ContentEditableCoreHandle,
  ContentEditableCoreProps
>(
  (
    {
      value = '',
      selection,
      onChange,
      onSelectionChange,
      onInput,
      onFocus,
      onBlur,
      onPaste,
      onUndoStateChange,
      placeholder,
      className,
      children,
      disabled = false,
      // 样式 props
      fontSize = '14px',
      lineHeight = '1.5',
      fontFamily,
      padding = '8px',
      minHeight = '100px',
      maxHeight,
      borderRadius = '6px',
      backgroundColor = '#fff',
      color,
      border = '1px solid #d9d9d9',
    }: ContentEditableCoreProps,
    ref,
  ): ReactNode => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    const [showPlaceholder, setShowPlaceholder] = useState<boolean>(true);

    // 初始化内容 - 只在受控模式下设置初始值
    useEffect(() => {
      if (!contentRef.current) return;

      // 只在受控模式下设置初始值
      if (value !== undefined) {
        contentRef.current.innerHTML = value;
      }

      setShowPlaceholder(
        !isFocused && !contentRef.current?.textContent?.trim(),
      );
    }, []);

    // 处理值变化 - 只在受控模式下生效
    useEffect(() => {
      if (!contentRef.current) return;

      // 检查是否为受控组件（value 不为 undefined 说明是受控的）
      if (value === undefined) return;

      // 只有当 DOM 内容与 value 不同时才更新
      const currentContent = contentRef.current.innerHTML || '';
      if (currentContent === value) return;

      contentRef.current.innerHTML = value;
      // 更新 placeholder 显示状态
      setShowPlaceholder(!contentRef.current?.textContent?.trim());
    }, [value]);

    // 处理选择变化
    useEffect(() => {
      if (!selection || !contentRef.current) return;

      const { start, end } = selection;
      const startResult = findNodeAndOffset(contentRef.current, start);
      const endResult = findNodeAndOffset(contentRef.current, end);

      if (startResult && endResult) {
        const range = document.createRange();
        range.setStart(startResult.node, startResult.offset);
        range.setEnd(endResult.node, endResult.offset);

        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }, [selection]);

    // 获取当前选择
    const getCurrentSelection = useCallback(() => {
      if (!contentRef.current) return null;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;

      const range = selection.getRangeAt(0);
      const start = getCharacterOffset(
        contentRef.current,
        range.startContainer,
        range.startOffset,
      );
      const end = getCharacterOffset(
        contentRef.current,
        range.endContainer,
        range.endOffset,
      );

      return { start, end };
    }, []);

    // 处理内容变化
    const handleInput = useCallback(() => {
      if (!contentRef.current || isComposing || disabled) return;

      const text = htmlConvertText(contentRef.current.innerHTML);
      onChange?.(text);

      const currentSelection = getCurrentSelection();
      if (currentSelection) {
        onSelectionChange?.(currentSelection);
      }

      setShowPlaceholder(
        !isFocused && !contentRef.current?.textContent?.trim(),
      );

      // 在内容变化后记录撤销状态
      onUndoStateChange?.();

      onInput?.();
    }, [
      onChange,
      onSelectionChange,
      onInput,
      onUndoStateChange,
      isComposing,
      disabled,
      isFocused,
      getCurrentSelection,
    ]);

    // 处理焦点
    const handleFocus = useCallback(() => {
      setIsFocused(true);
      setShowPlaceholder(false);
      onFocus?.();
    }, [onFocus]);

    const handleBlur = useCallback(() => {
      setIsFocused(false);
      if (contentRef.current) {
        setShowPlaceholder(!contentRef.current?.textContent?.trim());
      }
      onBlur?.();
    }, [onBlur]);

    // 处理粘贴
    const handlePaste = useCallback(
      (event: React.ClipboardEvent) => {
        if (disabled) {
          event.preventDefault();
          return;
        }

        onPaste?.(event);

        // 如果没有自定义处理，使用默认行为
        if (!onPaste) {
          event.preventDefault();
          const text = event.clipboardData.getData('text/plain');
          document.execCommand('insertText', false, text);
        }
      },
      [onPaste, disabled],
    );

    // 暴露方法给父组件
    useImperativeHandle(
      ref,
      () => ({
        focus: () => contentRef.current?.focus(),
        blur: () => contentRef.current?.blur(),
        getSelection: getCurrentSelection,
        setSelection: (start: number, end: number) => {
          if (!contentRef.current) return;

          const startResult = findNodeAndOffset(contentRef.current, start);
          const endResult = findNodeAndOffset(contentRef.current, end);

          if (startResult && endResult) {
            const range = document.createRange();
            range.setStart(startResult.node, startResult.offset);
            range.setEnd(endResult.node, endResult.offset);

            const sel = window.getSelection();
            if (sel) {
              sel.removeAllRanges();
              sel.addRange(range);
            }
          }
        },
        insertText: (text: string) => {
          if (contentRef.current && !disabled) {
            document.execCommand('insertText', false, text);
          }
        },
        replaceText: (start: number, end: number, text: string) => {
          if (!contentRef.current || disabled) return;

          const startResult = findNodeAndOffset(contentRef.current, start);
          const endResult = findNodeAndOffset(contentRef.current, end);

          if (startResult && endResult) {
            const range = document.createRange();
            range.setStart(startResult.node, startResult.offset);
            range.setEnd(endResult.node, endResult.offset);

            const sel = window.getSelection();
            if (sel) {
              sel.removeAllRanges();
              sel.addRange(range);
              document.execCommand('insertText', false, text);
            }
          }
        },
        getElement: () => contentRef.current,
      }),
      [getCurrentSelection, disabled],
    );

    return (
      <div style={{ position: 'relative' }} className={className}>
        <div
          ref={contentRef}
          contentEditable={!disabled}
          spellCheck={false}
          onPaste={handlePaste}
          onInput={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          style={{
            minHeight,
            maxHeight,
            outline: 'none',
            whiteSpace: 'pre-wrap',
            padding,
            border,
            borderRadius,
            backgroundColor,
            fontSize,
            lineHeight,
            fontFamily,
            color,
          }}
        />

        {showPlaceholder && placeholder && (
          <div
            style={{
              position: 'absolute',
              top: typeof padding === 'string' ? padding : `${padding}px`,
              left: typeof padding === 'string' ? padding : `${padding}px`,
              color: '#bfbfbf',
              pointerEvents: 'none',
              userSelect: 'none',
              fontSize,
              lineHeight,
              fontFamily,
            }}
          >
            {placeholder}
          </div>
        )}

        {children}
      </div>
    );
  },
);

ContentEditableCore.displayName = 'ContentEditableCore';

export default ContentEditableCore;
