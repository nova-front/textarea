import * as dictionaryData from './data.json';

class TrieNode {
  children: Record<string, TrieNode>;
  isEnd: boolean;

  constructor() {
    this.children = {};
    this.isEnd = false;
  }
}

export class DictionaryTrie {
  private root: TrieNode;

  constructor() {
    this.root = new TrieNode();
    const words = dictionaryData.dictionary;
    for (const word of words) {
      this.insert(word);
    }
  }

  insert(word: string): void {
    let node = this.root;
    for (const char of word.toLowerCase()) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEnd = true;
  }

  check(word: string): boolean {
    let node = this.root;
    for (const char of word.toLowerCase()) {
      if (!node.children[char]) return false;
      node = node.children[char];
    }
    return node.isEnd;
  }
}
