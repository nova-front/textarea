// 导出重构后的组件
export { ContentEditable as TextArea } from './components/content-editable';
export { ContentEditableCore as TextAreaCore } from './components/content-editable-core';

// 导出撤销重做编辑器
export { UndoableEditor as TextAreaUndo } from './components/undoable-editor';
export type { UndoableEditorHandle as TextAreaUndoHandle } from './components/undoable-editor';

// 导出自定义词典
export {
  CustomDictionary,
  createCustomDictionary,
} from './dictionary/customDictionary';

// 导出 hooks
export { useSpellChecker } from './dictionary/useTypeByWorker';

// 导出工具函数
export {
  calculateIncrementalCheckRegions,
  htmlConvertText,
  getCharacterOffset,
  findNodeAndOffset,
  debounce,
} from './utils';

// 导出类型
export type {
  TextPosition,
  TextChange,
  IncrementalCheckRegion,
} from './utils';

export type {
  ContentEditableProps as TextAreaProps,
  ContentEditableHandle as TextAreaHandle,
} from './components/content-editable';

export type {
  ContentEditableCoreProps as TextAreaCoreProps,
  ContentEditableCoreHandle as TextAreaCoreHandle,
} from './components/content-editable-core';
