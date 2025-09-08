/**
 * 自定义词典管理器
 * 提供添加、删除、持久化存储等功能
 */

export interface CustomDictionaryOptions {
  storageKey?: string;
  maxWords?: number;
  autoSave?: boolean;
}

export class CustomDictionary {
  private words: Set<string>;
  private storageKey: string;
  private maxWords: number;
  private autoSave: boolean;
  private worker: Worker | null = null;

  constructor(options: CustomDictionaryOptions = {}) {
    this.storageKey = options.storageKey || 'editor-custom-dictionary';
    this.maxWords = options.maxWords || 10000;
    this.autoSave = options.autoSave !== false;
    this.words = new Set();

    this.loadFromStorage();
  }

  /**
   * 设置 Worker 引用用于同步
   */
  setWorker(worker: Worker): void {
    this.worker = worker;
  }

  /**
   * 添加单词到自定义词典
   */
  addWord(word: string): boolean {
    if (!word || typeof word !== 'string') {
      return false;
    }

    const normalizedWord = word.toLowerCase().trim();
    if (!normalizedWord || normalizedWord.length < 2) {
      return false;
    }

    // 检查是否超出最大单词数限制
    if (this.words.size >= this.maxWords && !this.words.has(normalizedWord)) {
      console.warn(
        `Custom dictionary has reached maximum capacity (${this.maxWords} words)`,
      );
      return false;
    }

    const wasAdded = !this.words.has(normalizedWord);
    this.words.add(normalizedWord);

    if (wasAdded) {
      // 同步到 Worker
      this.worker?.postMessage({
        type: 'ADD_WORD',
        payload: { word: normalizedWord },
      });

      // 自动保存
      if (this.autoSave) {
        this.saveToStorage();
      }
    }

    return wasAdded;
  }

  /**
   * 从自定义词典中删除单词
   */
  removeWord(word: string): boolean {
    const normalizedWord = word.toLowerCase().trim();
    const wasRemoved = this.words.delete(normalizedWord);

    if (wasRemoved) {
      // 同步到 Worker
      this.worker?.postMessage({
        type: 'REMOVE_WORD',
        payload: { word: normalizedWord },
      });

      // 自动保存
      if (this.autoSave) {
        this.saveToStorage();
      }
    }

    return wasRemoved;
  }

  /**
   * 检查单词是否在自定义词典中
   */
  hasWord(word: string): boolean {
    return this.words.has(word.toLowerCase().trim());
  }

  /**
   * 获取所有自定义单词
   */
  getAllWords(): string[] {
    return Array.from(this.words).sort();
  }

  /**
   * 获取单词数量
   */
  getWordCount(): number {
    return this.words.size;
  }

  /**
   * 批量添加单词
   */
  addWords(words: string[]): { added: number; failed: string[] } {
    const failed: string[] = [];
    let added = 0;

    for (const word of words) {
      if (this.addWord(word)) {
        added++;
      } else {
        failed.push(word);
      }
    }

    return { added, failed };
  }

  /**
   * 批量删除单词
   */
  removeWords(words: string[]): { removed: number; notFound: string[] } {
    const notFound: string[] = [];
    let removed = 0;

    for (const word of words) {
      if (this.removeWord(word)) {
        removed++;
      } else {
        notFound.push(word);
      }
    }

    return { removed, notFound };
  }

  /**
   * 清空自定义词典
   */
  clear(): void {
    this.words.clear();

    // 同步到 Worker
    this.worker?.postMessage({
      type: 'CLEAR_WORDS',
    });

    // 自动保存
    if (this.autoSave) {
      this.saveToStorage();
    }
  }

  /**
   * 从文本中提取单词并添加到词典
   */
  addWordsFromText(text: string): { added: number; failed: string[] } {
    const wordRegex = /\b([a-zA-Z']{2,})\b/g;
    const words: string[] = [];
    let match: RegExpExecArray | null;

    match = wordRegex.exec(text);
    while (match !== null) {
      words.push(match[0]);
      match = wordRegex.exec(text);
    }

    return this.addWords(words);
  }

  /**
   * 导出词典为 JSON 字符串
   */
  exportToJSON(): string {
    return JSON.stringify(
      {
        words: this.getAllWords(),
        exportDate: new Date().toISOString(),
        version: '1.0',
      },
      null,
      2,
    );
  }

  /**
   * 从 JSON 字符串导入词典
   */
  importFromJSON(jsonString: string): { imported: number; failed: string[] } {
    try {
      const data = JSON.parse(jsonString);
      if (!data.words || !Array.isArray(data.words)) {
        throw new Error('Invalid format: missing words array');
      }

      const result = this.addWords(data.words);
      return { imported: result.added, failed: result.failed };
    } catch (error) {
      console.error('Failed to import custom dictionary:', error);
      return { imported: 0, failed: [] };
    }
  }

  /**
   * 保存到本地存储
   */
  saveToStorage(): void {
    try {
      const data = {
        words: Array.from(this.words),
        lastModified: Date.now(),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save custom dictionary to storage:', error);
    }
  }

  /**
   * 从本地存储加载
   */
  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.words && Array.isArray(data.words)) {
          this.words = new Set(data.words);
        }
      }
    } catch (error) {
      console.error('Failed to load custom dictionary from storage:', error);
      this.words = new Set();
    }
  }

  /**
   * 获取存储统计信息
   */
  getStats(): {
    wordCount: number;
    maxWords: number;
    usageRatio: number;
    storageKey: string;
    lastModified?: number;
  } {
    let lastModified: number | undefined;

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        lastModified = data.lastModified;
      }
    } catch (error) {
      // 忽略错误
    }

    return {
      wordCount: this.words.size,
      maxWords: this.maxWords,
      usageRatio: this.words.size / this.maxWords,
      storageKey: this.storageKey,
      lastModified,
    };
  }
}

/**
 * 创建默认的自定义词典实例
 */
export function createCustomDictionary(
  options?: CustomDictionaryOptions,
): CustomDictionary {
  return new CustomDictionary(options);
}
