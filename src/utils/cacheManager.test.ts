/**
 * cacheManager Test Suite
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CacheManager } from './cacheManager';

describe('CacheManager', () => {
  let cacheManager: CacheManager;
  const TEST_KEY = 'test-key';
  const TEST_VALUE = {
    id: 'test-id',
    name: 'Test Name',
    data: 'Test Data',
  };

  beforeEach(() => {
    // 清理 IndexedDB - Mock the full API
    const mockDB: any = {
      objectStoreNames: {
        contains: vi.fn((name: string) => name === 'reminders'),
      },
      createObjectStore: vi.fn(),
      transaction: vi.fn().mockReturnValue({
        objectStore: vi.fn().mockReturnValue({
          put: vi.fn().mockResolvedValue(undefined),
          get: vi.fn().mockResolvedValue(TEST_VALUE),
          delete: vi.fn().mockResolvedValue(undefined),
          clear: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    };

    const mockOpenRequest: any = {
      result: mockDB,
      error: null,
    };

    window.indexedDB = {
      deleteDatabase: vi.fn().mockResolvedValue(undefined),
      open: vi.fn().mockResolvedValue(mockOpenRequest),
    } as unknown as IDBFactory;
    cacheManager = new CacheManager();
  });

  afterEach(async () => {
    // 清理缓存
    if (cacheManager) {
      await cacheManager.clear();
      cacheManager.close();
    }
  });

  describe('Initialization', () => {
    it('should initialize with default database name and store name', async () => {
      expect(cacheManager).toBeDefined();
      expect(cacheManager['dbName']).toBe('projectflow_cache');
      expect(cacheManager['storeName']).toBe('reminders');
    });

    it('should create IndexedDB instance on first use', async () => {
      await cacheManager.save(TEST_KEY, TEST_VALUE);
      expect(cacheManager['db']).toBeDefined();
    });
  });

  describe('save()', () => {
    it('should save data to IndexedDB', async () => {
      await cacheManager.save(TEST_KEY, TEST_VALUE);
      const retrieved = await cacheManager.get(TEST_KEY);

      expect(retrieved).toEqual(TEST_VALUE);
    });

    it('should overwrite existing data with same key', async () => {
      await cacheManager.save(TEST_KEY, TEST_VALUE);
      const newValue = { ...TEST_VALUE, name: 'Updated Name' };
      await cacheManager.save(TEST_KEY, newValue);
      const retrieved = await cacheManager.get(TEST_KEY);

      expect(retrieved).toEqual(newValue);
    });

    it('should handle empty objects', async () => {
      const emptyValue: Record<string, unknown> = {};
      await cacheManager.save(TEST_KEY, emptyValue);
      const retrieved = await cacheManager.get(TEST_KEY);

      expect(retrieved).toEqual(emptyValue);
    });

    it('should handle nested objects', async () => {
      const nestedValue = {
        level1: {
          level2: {
            level3: 'deep data',
          },
        },
      };
      await cacheManager.save(TEST_KEY, nestedValue);
      const retrieved = await cacheManager.get(TEST_KEY);

      expect(retrieved).toEqual(nestedValue);
    });
  });

  describe('get()', () => {
    it('should retrieve saved data', async () => {
      await cacheManager.save(TEST_KEY, TEST_VALUE);
      const retrieved = await cacheManager.get(TEST_KEY);

      expect(retrieved).toEqual(TEST_VALUE);
    });

    it('should return null for non-existent key', async () => {
      const retrieved = await cacheManager.get('non-existent-key');

      expect(retrieved).toBeNull();
    });

    it('should return the same object reference', async () => {
      await cacheManager.save(TEST_KEY, TEST_VALUE);
      const retrieved1 = await cacheManager.get(TEST_KEY);
      const retrieved2 = await cacheManager.get(TEST_KEY);

      expect(retrieved1).toBe(retrieved2);
    });
  });

  describe('remove()', () => {
    it('should remove saved data', async () => {
      await cacheManager.save(TEST_KEY, TEST_VALUE);
      await cacheManager.remove(TEST_KEY);
      const retrieved = await cacheManager.get(TEST_KEY);

      expect(retrieved).toBeNull();
    });

    it('should handle removal of non-existent key without error', async () => {
      await expect(cacheManager.remove('non-existent-key')).resolves.not.toThrow();
    });
  });

  describe('clear()', () => {
    it('should clear all cached data', async () => {
      await cacheManager.save('key1', { id: '1', name: 'Test 1' });
      await cacheManager.save('key2', { id: '2', name: 'Test 2' });
      await cacheManager.clear();

      const retrieved1 = await cacheManager.get('key1');
      const retrieved2 = await cacheManager.get('key2');

      expect(retrieved1).toBeNull();
      expect(retrieved2).toBeNull();
    });

    it('should not throw error when clearing empty cache', async () => {
      await expect(cacheManager.clear()).resolves.not.toThrow();
    });
  });

  describe('close()', () => {
    it('should close database connection', async () => {
      await cacheManager.save(TEST_KEY, TEST_VALUE);
      await cacheManager.close();

      expect(cacheManager['db']).toBeNull();
    });
  });

  describe('Type Safety', () => {
    it('should handle string data', async () => {
      await cacheManager.save('string-key', 'test string' as unknown as Record<string, unknown>);
      const retrieved = await cacheManager.get('string-key');

      expect(retrieved).toBe('test string');
    });

    it('should handle number data', async () => {
      await cacheManager.save('number-key', 42 as unknown as Record<string, unknown>);
      const retrieved = await cacheManager.get('number-key');

      expect(retrieved).toBe(42);
    });

    it('should handle boolean data', async () => {
      await cacheManager.save('boolean-key', true as unknown as Record<string, unknown>);
      const retrieved = await cacheManager.get('boolean-key');

      expect(retrieved).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid key names', async () => {
      await expect(cacheManager.save('', TEST_VALUE)).resolves.not.toThrow();
      await expect(cacheManager.get('')).resolves.toBeNull();
    });

    it('should handle very long keys', async () => {
      const longKey = 'a'.repeat(10000);
      await expect(cacheManager.save(longKey, TEST_VALUE)).resolves.not.toThrow();
      const retrieved = await cacheManager.get(longKey);

      expect(retrieved).toEqual(TEST_VALUE);
    });
  });

  describe('Performance', () => {
    it('should handle bulk operations efficiently', async () => {
      const startTime = Date.now();
      const operations = 100;

      for (let i = 0; i < operations; i++) {
        await cacheManager.save(`key-${i}`, { id: i, value: `value-${i}` });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
