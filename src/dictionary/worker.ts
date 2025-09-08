import Typo from 'typo-js';

// LRU 缓存实现（内联版本，避免模块导入问题）
interface LRUNode<K, V> {
  key: K | null;
  value: V | null;
  prev: LRUNode<K, V> | null;
  next: LRUNode<K, V> | null;
}

class LRUCache<K, V> {
  private capacity: number;
  private size: number;
  private cache: Map<K, LRUNode<K, V>>;
  private head: LRUNode<K, V>;
  private tail: LRUNode<K, V>;

  constructor(capacity = 1000) {
    this.capacity = capacity;
    this.size = 0;
    this.cache = new Map();
    this.head = { key: null, value: null, prev: null, next: null };
    this.tail = { key: null, value: null, prev: null, next: null };
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key: K): V | undefined {
    const node = this.cache.get(key);
    if (!node) return undefined;
    this.moveToHead(node);
    return node.value ?? undefined;
  }

  set(key: K, value: V): void {
    const existingNode = this.cache.get(key);
    if (existingNode) {
      existingNode.value = value;
      this.moveToHead(existingNode);
    } else {
      const newNode = { key, value, prev: null, next: null };
      this.cache.set(key, newNode);
      this.addToHead(newNode);
      this.size++;
      if (this.size > this.capacity) {
        const tail = this.removeTail();
        if (tail && tail.key !== null) {
          this.cache.delete(tail.key);
          this.size--;
        }
      }
    }
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
    this.size = 0;
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  private addToHead(node: LRUNode<K, V>): void {
    node.prev = this.head;
    node.next = this.head.next;
    if (this.head.next) this.head.next.prev = node;
    this.head.next = node;
  }

  private removeNode(node: LRUNode<K, V>): void {
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;
  }

  private moveToHead(node: LRUNode<K, V>): void {
    this.removeNode(node);
    this.addToHead(node);
  }

  private removeTail(): LRUNode<K, V> | null {
    const lastNode = this.tail.prev;
    if (lastNode && lastNode !== this.head) {
      this.removeNode(lastNode);
      return lastNode;
    }
    return null;
  }
}

let dictionary: Typo | null = null;
const customWords = new Set<string>();

// 定义拼写检查结果类型
interface SpellCheckResult {
  word: string;
  start: number;
  end: number;
  isCorrect: boolean;
  suggestions?: string[];
}

// 使用 LRU 缓存替代原有的 Map
const checkedCache = new LRUCache<string, boolean>(5000); // 单词检查缓存，最多5000个单词
const regionCache = new LRUCache<
  string,
  { words: string[]; results: SpellCheckResult[] }
>(1000); // 区域缓存，最多1000个区域
const currentCheckCache = new Map<string, boolean>(); // 当前校验缓存（临时使用）

// 增量检查相关
let lastFullText = '';

self.onmessage = async (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'INIT_DICTIONARY': {
      const { affData, dicData } = payload;
      dictionary = new Typo('en_US', affData, dicData);
      checkedCache.clear(); // 初始化字典时清空缓存
      regionCache.clear(); // 清空区域缓存

      // 发送准备就绪消息
      self.postMessage({
        type: 'DICTIONARY_READY',
        payload: { ready: true },
      });
      break;
    }
    case 'ADD_WORD': {
      const addedWord = payload.word.toLowerCase();
      customWords.add(addedWord);
      checkedCache.clear(); // 添加单词时清空缓存
      regionCache.clear(); // 清空区域缓存
      currentCheckCache.clear(); // 清空当前检查缓存

      // 如果有当前文本，立即重新检查
      if (lastFullText) {
        const invalidWords = await processText(lastFullText);
        self.postMessage({
          type: 'CHECK_RESULT',
          payload: { invalidWords, currentCheckCache },
        });
      }

      // 通知前端词典已更新
      self.postMessage({
        type: 'DICTIONARY_UPDATED',
        payload: { action: 'ADD_WORD', word: payload.word },
      });
      break;
    }
    case 'REMOVE_WORD': {
      const removedWord = payload.word.toLowerCase();
      customWords.delete(removedWord);
      checkedCache.clear(); // 移除单词时清空缓存
      regionCache.clear(); // 清空区域缓存
      currentCheckCache.clear(); // 清空当前检查缓存

      // 如果有当前文本，立即重新检查
      if (lastFullText) {
        const invalidWords = await processText(lastFullText);
        self.postMessage({
          type: 'CHECK_RESULT',
          payload: { invalidWords, currentCheckCache },
        });
      }

      // 通知前端词典已更新
      self.postMessage({
        type: 'DICTIONARY_UPDATED',
        payload: { action: 'REMOVE_WORD', word: payload.word },
      });
      break;
    }
    case 'CLEAR_WORDS':
      customWords.clear();
      checkedCache.clear(); // 清空单词时清空缓存
      regionCache.clear(); // 清空区域缓存
      break;
    case 'GET_CACHE_STATS': {
      // 新增：获取缓存统计信息
      self.postMessage({
        type: 'CACHE_STATS',
        payload: {
          checkedCacheSize: checkedCache.has('dummy')
            ? 'LRU Cache Active'
            : 'LRU Cache Active',
          regionCacheSize: regionCache.has('dummy')
            ? 'LRU Cache Active'
            : 'LRU Cache Active',
          customWordsCount: customWords.size,
        },
      });
      break;
    }
    case 'GET_SUGGESTIONS': {
      const { word } = payload;
      const suggestions = getSuggestions(word);
      self.postMessage({
        type: 'SUGGESTIONS_RESULT',
        payload: { word, suggestions },
      });
      break;
    }
    case 'CHECK_TEXT': {
      const { fullText } = payload;
      const invalidWords = await processText(fullText);
      lastFullText = fullText; // 保存当前文本
      self.postMessage({
        type: 'CHECK_RESULT',
        payload: { invalidWords, currentCheckCache },
      });
      break;
    }
    case 'CHECK_INCREMENTAL': {
      const { fullText, regions } = payload;
      const invalidWords = await processIncrementalText(fullText, regions);
      lastFullText = fullText; // 更新保存的文本
      self.postMessage({
        type: 'CHECK_RESULT',
        payload: { invalidWords, currentCheckCache },
      });
      break;
    }
    default:
      break;
  }
};

