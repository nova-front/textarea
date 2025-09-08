import * as dictionaryData from './data.json';

/**
 * 英文词典类，用于高效单词校验
 */
export class EnglishDictionary {
  private wordSet: Set<string>; // 存储所有单词（小写）
  private prefixMap: Map<string, boolean>; // 前缀索引表
  private readonly prefixLength = 3; // 前缀长度

  /**
   * 创建词典实例
   * @param words 初始单词数组
   */
  constructor() {
    const words = dictionaryData.dictionary;
    this.wordSet = new Set(words.map((w) => w.toLowerCase()));
    this.prefixMap = new Map();

    // 构建3字母前缀索引
    // 为了兼容低版本 ES 标准，将 Set 转换为数组进行迭代
    for (const word of Array.from(this.wordSet)) {
      const prefix = word.slice(0, this.prefixLength);
      this.prefixMap.set(prefix, true);
    }
  }

  /**
   * 向词典中插入新单词，并更新前缀索引
   * @param word 待添加单词
   */
  insert(word: string): void {
    const lowerWord = word.toLowerCase();
    // 将单词加入集合（自动去重）
    this.wordSet.add(lowerWord);
    // 提取单词前缀并更新前缀索引
    const prefix = lowerWord.slice(0, this.prefixLength);
    this.prefixMap.set(prefix, true);
  }

  /**
   * 检查单词是否在词典中
   * @param word 待检查单词
   * @returns 是否有效单词（不区分大小写）
   */
  check(word: string): boolean {
    const lowerWord = word.toLowerCase();
    const prefix = lowerWord.slice(0, this.prefixLength);

    // 先检查前缀快速过滤
    if (!this.prefixMap.has(prefix)) return false;
    return this.wordSet.has(lowerWord);
  }
}
