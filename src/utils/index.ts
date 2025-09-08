import { convert } from 'html-to-text';

// 文本差异检测相关类型和工具
export interface TextChange {
  type: 'insert' | 'delete' | 'replace';
  start: number;
  end: number;
  text: string;
  oldText?: string;
}

export interface IncrementalCheckRegion {
  start: number;
  end: number;
  text: string;
}

/**
 * 计算两个文本之间的差异，返回需要重新检查的区域
 * @param oldText 旧文本
 * @param newText 新文本
 * @param contextWords 上下文单词数量，用于扩展检查范围
 * @returns 需要重新检查的文本区域
 */
export function calculateIncrementalCheckRegions(
  oldText: string,
  newText: string,
  contextWords = 2,
): IncrementalCheckRegion[] {
  if (!oldText || !newText) {
    return [{ start: 0, end: newText.length, text: newText }];
  }

  const changes = calculateTextChanges(oldText, newText);
  if (changes.length === 0) {
    return []; // 没有变化
  }

  const regions: IncrementalCheckRegion[] = [];

  for (const change of changes) {
    // 扩展检查范围，包含上下文单词
    const expandedRegion = expandRegionWithContext(
      newText,
      change.start,
      change.end,
      contextWords,
    );
    regions.push(expandedRegion);
  }

  // 合并重叠的区域
  return mergeOverlappingRegions(regions);
}

/**
 * 简单的文本差异算法，基于最长公共子序列
 */
function calculateTextChanges(oldText: string, newText: string): TextChange[] {
  const changes: TextChange[] = [];

  // 简化版本：找到第一个和最后一个不同的位置
  let start = 0;
  let oldEnd = oldText.length;
  let newEnd = newText.length;

  // 找到开始不同的位置
  while (
    start < oldEnd &&
    start < newEnd &&
    oldText[start] === newText[start]
  ) {
    start++;
  }

  // 找到结束不同的位置
  while (
    oldEnd > start &&
    newEnd > start &&
    oldText[oldEnd - 1] === newText[newEnd - 1]
  ) {
    oldEnd--;
    newEnd--;
  }

  if (start < oldEnd || start < newEnd) {
    changes.push({
      type: 'replace',
      start,
      end: newEnd,
      text: newText.slice(start, newEnd),
      oldText: oldText.slice(start, oldEnd),
    });
  }

  return changes;
}

/**
 * 扩展区域以包含上下文单词
 */
function expandRegionWithContext(
  text: string,
  start: number,
  end: number,
  contextWords: number,
): IncrementalCheckRegion {
  const wordRegex = /\b([a-zA-Z']{2,})\b/g;
  const words: { start: number; end: number; word: string }[] = [];

  let match: RegExpExecArray | null;
  match = wordRegex.exec(text);
  while (match !== null) {
    words.push({
      start: match.index,
      end: match.index + match[0].length,
      word: match[0],
    });

    match = wordRegex.exec(text);
  }

  // 找到变化区域涉及的单词索引
  let startWordIndex = words.findIndex((w) => w.end > start);
  let endWordIndex = words.findIndex((w) => w.start >= end);

  if (startWordIndex === -1) startWordIndex = words.length;
  if (endWordIndex === -1) endWordIndex = words.length;

  // 扩展上下文
  const expandedStartIndex = Math.max(0, startWordIndex - contextWords);
  const expandedEndIndex = Math.min(words.length, endWordIndex + contextWords);

  const expandedStart =
    expandedStartIndex < words.length ? words[expandedStartIndex].start : start;
  const expandedEnd =
    expandedEndIndex > 0 ? words[expandedEndIndex - 1].end : end;

  return {
    start: expandedStart,
    end: expandedEnd,
    text: text.slice(expandedStart, expandedEnd),
  };
}

/**
 * 合并重叠的区域
 */
function mergeOverlappingRegions(
  regions: IncrementalCheckRegion[],
): IncrementalCheckRegion[] {
  if (regions.length <= 1) return regions;

  // 按开始位置排序
  regions.sort((a, b) => a.start - b.start);

  const merged: IncrementalCheckRegion[] = [regions[0]];

  for (let i = 1; i < regions.length; i++) {
    const current = regions[i];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      // 重叠，合并
      last.end = Math.max(last.end, current.end);
      last.text =
        last.text.slice(0, last.start) +
        current.text.slice(0, current.end - last.start);
    } else {
      merged.push(current);
    }
  }

  return merged;
}

// 光标位置管理工具函数
export const getCharacterOffset = (
  container: HTMLElement,
  node: Node,
  offset: number,
): number => {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        // 跳过不可见元素
        if (node.nodeType === Node.ELEMENT_NODE) {
          const style = window.getComputedStyle(node as Element);
          if (style.display === 'none' || style.visibility === 'hidden') {
            return NodeFilter.FILTER_REJECT;
          }
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    },
  );

  let charCount = 0;

  do {
    const currentNode = walker.currentNode;

    if (currentNode.nodeType === Node.TEXT_NODE) {
      const textLength = currentNode.textContent?.length || 0;

      if (currentNode === node) {
        charCount += Math.min(offset, textLength);
        break;
      }
      charCount += textLength;
    } else if (currentNode.nodeName === 'BR') {
      // 处理换行符
      charCount += 1;
    }
  } while (walker.nextNode());

  return charCount;
};