async function processText(fullText: string) {
  const results = [];
  const wordRegex = /\b[a-zA-Z']{2,}\b/g;
  let match: RegExpExecArray | null;
  let startTime = Date.now();

  match = wordRegex.exec(fullText);
  while (match !== null) {
    const word = match[0];
    const lowerWord = word.toLowerCase();

    // 优先使用缓存结果
    if (checkedCache.has(lowerWord)) {
      if (!checkedCache.get(lowerWord)) {
        results.push({
          word,
          start: match.index,
          end: match.index + word.length,
        });
        currentCheckCache.set(lowerWord, false);
      }
    } else {
      // 首次检查时计算并缓存结果
      const isValid =
        customWords.has(lowerWord) || (dictionary?.check(lowerWord) ?? true);
      checkedCache.set(lowerWord, isValid);

      if (!isValid) {
        results.push({
          word,
          start: match.index,
          end: match.index + word.length,
        });
        currentCheckCache.set(lowerWord, false);
      }
    }

    if (Date.now() - startTime > 16) {
      await new Promise((resolve) => setTimeout(resolve, 0));
      startTime = Date.now();
    }

    match = wordRegex.exec(fullText);
  }

  return results;
}

// 增量文本处理函数
async function processIncrementalText(
  _fullText: string,
  regions: Array<{ start: number; end: number; text: string }>,
) {
  const results: SpellCheckResult[] = [];
  const startTime = Date.now();
  currentCheckCache.clear();

  // 处理每个需要检查的区域
  for (const region of regions) {
    const regionKey = `${region.start}-${region.end}`;
    const regionText = region.text;

    // 检查区域缓存
    const cached = regionCache.get(regionKey);
    if (cached && cached.words.join('') === regionText.replace(/\s+/g, '')) {
      // 使用缓存结果
      results.push(
        ...cached.results.map((r) => ({
          ...r,
          start: r.start + region.start,
          end: r.end + region.start,
        })),
      );
      continue;
    }

    // 处理区域内的单词
    const wordRegex = /\b([a-zA-Z']{2,})\b/g;
    let match: RegExpExecArray | null;
    const regionResults: SpellCheckResult[] = [];
    const regionWords: string[] = [];

    match = wordRegex.exec(regionText);
    while (match !== null) {
      const word = match[0];
      const lowerWord = word.toLowerCase();
      regionWords.push(word);

      // 优先使用缓存结果
      if (checkedCache.has(lowerWord)) {
        if (!checkedCache.get(lowerWord)) {
          const result: SpellCheckResult = {
            word,
            start: match.index,
            end: match.index + word.length,
            isCorrect: false,
          };
          regionResults.push(result);
          results.push({
            ...result,
            start: result.start + region.start,
            end: result.end + region.start,
          });
          currentCheckCache.set(lowerWord, false);
        }
      } else {
        // 首次检查时计算并缓存结果
        const isValid =
          customWords.has(lowerWord) || (dictionary?.check(lowerWord) ?? true);
        checkedCache.set(lowerWord, isValid);

        if (!isValid) {
          const result: SpellCheckResult = {
            word,
            start: match.index,
            end: match.index + word.length,
            isCorrect: false,
          };
          regionResults.push(result);
          results.push({
            ...result,
            start: result.start + region.start,
            end: result.end + region.start,
          });
          currentCheckCache.set(lowerWord, false);
        }
      }

      // 避免长时间阻塞
      if (Date.now() - startTime > 16) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      match = wordRegex.exec(regionText);
    }

    // 缓存区域结果
    regionCache.set(regionKey, {
      words: regionWords,
      results: regionResults,
    });
  }

  return results;
}

// 拼写建议功能
function getSuggestions(word: string, maxSuggestions = 5): string[] {
  if (!dictionary || !word) {
    return [];
  }

  const lowerWord = word.toLowerCase();

  // 首先检查是否在自定义词典中
  if (customWords.has(lowerWord)) {
    return [];
  }

  // 使用 typo-js 的建议功能
  const suggestions = dictionary.suggest(word);

  if (!suggestions || suggestions.length === 0) {
    // 如果 typo-js 没有建议，使用简单的编辑距离算法
    return getSimpleSuggestions(lowerWord, maxSuggestions);
  }

  // 过滤和排序建议
  return suggestions
    .slice(0, maxSuggestions)
    .filter((suggestion) => suggestion.toLowerCase() !== lowerWord);
}

// 简单的拼写建议算法（基于编辑距离）
function getSimpleSuggestions(word: string, maxSuggestions: number): string[] {
  const suggestions: string[] = [];
  const wordLength = word.length;

  // 常见的英文单词列表（简化版）
  const commonWords = [
    'the',
    'be',
    'to',
    'of',
    'and',
    'a',
    'in',
    'that',
    'have',
    'i',
    'it',
    'for',
    'not',
    'on',
    'with',
    'he',
    'as',
    'you',
    'do',
    'at',
    'this',
    'but',
    'his',
    'by',
    'from',
    'they',
    'we',
    'say',
    'her',
    'she',
    'or',
    'an',
    'will',
    'my',
    'one',
    'all',
    'would',
    'there',
    'their',
    'what',
    'so',
    'up',
    'out',
    'if',
    'about',
    'who',
    'get',
    'which',
    'go',
    'me',
    'when',
    'make',
    'can',
    'like',
    'time',
    'no',
    'just',
    'him',
    'know',
    'take',
    'people',
    'into',
    'year',
    'your',
    'good',
    'some',
    'could',
    'them',
    'see',
    'other',
    'than',
    'then',
    'now',
    'look',
    'only',
    'come',
    'its',
    'over',
    'think',
    'also',
    'back',
    'after',
    'use',
    'two',
    'how',
    'our',
    'work',
    'first',
    'well',
    'way',
    'even',
    'new',
    'want',
    'because',
    'any',
    'these',
    'give',
    'day',
    'most',
    'us',
    'is',
    'water',
    'long',
    'very',
    'find',
    'still',
    'life',
    'become',
    'here',
    'old',
    'see',
    'him',
    'two',
    'more',
    'go',
    'do',
    'no',
    'way',
    'could',
    'my',
    'than',
    'first',
    'been',
    'call',
    'who',
    'its',
    'now',
    'find',
    'long',
    'down',
    'day',
    'did',
    'get',
    'come',
    'made',
    'may',
    'part',
  ];

  // 计算编辑距离并找到相似的单词
  for (const candidate of commonWords) {
    if (Math.abs(candidate.length - wordLength) <= 2) {
      const distance = calculateEditDistance(word, candidate);
      if (distance <= 2 && distance > 0) {
        suggestions.push(candidate);
        if (suggestions.length >= maxSuggestions) {
          break;
        }
      }
    }
  }

  return suggestions;
}

// 计算两个字符串之间的编辑距离（Levenshtein距离）
function calculateEditDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  const len1 = str1.length;
  const len2 = str2.length;

  // 初始化矩阵
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [];
    matrix[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // 填充矩阵
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // 删除
          matrix[i][j - 1] + 1, // 插入
          matrix[i - 1][j - 1] + 1, // 替换
        );
      }
    }
  }

  return matrix[len1][len2];
}
