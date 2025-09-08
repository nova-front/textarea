import React, {
  forwardRef,
  useState,
  useRef,
  useCallback,
  useImperativeHandle,
  type ReactNode,
} from 'react';
import { useSpellChecker } from '../../dictionary/useTypeByWorker';
import { useWidthChangeObserver } from '../../hooks/useWidthChangeObserver';
import {
  type TextPosition,
  getTextPositionsWithErrorDictionary,
} from '../../utils';
import {
  ContentEditableCore,
  type ContentEditableCoreHandle,
} from '../content-editable-core';
import { WaveUnderline } from '../wave-underline';

export interface ContentEditableProps {
  value?: string;
  selection?: { start: number; end: number };
  onChange?: (text: string) => void;
  undoOnChange?: (state: {
    content: string;
    selection: { start: number; end: number };
  }) => void;
  placeholder?: string;
  className?: string;
  children?: ReactNode;
  onFocus?: () => void;
  onBlur?: () => void;
  spellcheck?: boolean;
  customDictionary?: string[]; // 自定义词典单词列表
  // 编辑器样式配置 - 替代直接的 style 属性
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

export interface ContentEditableHandle {
  focus: () => void;
  blur: () => void;
  getSelection: () => { start: number; end: number } | null;
  setSelection: (start: number, end: number) => void;
  insertText: (text: string) => void;
  replaceText: (start: number, end: number, text: string) => void;
  getElement: () => HTMLDivElement | null;
}

export const ContentEditable = forwardRef<
  ContentEditableHandle,
  ContentEditableProps
>(
  (
    {
      value = '',
      selection,
      onChange,
      undoOnChange,
      placeholder,
      className,
      children,
      onFocus,
      onBlur,
      spellcheck = false,
      customDictionary = [],
      // 样式 props
      fontSize = '14px',
      lineHeight = '1.5',
      fontFamily,
      padding = '12px',
      minHeight = '100px',
      maxHeight,
      borderRadius = '6px',
      backgroundColor = '#fff',
      color,
      border = '1px solid #d9d9d9',
    }: ContentEditableProps,
    ref,
  ): ReactNode => {
    const coreRef = useRef<ContentEditableCoreHandle>(null);
    const [waveUnderlineDimensions, setWaveUnderlineDimensions] = useState({
      width: 0,
      height: 0,
      top: 0,
      left: 0,
    });
    const [ranges, setRanges] = useState<TextPosition[]>([]);

    // 拼写检查
    const { worker, addWords, removeWords } = useSpellChecker();
    const workerRef = useRef<Worker | null>(null);
    const prevCustomDictionary = useRef<string[]>([]);

    // 更新波浪线位置信息
    const updateWaveUnderlineDimensions = useCallback(() => {
      const element = coreRef.current?.getElement();
      if (!element) return;

      const rect = element.getBoundingClientRect();
      setWaveUnderlineDimensions({
        width: rect.width,
        height: rect.height,
        top: 0,
        left: 0,
      });
    }, []);

    // 设置 Worker 引用
    React.useEffect(() => {
      if (worker) {
        workerRef.current = worker;

        worker.onmessage = (event) => {
          if (event.data.type === 'CHECK_RESULT') {
            const { currentCheckCache } = event.data.payload;

            // 使用requestIdleCallback延迟处理，避免阻塞主线程
            requestIdleCallback(
              () => {
                const element = coreRef.current?.getElement();
                if (element) {
                  try {
                    const newRanges = getTextPositionsWithErrorDictionary(
                      element,
                      currentCheckCache,
                    );

                    console.log(
                      `拼写检查完成: 发现 ${newRanges.length} 个错误，全部显示`,
                    );

                    // 显示所有检测到的错误
                    setRanges(newRanges);
                  } catch (error) {
                    console.warn('拼写检查位置计算失败:', error);
                    setRanges([]); // 出错时清空波浪线
                  }
                }
              },
              { timeout: 100 },
            );
          }
        };
      }
    }, [worker]);

    // 同步自定义词典
    React.useEffect(() => {
      if (!worker || !customDictionary) return;

      const currentWords = new Set(customDictionary);
      const prevWords = new Set(prevCustomDictionary.current);

      // 找出需要添加的单词
      const wordsToAdd = customDictionary.filter(
        (word) => !prevWords.has(word),
      );
      // 找出需要删除的单词
      const wordsToRemove = prevCustomDictionary.current.filter(
        (word) => !currentWords.has(word),
      );

      // 批量添加新单词
      if (wordsToAdd.length > 0) {
        addWords(wordsToAdd);
      }

      // 批量删除单词
      if (wordsToRemove.length > 0) {
        removeWords(wordsToRemove);
      }

      // 更新引用
      prevCustomDictionary.current = [...customDictionary];
    }, [customDictionary, worker, addWords, removeWords]);

    // 执行拼写检查
    const performSpellCheck = React.useCallback(() => {
      if (!spellcheck || !workerRef.current) return;

      const element = coreRef.current?.getElement();
      if (!element) return;

      const fullText = element.innerText;
      workerRef.current.postMessage({
        type: 'CHECK_TEXT',
        payload: { fullText },
      });
    }, [spellcheck]);

    // 监听宽度变化
    useWidthChangeObserver(
      {
        current: coreRef.current?.getElement() || null,
      } as React.RefObject<HTMLElement>,
      () => {
        updateWaveUnderlineDimensions();
      },
    );

    // 处理内容变化 - 立即响应，延迟更新UI
    const handleChange = useCallback(
      (text: string) => {
        // 立即触发onChange，保证数据同步
        onChange?.(text);

        // 延迟更新波浪线位置，避免阻塞
        if (spellcheck) {
          requestIdleCallback(
            () => {
              updateWaveUnderlineDimensions();
            },
            { timeout: 50 },
          );
        }
      },
      [onChange, spellcheck, updateWaveUnderlineDimensions],
    );

    // 单独处理撤销状态记录
    const handleUndoStateChange = useCallback(() => {
      if (undoOnChange && coreRef.current) {
        const element = coreRef.current.getElement();
        const selection = coreRef.current.getSelection();
        if (element && selection) {
          undoOnChange({
            content: element.innerHTML,
            selection,
          });
        }
      }
    }, [undoOnChange]);

    // 处理选择变化
    const handleSelectionChange = useCallback(
      (newSelection: { start: number; end: number }) => {
        if (!coreRef.current) return;

        const element = coreRef.current.getElement();
        if (!element) return;

        // 如果需要撤销功能，调用 undoOnChange
        if (undoOnChange) {
          undoOnChange({
            content: element.innerHTML,
            selection: newSelection,
          });
        }
      },
      [undoOnChange],
    );

    // 防抖定时器
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const spellCheckTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 完全隔离的输入处理 - 不触发任何拼写检查相关操作
    const handleInput = useCallback(() => {
      // 输入时不做任何拼写检查相关操作，保证最佳响应性
      if (spellcheck) {
        // 清除之前的定时器
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        // 根据文本长度使用激进的防抖延迟
        const element = coreRef.current?.getElement();
        const textLength = element?.innerText?.length || 0;
        let delay: number;

        if (textLength > 20000) {
          delay = 3000; // 大文本：3秒后才检查
        } else if (textLength > 10000) {
          delay = 2000; // 中等文本：2秒
        } else if (textLength > 5000) {
          delay = 1000; // 较大文本：1秒
        } else {
          delay = 500; // 小文本：0.5秒
        }

        // 使用独立的定时器进行拼写检查
        debounceTimerRef.current = setTimeout(() => {
          // 在独立的宏任务中执行，完全不阻塞输入
          if (spellCheckTimerRef.current) {
            clearTimeout(spellCheckTimerRef.current);
          }

          spellCheckTimerRef.current = setTimeout(() => {
            requestIdleCallback(
              () => {
                updateWaveUnderlineDimensions();
                performSpellCheck();
              },
              { timeout: 100 },
            );
          }, 0);
        }, delay);
      }
    }, [spellcheck, updateWaveUnderlineDimensions, performSpellCheck]);

    // 监听 value 变化，触发拼写检查（用于撤销/重做等程序化更新）
    React.useEffect(() => {
      if (spellcheck && value !== undefined) {
        // 延迟执行拼写检查，确保 DOM 已更新
        setTimeout(() => {
          updateWaveUnderlineDimensions();
          performSpellCheck();
        }, 100);
      }
    }, [value, spellcheck, updateWaveUnderlineDimensions, performSpellCheck]);

    // 清理定时器
    React.useEffect(() => {
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        if (spellCheckTimerRef.current) {
          clearTimeout(spellCheckTimerRef.current);
        }
      };
    }, []);

    // 暴露方法给父组件
    useImperativeHandle(
      ref,
      () => ({
        focus: () => coreRef.current?.focus(),
        blur: () => coreRef.current?.blur(),
        getSelection: () => coreRef.current?.getSelection() || null,
        setSelection: (start: number, end: number) => {
          coreRef.current?.setSelection(start, end);
        },
        insertText: (text: string) => {
          coreRef.current?.insertText(text);
        },
        replaceText: (start: number, end: number, text: string) => {
          coreRef.current?.replaceText(start, end, text);
        },
        getElement: () => coreRef.current?.getElement() || null,
      }),
      [],
    );

    return (
      <div style={{ position: 'relative' }}>
        <ContentEditableCore
          ref={coreRef}
          value={onChange ? value : undefined} // 只在受控模式下传递 value
          selection={selection}
          onChange={handleChange}
          onSelectionChange={handleSelectionChange}
          onInput={handleInput}
          onFocus={onFocus}
          onBlur={onBlur}
          onUndoStateChange={handleUndoStateChange}
          placeholder={placeholder}
          className={className}
          // 直接传递样式 props
          fontSize={fontSize}
          lineHeight={lineHeight}
          fontFamily={fontFamily}
          padding={padding}
          minHeight={minHeight}
          maxHeight={maxHeight}
          borderRadius={borderRadius}
          backgroundColor={backgroundColor}
          color={color}
          border={border}
        />

        {spellcheck && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 1,
              // 使用CSS层叠上下文隔离，避免影响主编辑器
              willChange: 'transform',
              transform: 'translateZ(0)', // 强制GPU加速
            }}
          >
            <WaveUnderline
              ranges={ranges}
              color="#ff3366"
              width={waveUnderlineDimensions.width}
              height={waveUnderlineDimensions.height}
              top={waveUnderlineDimensions.top}
              left={waveUnderlineDimensions.left}
            />
          </div>
        )}

        {children}
      </div>
    );
  },
);

ContentEditable.displayName = 'ContentEditable';

export default ContentEditable;
