/**
 * 缓存管理器 - 使用IndexedDB替代localStorage存储敏感数据
 */

export class CacheManager {
  private dbName = 'projectflow_cache';
  private storeName = 'reminders';
  private db: IDBDatabase | null = null;

  /**
   * 初始化IndexedDB
   */
  private async initDB(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result;
        if (!database.objectStoreNames.contains(this.storeName)) {
          database.createObjectStore(this.storeName);
        }
      };
    });
  }

  /**
   * 保存数据到缓存
   */
  async save(key: string, value: Record<string, unknown>): Promise<void> {
    try {
      await this.initDB();
      if (!this.db) return;

      return new Promise((resolve, reject) => {
        if (!this.db) return;
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put(value, key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('保存缓存失败:', error);
    }
  }

  /**
   * 从缓存获取数据
   */
  async get(key: string): Promise<Record<string, unknown> | null> {
    try {
      await this.initDB();
      if (!this.db) return null;

      return new Promise((resolve, reject) => {
        if (!this.db) return null;
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('获取缓存失败:', error);
      return null;
    }
  }

  /**
   * 删除缓存数据
   */
  async remove(key: string): Promise<void> {
    try {
      await this.initDB();
      if (!this.db) return;

      return new Promise((resolve, reject) => {
        if (!this.db) return;
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('删除缓存失败:', error);
    }
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    try {
      await this.initDB();
      if (!this.db) return;

      return new Promise((resolve, reject) => {
        if (!this.db) return;
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('清空缓存失败:', error);
    }
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// 导出单例实例
export const cacheManager = new CacheManager();
