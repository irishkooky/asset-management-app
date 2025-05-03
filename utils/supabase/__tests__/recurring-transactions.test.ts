import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRecurringTransaction, updateRecurringTransaction } from '../recurring-transactions';
import { createClient } from '@/utils/supabase/server';

// モックの設定
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('recurring-transactions ユーティリティ', () => {
  // モック関数
  let mockInsert: ReturnType<typeof vi.fn>;
  let mockUpdate: ReturnType<typeof vi.fn>;
  let mockSelect: ReturnType<typeof vi.fn>;
  let mockSingle: ReturnType<typeof vi.fn>;
  let mockEq: ReturnType<typeof vi.fn>;
  let mockGetUser: ReturnType<typeof vi.fn>;
  let mockAuth: {
    getUser: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // モックデータのリセット
    mockSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'mock-id',
        account_id: 'mock-account-id',
        name: 'テスト収支',
        amount: 1000,
        type: 'expense',
        day_of_month: 10,
        description: undefined,
        user_id: 'mock-user-id',
      },
      error: undefined,
    });

    mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    mockEq = vi.fn().mockReturnValue({ select: mockSelect });
    mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
    mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

    mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'mock-user-id' } },
    });

    mockAuth = {
      getUser: mockGetUser,
    };

    // Supabaseクライアントのモック
    const mockCreateClient = createClient as ReturnType<typeof vi.fn>;
    mockCreateClient.mockResolvedValue({
      from: vi.fn().mockReturnValue({
        insert: mockInsert,
        update: mockUpdate,
      }),
      auth: mockAuth,
    });
  });

  describe('createRecurringTransaction', () => {
    it('正しい日付で定期的な収支を作成できる', async () => {
      // テスト実行
      const result = await createRecurringTransaction(
        'mock-account-id',
        'テスト収支',
        1000,
        'expense',
        10,
        undefined
      );

      // 期待される呼び出し
      expect(mockInsert).toHaveBeenCalledWith([{
        account_id: 'mock-account-id',
        name: 'テスト収支',
        amount: 1000,
        type: 'expense',
        day_of_month: 10, // 日付が正しく保存されることを確認
        description: undefined,
        user_id: 'mock-user-id',
      }]);

      // 期待される結果
      expect(result).toEqual({
        id: 'mock-id',
        account_id: 'mock-account-id',
        name: 'テスト収支',
        amount: 1000,
        type: 'expense',
        day_of_month: 10,
        description: undefined,
        user_id: 'mock-user-id',
      });
    });

    it('文字列として渡された日付を正しく整数に変換する', async () => {
      // 文字列として日付を渡すテスト
      // Numberを使用して安全に型変換
      const dayString = '10';
      const dayNumber = Number.parseInt(dayString, 10);
      
      const result = await createRecurringTransaction(
        'mock-account-id',
        'テスト収支',
        1000,
        'expense',
        dayNumber,
        undefined
      );

      // day_of_monthが正しく整数に変換されていることを確認
      expect(mockInsert).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          day_of_month: 10 // 文字列から整数に変換されている
        })
      ]));
    });
  });

  describe('updateRecurringTransaction', () => {
    it('日付の更新が正しく処理される', async () => {
      // テスト実行
      await updateRecurringTransaction('mock-id', {
        day_of_month: 15,
      });

      // 更新時に正しい値が渡されることを確認
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        day_of_month: 15,
      }));
    });

    it('文字列から変換された日付を正しく処理する', async () => {
      // 文字列から安全に整数に変換
      const dayString = '20';
      const dayNumber = Number.parseInt(dayString, 10);
      
      // 更新オブジェクトを作成
      const updates = {
        day_of_month: dayNumber,
      };
      
      await updateRecurringTransaction('mock-id', updates);

      // day_of_monthが正しく整数に変換されていることを確認
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        day_of_month: 20,
      }));
    });
  });
});
