import { useEffect, useRef, useState } from 'react';
import {
  type CustomDictionary,
  createCustomDictionary,
} from './customDictionary';

export const useSpellChecker = () => {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const customDictionary = useRef<CustomDictionary | null>(null);

  useEffect(() => {
    // 初始化自定义词典
    customDictionary.current = createCustomDictionary({
      storageKey: 'nova-editor-custom-dictionary',
      maxWords: 10000,
      autoSave: true,
    });

    // 初始化 Worker
    const newWorker = new Worker(new URL('./worker', import.meta.url), {
      type: 'module',
    });

    // 设置 Worker 引用到自定义词典
    customDictionary.current.setWorker(newWorker);

    setWorker(newWorker);

    // Worker 消息处理
    newWorker.onmessage = (event) => {
      if (event.data.type === 'DICTIONARY_READY') {
        setIsReady(true);
      }
    };

    // 加载字典
    const loadDictionary = async () => {
      try {
        const [affData, dicData] = await Promise.all([
          fetch(new URL('../assets/en_US.aff', import.meta.url)).then((res) =>
            res.text(),
          ),
          fetch(new URL('../assets/en_US.dic', import.meta.url)).then((res) =>
            res.text(),
          ),
        ]);

        newWorker.postMessage({
          type: 'INIT_DICTIONARY',
          payload: { affData, dicData },
        });

        // 同步现有的自定义单词到 Worker
        const customWords = customDictionary.current?.getAllWords() || [];
        for (const word of customWords) {
          newWorker.postMessage({
            type: 'ADD_WORD',
            payload: { word },
          });
        }
      } catch (error) {
        console.error('字典加载失败', error);
      }
    };

    loadDictionary();

    return () => {
      newWorker.terminate();
      customDictionary.current = null;
    };
  }, []);

  // 拼写检查方法（本地快速检查）
  const check = (word: string) => {
    return customDictionary.current?.hasWord(word) || false;
  };

  // 自定义词典操作
  const addWord = (word: string): boolean => {
    const result = customDictionary.current?.addWord(word) || false;
    // 确保同步到 Worker（双重保险）
    if (result && worker) {
      worker.postMessage({
        type: 'ADD_WORD',
        payload: { word: word.toLowerCase().trim() },
      });
    }
    return result;
  };

  const removeWord = (word: string): boolean => {
    const result = customDictionary.current?.removeWord(word) || false;
    // 确保同步到 Worker（双重保险）
    if (result && worker) {
      worker.postMessage({
        type: 'REMOVE_WORD',
        payload: { word: word.toLowerCase().trim() },
      });
    }
    return result;
  };

  const addWords = (words: string[]) => {
    return (
      customDictionary.current?.addWords(words) || { added: 0, failed: words }
    );
  };

  const removeWords = (words: string[]) => {
    return (
      customDictionary.current?.removeWords(words) || {
        removed: 0,
        notFound: words,
      }
    );
  };

  const clearCustomWords = () => {
    customDictionary.current?.clear();
  };

  const getAllCustomWords = (): string[] => {
    return customDictionary.current?.getAllWords() || [];
  };

  const getCustomWordCount = (): number => {
    return customDictionary.current?.getWordCount() || 0;
  };

  const addWordsFromText = (text: string) => {
    return (
      customDictionary.current?.addWordsFromText(text) || {
        added: 0,
        failed: [],
      }
    );
  };

  const exportCustomDictionary = (): string => {
    return (
      customDictionary.current?.exportToJSON() ||
      '{"words":[],"exportDate":"","version":"1.0"}'
    );
  };

  const importCustomDictionary = (jsonString: string) => {
    return (
      customDictionary.current?.importFromJSON(jsonString) || {
        imported: 0,
        failed: [],
      }
    );
  };

  const getCustomDictionaryStats = () => {
    return (
      customDictionary.current?.getStats() || {
        wordCount: 0,
        maxWords: 0,
        usageRatio: 0,
        storageKey: '',
      }
    );
  };

  // 拼写建议功能
  const getSuggestions = (word: string): Promise<string[]> => {
    return new Promise((resolve) => {
      if (!worker || !isReady) {
        resolve([]);
        return;
      }

      const handleMessage = (event: MessageEvent) => {
        if (
          event.data.type === 'SUGGESTIONS_RESULT' &&
          event.data.payload.word === word
        ) {
          worker.removeEventListener('message', handleMessage);
          resolve(event.data.payload.suggestions || []);
        }
      };

      worker.addEventListener('message', handleMessage);
      worker.postMessage({
        type: 'GET_SUGGESTIONS',
        payload: { word },
      });

      // 超时处理
      setTimeout(() => {
        worker.removeEventListener('message', handleMessage);
        resolve([]);
      }, 1000);
    });
  };

  return {
    // 基础功能
    worker,
    isReady,
    check,

    // 自定义词典管理
    addWord,
    removeWord,
    addWords,
    removeWords,
    clearCustomWords,
    getAllCustomWords,
    getCustomWordCount,
    addWordsFromText,

    // 导入导出
    exportCustomDictionary,
    importCustomDictionary,

    // 统计信息
    getCustomDictionaryStats,

    // 拼写建议
    getSuggestions,
  };
};