export const findNodeAndOffset = (
  container: HTMLElement,
  targetOffset: number,
) => {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let charCount = 0;

  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text;
    const textLength = textNode.length;

    if (charCount + textLength >= targetOffset) {
      return { node: textNode, offset: targetOffset - charCount };
    }
    charCount += textLength;
  }

  return { node: container, offset: container.childNodes.length };
};

export interface TextPosition {
  startOffset: number;
  endOffset: number;
  height: number;
  isValid: boolean;
  word: string;
}

export function getTextPositionsWithDictionary(
  editableElement: HTMLElement,
  dictionary: { check: (word: string) => boolean }, // 字典方法
): TextPosition[] {
  const results: TextPosition[] = [];
  if (!editableElement) return results;

  // 获取所有文本节点
  const allTextNodes = getAllTextNodes(editableElement);
  const elementRect = editableElement.getBoundingClientRect();

  // 构建全文和位置映射
  let fullText = '';
  const nodeMap: { node: Text; start: number; end: number }[] = [];

  for (const node of allTextNodes) {
    const text = node.textContent || '';
    nodeMap.push({
      node,
      start: fullText.length,
      end: fullText.length + text.length,
    });
    fullText += `${text} `;
  }

  // 匹配所有英文单词（至少2个字母）
  const wordRegex = /\b([a-zA-Z']{2,})\b/g;
  let match: RegExpExecArray | null;

  match = wordRegex.exec(fullText);
  while (match !== null) {
    const matchedWord = match[1];
    const matchStart = match.index;
    const matchEnd = matchStart + matchedWord.length;

    // 验证单词合法性
    const isValid = dictionary?.check(matchedWord);

    if (isValid === false) {
      // 定位节点
      const { startNode, startOffset, endNode, endOffset } = findNodesFromIndex(
        nodeMap,
        matchStart,
        matchEnd,
      );

      if (!startNode || !endNode) continue;

      // 计算位置
      const range = document.createRange();
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);

      for (const rect of Array.from(range.getClientRects())) {
        if (rect.width > 0 && rect.height > 0 && !isValid) {
          results.push({
            word: matchedWord,
            startOffset: Math.round(rect.left - elementRect.left),
            endOffset: Math.round(rect.right - elementRect.left),
            height: Math.round(rect.bottom - elementRect.top),
            isValid,
          });
        }
      }
    }

    match = wordRegex.exec(fullText);
  }

  return results;
}

export function getTextPositionsWithErrorDictionary(
  editableElement: HTMLElement,
  dictionaryMap: Map<string, boolean>, // 错误单词
): TextPosition[] {
  const results: TextPosition[] = [];
  if (!editableElement) return results;

  try {
    // 获取所有文本节点
    const allTextNodes = getAllTextNodes(editableElement);
    const elementRect = editableElement.getBoundingClientRect();

    // 构建全文和位置映射，正确处理换行符
    let fullText = '';
    const nodeMap: { node: Text; start: number; end: number }[] = [];

    for (let i = 0; i < allTextNodes.length; i++) {
      const node = allTextNodes[i];
      const text = node.textContent || '';

      nodeMap.push({
        node,
        start: fullText.length,
        end: fullText.length + text.length,
      });
      fullText += text;

      // 检查节点后是否有 <br> 标签或者是否需要添加换行符
      if (i < allTextNodes.length - 1) {
        const nextSibling = node.nextSibling;
        const parentElement = node.parentElement;

        // 如果下一个兄弟节点是 <br> 标签，或者当前节点和下一个节点在不同的块级元素中
        if (nextSibling && nextSibling.nodeName === 'BR') {
          fullText += '\n';
        } else if (
          parentElement &&
          parentElement !== allTextNodes[i + 1].parentElement
        ) {
          // 不同的父元素，可能需要换行
          const parentTagName = parentElement.tagName.toLowerCase();
          if (['div', 'p', 'br'].includes(parentTagName)) {
            fullText += '\n';
          }
        }
      }
    }

    // 匹配所有英文单词（至少2个字母）
    const wordRegex = /\b([a-zA-Z']{2,})\b/g;
    const matches = Array.from(fullText.matchAll(wordRegex)); // 使用matchAll一次性获取所有匹配

    let processedCount = 0;

    // 处理所有匹配的单词，不设置数量限制
    for (const match of matches) {
      const matchedWord = match[1];
      const matchStart = match.index || 0;
      const matchEnd = matchStart + matchedWord.length;

      // 验证单词合法性
      const isValid = dictionaryMap.get(matchedWord.toLowerCase()) as boolean;

      if (isValid === false) {
        // 定位节点
        const { startNode, startOffset, endNode, endOffset } =
          findNodesFromIndex(nodeMap, matchStart, matchEnd);

        if (!startNode || !endNode) {
          continue;
        }

        try {
          // 计算位置
          const range = document.createRange();
          range.setStart(startNode, startOffset);
          range.setEnd(endNode, endOffset);

          // 优化：只获取第一个rect，避免复杂的多行处理
          const rect = range.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            results.push({
              word: matchedWord,
              startOffset: Math.round(rect.left - elementRect.left),
              endOffset: Math.round(rect.right - elementRect.left),
              height: Math.round(rect.bottom - elementRect.top),
              isValid: false,
            });
          }
        } catch (rangeError) {
          // 忽略单个range的错误，继续处理其他单词
          console.warn('Range计算错误:', rangeError);
        }
      }

      processedCount++;
    }

    console.log(
      `拼写检查完成: 处理了 ${processedCount} 个单词，发现 ${results.length} 个错误`,
    );
    return results;
  } catch (error) {
    console.error('拼写检查位置计算失败:', error);
    return [];
  }
}

// 获取所有文本节点（包括深层嵌套）
function getAllTextNodes(element: HTMLElement): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      // 过滤掉纯空白文本节点（保留包含换行符的）
      return node.textContent?.trim() || node.textContent?.includes('\n')
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text);
  }
  return nodes;
}

