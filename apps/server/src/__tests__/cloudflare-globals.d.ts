interface D1Database {
  prepare(query: string): {
    bind(...values: unknown[]): {
      first<T = unknown>(): Promise<T | null>;
      all<T = unknown>(): Promise<{ results: T[] }>;
      run(): Promise<unknown>;
    };
    first<T = unknown>(): Promise<T | null>;
    all<T = unknown>(): Promise<{ results: T[] }>;
    run(): Promise<unknown>;
  };
}

declare const crypto: {
  randomUUID(): string;
  subtle: {
    importKey(
      format: string,
      keyData: BufferSource,
      algorithm: unknown,
      extractable: boolean,
      keyUsages: string[]
    ): Promise<CryptoKey>;
    sign(algorithm: string, key: CryptoKey, data: BufferSource): Promise<ArrayBuffer>;
    verify(
      algorithm: string,
      key: CryptoKey,
      signature: BufferSource,
      data: BufferSource
    ): Promise<boolean>;
  };
};

interface CryptoKey {}
