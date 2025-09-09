import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import useUndo from 'use-undo';
import { debounce } from '../../utils';
import {
  ContentEditable,
  type ContentEditableHandle,
  type ContentEditableProps,
} from '../content-editable';

interface EditorState {
  content: string;
  selection: { start: number; end: number };
}

interface UndoableEditorProps
  extends Omit<
    ContentEditableProps,
    'value' | 'selection' | 'onChange' | 'onFocus' | 'onBlur' | 'ref'
  > {}

// 类型定义
export interface UndoableEditorHandle {
  undo: () => void;
  redo: () => void;
  getState: () => EditorState;
}

// 修改后的组件定义
export const UndoableEditor = forwardRef<
  UndoableEditorHandle,
  UndoableEditorProps
>((props, ref) => {
  const [state, { undo, redo, set: setState }] = useUndo<EditorState>({
    content: '',
    selection: { start: 0, end: 0 },
  });

  const editorRef = useRef<ContentEditableHandle>(null);
  const isInternalUpdate = useRef(false);
  const lastKeyPressed = useRef<string | null>(null);

  // 防抖配置（300ms普通输入，立即提交的特殊按键）
  const debouncedSetState = useRef(
    debounce(
      (newState: unknown) => {
        if (!isInternalUpdate.current) {
          setState(newState as EditorState);
        }
      },
      300,
      { leading: false, trailing: true },
    ),
  );

  // 立即提交的特殊按键（Enter、Backspace等）
  const shouldFlushImmediately = useCallback((key: string) => {
    return ['Enter', 'Backspace', 'Delete'].includes(key);
  }, []);

  // 暴露API
  useImperativeHandle(
    ref,
    () => ({
      undo: () => {
        isInternalUpdate.current = true;
        undo();
        setTimeout(() => {
          isInternalUpdate.current = false;
        });
      },
      redo: () => {
        isInternalUpdate.current = true;
        redo();
        setTimeout(() => {
          isInternalUpdate.current = false;
        });
      },
      getState: () => state.present,
    }),
    [state, undo, redo],
  );

  const handleChange = useCallback(
    (newState: EditorState) => {
      if (isInternalUpdate.current) return;

      // 特殊按键立即提交
      if (
        lastKeyPressed.current &&
        shouldFlushImmediately(lastKeyPressed.current)
      ) {
        debouncedSetState.current.cancel();
        setState(newState);
      } else {
        debouncedSetState.current(newState);
      }

      lastKeyPressed.current = null;
    },
    [setState, shouldFlushImmediately],
  );

  // 键盘事件监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. 检查焦点状态和实际聚焦元素
      const editorElement = editorRef.current?.getElement();
      const isEditorActive = document.activeElement === editorElement;
      if (!isEditorActive) return;

      // 快捷键处理
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        isInternalUpdate.current = true;
        undo();
        setTimeout(() => {
          isInternalUpdate.current = false;
        }, 0);
      } else if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')
      ) {
        e.preventDefault();
        isInternalUpdate.current = true;
        redo();
        setTimeout(() => {
          isInternalUpdate.current = false;
        }, 0);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <ContentEditable
      {...props}
      ref={editorRef}
      value={state.present.content}
      selection={state.present.selection}
      onChange={() => {}} // 添加空的 onChange 以启用受控模式
      undoOnChange={handleChange}
    />
  );
});