// 辅助函数：根据字符索引定位文本节点
function findNodesFromIndex(
  nodeMap: { node: Text; start: number; end: number }[],
  matchStart: number,
  matchEnd: number,
) {
  let startNode!: Text;
  let endNode!: Text;
  let startOffset = 0;
  let endOffset = 0;

  for (const segment of nodeMap) {
    if (matchStart >= segment.start && matchStart < segment.end) {
      startNode = segment.node;
      startOffset = matchStart - segment.start;
    }
    if (matchEnd > segment.start && matchEnd <= segment.end) {
      endNode = segment.node;
      endOffset = matchEnd - segment.start;
    }
  }

  return { startNode, startOffset, endNode, endOffset };
}

// html 转换成纯文本
export const htmlConvertText = (html: string) => {
  // 转换选项配置
  const options = {
    // wordwrap: 0, // 禁用自动换行
    preserveNewlines: true, // 保留原始换行
    selectors: [
      // 处理段落和换行
      {
        selector: 'p',
        options: { leadingLineBreaks: 1, trailingLineBreaks: 1 },
      },
      { selector: 'br', format: 'lineBreak' },
      // 处理div
      {
        selector: 'div',
        options: { leadingLineBreaks: 1, trailingLineBreaks: 1 },
      },
      // 处理标题
      {
        selector: 'h1',
        options: { leadingLineBreaks: 2, trailingLineBreaks: 2 },
      },
      {
        selector: 'h2',
        options: { leadingLineBreaks: 2, trailingLineBreaks: 2 },
      },
      // 忽略图片
      { selector: 'img', format: 'skip' },
      // 处理链接但不保留href
      { selector: 'a', options: { ignoreHref: true } },
    ],
  };

  return convert(html, options);
};

// 防抖函数
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean } = {},
): T & { cancel: () => void } {
  const { leading = false, trailing = true } = options;
  let timeoutId: NodeJS.Timeout | null = null;
  let lastCallTime = 0;
  let lastInvokeTime = 0;
  let lastArgs: Parameters<T> | undefined;
  let lastThis: unknown;
  let result: ReturnType<T>;

  function invokeFunc(time: number) {
    const args = lastArgs;
    const thisArg = lastThis;
    lastArgs = undefined;
    lastThis = undefined;
    lastInvokeTime = time;
    if (args) {
      result = func.apply(thisArg, args) as ReturnType<T>;
    }
    return result;
  }

  function leadingEdge(time: number) {
    lastInvokeTime = time;
    timeoutId = setTimeout(timerExpired, delay);
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time: number) {
    const timeSinceLastCall = time - lastCallTime;
    const timeWaiting = delay - timeSinceLastCall;
    return timeWaiting;
  }

  function shouldInvoke(time: number) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    return (
      lastCallTime === 0 ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      timeSinceLastInvoke >= delay
    );
  }

  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timeoutId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time: number) {
    timeoutId = null;
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = undefined;
    lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    lastInvokeTime = 0;
    lastArgs = undefined;
    lastCallTime = 0;
    lastThis = undefined;
    timeoutId = null;
  }

  function debounced(this: unknown, ...args: Parameters<T>) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timeoutId === null) {
        return leadingEdge(lastCallTime);
      }
      timeoutId = setTimeout(timerExpired, delay);
      return invokeFunc(lastCallTime);
    }
    if (timeoutId === null) {
      timeoutId = setTimeout(timerExpired, delay);
    }
    return result;
  }

  debounced.cancel = cancel;
  return debounced as T & { cancel: () => void };
}
