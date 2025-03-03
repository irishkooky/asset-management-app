# 資産管理アプリ実装計画

## デモモードの実装計画

ログインしていないユーザーにもアプリの機能と使用感を体験してもらうためのデモモードを実装します。

### 1. デモデータの作成

デモデータを提供するユーティリティ関数を作成します。

```typescript
// utils/demo-data.ts
export function getDemoTotalBalance() {
  return 1250000; // 例: ¥1,250,000
}

export function getDemoPredictions() {
  const today = new Date();
  
  return [
    {
      period: "1month",
      date: new Date(today.getFullYear(), today.getMonth() + 1, today.getDate()).toISOString().split('T')[0],
      amount: 1300000
    },
    {
      period: "3months",
      date: new Date(today.getFullYear(), today.getMonth() + 3, today.getDate()).toISOString().split('T')[0],
      amount: 1400000
    },
    {
      period: "6months",
      date: new Date(today.getFullYear(), today.getMonth() + 6, today.getDate()).toISOString().split('T')[0],
      amount: 1550000
    },
    {
      period: "12months",
      date: new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).toISOString().split('T')[0],
      amount: 1850000
    }
  ];
}

export function getDemoRecurringTransactions() {
  return [
    {
      id: "demo-1",
      name: "給料",
      type: "income",
      amount: 280000,
      day_of_month: 25
    },
    {
      id: "demo-2",
      name: "家賃",
      type: "expense",
      amount: 85000,
      day_of_month: 5
    },
    {
      id: "demo-3",
      name: "光熱費",
      type: "expense",
      amount: 15000,
      day_of_month: 10
    }
  ];
}

export function getDemoRecentTransactions() {
  const today = new Date();
  
  return [
    {
      id: "demo-recent-1",
      name: "ボーナス",
      type: "income",
      amount: 300000,
      transaction_date: new Date(today.getFullYear(), today.getMonth(), 15).toISOString().split('T')[0]
    },
    {
      id: "demo-recent-2",
      name: "旅行費用",
      type: "expense",
      amount: 120000,
      transaction_date: new Date(today.getFullYear(), today.getMonth(), 10).toISOString().split('T')[0]
    },
    {
      id: "demo-recent-3",
      name: "電化製品購入",
      type: "expense",
      amount: 45000,
      transaction_date: new Date(today.getFullYear(), today.getMonth(), 5).toISOString().split('T')[0]
    }
  ];
}
```

### 2. トップページの修正

トップページ（`app/page.tsx`）を修正して、ログイン状態に応じてデータを切り替えます。

```typescript
// app/page.tsx
import { createClient } from "@/utils/supabase/server";
import { getAllPredictions } from "@/utils/predictions";
import { getTotalBalance } from "@/utils/supabase/accounts";
import { getUserOneTimeTransactions } from "@/utils/supabase/one-time-transactions";
import { getUserRecurringTransactions } from "@/utils/supabase/recurring-transactions";
import { 
  getDemoTotalBalance, 
  getDemoPredictions, 
  getDemoRecurringTransactions, 
  getDemoRecentTransactions 
} from "@/utils/demo-data";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // データ取得（ログイン状態に応じて実データまたはデモデータを取得）
  const totalBalance = user ? await getTotalBalance() : getDemoTotalBalance();
  const predictions = user ? await getAllPredictions() : getDemoPredictions();
  const recurringTransactions = user ? await getUserRecurringTransactions() : getDemoRecurringTransactions();
  
  // 最近の臨時収支
  let recentTransactions;
  if (user) {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    recentTransactions = await getUserOneTimeTransactions(
      undefined,
      oneMonthAgo,
      new Date(),
    );
  } else {
    recentTransactions = getDemoRecentTransactions();
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>
      
      {/* デモモード通知 */}
      {!user && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-medium text-blue-800 dark:text-blue-300">デモモード</h3>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                これはデモデータです。実際のデータを管理するにはログインしてください。
              </p>
            </div>
            <Button asChild size="sm" className="whitespace-nowrap">
              <Link href="/sign-in">ログインする</Link>
            </Button>
          </div>
        </div>
      )}

      {/* 現在の総残高 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium mb-2">現在の総残高</h2>
        <p className="text-3xl font-bold">¥{totalBalance.toLocaleString()}</p>
      </div>

      {/* 貯蓄予測 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium mb-4">貯蓄予測</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">期間</th>
                <th className="text-left py-2">予測日</th>
                <th className="text-right py-2">予測残高</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((prediction) => {
                const periodLabels = {
                  "1month": "1ヶ月後",
                  "3months": "3ヶ月後",
                  "6months": "6ヶ月後",
                  "12months": "1年後",
                };
                const periodLabel =
                  periodLabels[prediction.period as keyof typeof periodLabels];

                return (
                  <tr key={prediction.period} className="border-b">
                    <td className="py-2">{periodLabel}</td>
                    <td className="py-2">{prediction.date}</td>
                    <td className="text-right py-2">
                      ¥{prediction.amount.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 定期的な収支 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium mb-4">定期的な収支</h2>
        {recurringTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">名前</th>
                  <th className="text-left py-2">種別</th>
                  <th className="text-left py-2">日付</th>
                  <th className="text-right py-2">金額</th>
                </tr>
              </thead>
              <tbody>
                {recurringTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b">
                    <td className="py-2">{transaction.name}</td>
                    <td className="py-2">
                      <span
                        className={
                          transaction.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {transaction.type === "income" ? "収入" : "支出"}
                      </span>
                    </td>
                    <td className="py-2">毎月{transaction.day_of_month}日</td>
                    <td className="text-right py-2">
                      ¥{transaction.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">定期的な収支はまだ登録されていません</p>
        )}
      </div>

      {/* 最近の臨時収支 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium mb-4">最近の臨時収支</h2>
        {recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">名前</th>
                  <th className="text-left py-2">種別</th>
                  <th className="text-left py-2">日付</th>
                  <th className="text-right py-2">金額</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b">
                    <td className="py-2">{transaction.name}</td>
                    <td className="py-2">
                      <span
                        className={
                          transaction.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {transaction.type === "income" ? "収入" : "支出"}
                      </span>
                    </td>
                    <td className="py-2">{transaction.transaction_date}</td>
                    <td className="text-right py-2">
                      ¥{transaction.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">最近の臨時収支はありません</p>
        )}
      </div>
    </div>
  );
}
```

### 3. デモデータの視覚的な区別

デモデータであることをより明確にするために、以下の視覚的な区別を追加することも検討できます：

- デモモード時のバナー表示（上記コードに実装済み）
- デモデータのセクションに薄い背景色やボーダーを追加
- デモデータの行に「デモ」バッジを表示

### 4. 実装手順

1. `utils/demo-data.ts` ファイルを作成し、デモデータ関数を実装
2. `app/page.tsx` を修正して、ログイン状態に応じたデータ取得とUI表示を実装
3. デモモードであることを示す通知バナーを追加
4. 必要に応じて、デモデータの視覚的な区別を実装

### 5. 考慮すべき追加事項

- **デモデータの現実性**: 実際のユースケースを反映した現実的なデモデータを用意する
- **パフォーマンス**: デモデータは静的に定義し、不要なデータベースクエリを避ける
- **セキュリティ**: デモモードでは機密性の高い操作（データ削除など）を制限する
- **コンバージョン**: デモモードからログインへの誘導を効果的に行う

## 次のステップ

1. デモデータユーティリティの実装
2. トップページの修正
3. デモモードUIの改善
4. テストとフィードバック収集