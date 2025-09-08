/**
 * LRU (Least Recently Used) 缓存实现
 * 用于控制拼写检查缓存的内存使用
 */

interface LRUNode<K, V> {
  key: K | null;
  value: V | null;
  prev: LRUNode<K, V> | null;
  next: LRUNode<K, V> | null;
}

export class LRUCache<K, V> {
  private capacity: number;
  private size: number;
  private cache: Map<K, LRUNode<K, V>>;
  private head: LRUNode<K, V>;
  private tail: LRUNode<K, V>;

  constructor(capacity = 1000) {
    this.capacity = capacity;
    this.size = 0;
    this.cache = new Map();

    // 创建虚拟头尾节点
    this.head = {
      key: null,
      value: null,
      prev: null,
      next: null,
    };
    this.tail = {
      key: null,
      value: null,
      prev: null,
      next: null,
    };
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /**
   * 获取缓存值
   */
  get(key: K): V | undefined {
    const node = this.cache.get(key);
    if (!node) {
      return undefined;
    }

    // 移动到头部（最近使用）
    this.moveToHead(node);
    return node.value ?? undefined;
  }

  /**
   * 设置缓存值
   */
  set(key: K, value: V): void {
    const existingNode = this.cache.get(key);

    if (existingNode) {
      // 更新现有节点
      existingNode.value = value;
      this.moveToHead(existingNode);
    } else {
      // 创建新节点
      const newNode: LRUNode<K, V> = {
        key,
        value,
        prev: null,
        next: null,
      };

      this.cache.set(key, newNode);
      this.addToHead(newNode);
      this.size++;

      // 检查是否超出容量
      if (this.size > this.capacity) {
        const tail = this.removeTail();
        if (tail && tail.key !== null) {
          this.cache.delete(tail.key);
          this.size--;
        }
      }
    }
  }

  /**
   * 检查是否存在某个键
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * 删除缓存项
   */
  delete(key: K): boolean {
    const node = this.cache.get(key);
    if (!node) {
      return false;
    }

    this.removeNode(node);
    this.cache.delete(key);
    this.size--;
    return true;
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
    this.size = 0;
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /**
   * 获取当前缓存大小
   */
  getSize(): number {
    return this.size;
  }

  /**
   * 获取缓存容量
   */
  getCapacity(): number {
    return this.capacity;
  }

  /**
   * 获取所有键
   */
  keys(): K[] {
    return Array.from(this.cache.keys());
  }

  /**
   * 获取缓存使用率
   */
  getUsageRatio(): number {
    return this.size / this.capacity;
  }

  // 私有方法

  private addToHead(node: LRUNode<K, V>): void {
    node.prev = this.head;
    node.next = this.head.next;

    if (this.head.next) {
      this.head.next.prev = node;
    }
    this.head.next = node;
  }

  private removeNode(node: LRUNode<K, V>): void {
    if (node.prev) {
      node.prev.next = node.next;
    }
    if (node.next) {
      node.next.prev = node.prev;
    }
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

/**
 * 创建专门用于拼写检查的 LRU 缓存
 */
export function createSpellCheckCache(
  capacity = 5000,
): LRUCache<string, boolean> {
  return new LRUCache<string, boolean>(capacity);
}

/**
 * 创建专门用于区域缓存的 LRU 缓存
 */
export function createRegionCache(
  capacity = 1000,
): LRUCache<string, { words: string[]; results: unknown[] }> {
  return new LRUCache<string, { words: string[]; results: unknown[] }>(
    capacity,
  );
}
