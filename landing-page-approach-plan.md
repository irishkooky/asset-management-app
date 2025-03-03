# 資産管理アプリ ランディングページアプローチ実装計画

## ランディングページアプローチの概要

ログインしていないユーザーに対して、アプリの機能や価値を紹介するランディングページを表示するアプローチです。このアプローチでは、未認証ユーザーにはダッシュボードではなく、アプリの魅力を伝えるコンテンツを提供します。

## 実装計画

### 1. ランディングページコンポーネントの作成

```typescript
// components/landing-page.tsx
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="space-y-16 py-8">
      {/* ヒーローセクション */}
      <section className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-6 max-w-xl">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            あなたの資産を<span className="text-primary">スマートに管理</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            シンプルで使いやすい資産管理アプリで、収支の把握から将来の貯蓄予測まで一元管理。
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="gap-2">
              <Link href="/sign-in">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  aria-label="Google logo"
                >
                  <title>Google logo</title>
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                今すぐ始める
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#features">詳しく見る</a>
            </Button>
          </div>
        </div>
        <div className="relative w-full max-w-md aspect-[4/3] rounded-lg overflow-hidden shadow-xl">
          <Image
            src="/images/dashboard-preview.png"
            alt="ダッシュボードのプレビュー"
            fill
            className="object-cover"
            priority
          />
        </div>
      </section>

      {/* 特徴セクション */}
      <section id="features" className="scroll-mt-16">
        <h2 className="text-3xl font-bold text-center mb-12">主な機能</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<DashboardIcon className="h-10 w-10 text-primary" />}
            title="直感的なダッシュボード"
            description="総資産残高や収支の推移をひと目で確認できる、シンプルで使いやすいダッシュボード。"
          />
          <FeatureCard
            icon={<RecurringIcon className="h-10 w-10 text-primary" />}
            title="定期的な収支管理"
            description="給料や家賃などの定期的な収支を登録して、自動的に将来の残高を予測。"
          />
          <FeatureCard
            icon={<PredictionIcon className="h-10 w-10 text-primary" />}
            title="貯蓄予測"
            description="現在の収支パターンに基づいて、1ヶ月後、3ヶ月後、1年後の資産残高を予測。"
          />
        </div>
      </section>

      {/* 使い方セクション */}
      <section className="bg-muted/50 rounded-lg p-8">
        <h2 className="text-3xl font-bold text-center mb-8">簡単3ステップ</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StepCard
            number={1}
            title="アカウント登録"
            description="Googleアカウントで簡単登録。面倒な入力は不要です。"
          />
          <StepCard
            number={2}
            title="収支情報の登録"
            description="定期的な収入や支出を登録して、資産管理の基盤を作ります。"
          />
          <StepCard
            number={3}
            title="資産の可視化"
            description="ダッシュボードで資産状況を確認し、将来の貯蓄目標を立てましょう。"
          />
        </div>
      </section>

      {/* CTAセクション */}
      <section className="text-center space-y-6 py-8">
        <h2 className="text-3xl font-bold">今すぐ始めましょう</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          資産管理の第一歩は、現状を把握することから。
          シンプルで使いやすいツールで、あなたの資産管理をサポートします。
        </p>
        <Button asChild size="lg" className="mt-4">
          <Link href="/sign-in">無料で始める</Link>
        </Button>
      </section>
    </div>
  );
}

// 補助コンポーネント
function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card rounded-lg p-6 shadow-sm border">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

// アイコンコンポーネント（実際の実装ではHeroiconsなどのライブラリを使用）
function DashboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 9h.01" />
      <path d="M15 9h.01" />
      <path d="M9 15h.01" />
      <path d="M15 15h.01" />
      <path d="M9 3v18" />
      <path d="M3 9h18" />
    </svg>
  );
}

function RecurringIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}

function PredictionIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 12h20" />
      <path d="M2 20h20" />
      <path d="M2 4h20" />
      <path d="M6 20V4" />
      <path d="M18 20V4" />
      <path d="m6 12 6-3 6 3" />
    </svg>
  );
}
```

### 2. 画像アセットの準備

ランディングページには、アプリの使用イメージを伝えるためのスクリーンショットやイラストが必要です。以下のような画像を準備します：

1. ダッシュボードのプレビュー画像
2. 機能説明用のイラストやスクリーンショット
3. アプリのロゴ（必要に応じて）

これらの画像は `/public/images/` ディレクトリに配置します。

### 3. トップページの修正

トップページ（`app/page.tsx`）を修正して、ログイン状態に応じてランディングページまたはダッシュボードを表示するようにします。

```typescript
// app/page.tsx
import { createClient } from "@/utils/supabase/server";
import { getAllPredictions } from "@/utils/predictions";
import { getTotalBalance } from "@/utils/supabase/accounts";
import { getUserOneTimeTransactions } from "@/utils/supabase/one-time-transactions";
import { getUserRecurringTransactions } from "@/utils/supabase/recurring-transactions";
import LandingPage from "@/components/landing-page";
import Dashboard from "@/components/dashboard"; // ダッシュボードコンポーネントを作成する必要があります

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // ログインしていない場合はランディングページを表示
  if (!user) {
    return <LandingPage />;
  }
  
  // ログインしている場合はダッシュボードを表示
  // データ取得
  const totalBalance = await getTotalBalance();
  const predictions = await getAllPredictions();
  const recurringTransactions = await getUserRecurringTransactions();
  
  // 最近の臨時収支を取得（過去1ヶ月）
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const recentTransactions = await getUserOneTimeTransactions(
    undefined,
    oneMonthAgo,
    new Date(),
  );
  
  return (
    <Dashboard 
      totalBalance={totalBalance}
      predictions={predictions}
      recurringTransactions={recurringTransactions}
      recentTransactions={recentTransactions}
    />
  );
}
```

### 4. ダッシュボードコンポーネントの作成

現在のトップページのコンテンツを別コンポーネントに移動します。

```typescript
// components/dashboard.tsx
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Dashboard({ 
  totalBalance, 
  predictions, 
  recurringTransactions, 
  recentTransactions 
}: {
  totalBalance: number;
  predictions: any[];
  recurringTransactions: any[];
  recentTransactions: any[];
}) {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>

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

### 5. メタデータの最適化

ランディングページのSEOを最適化するために、メタデータを設定します。

```typescript
// app/layout.tsx の修正
export const metadata = {
  title: '資産管理アプリ - シンプルで使いやすい家計簿・資産管理ツール',
  description: '収支の把握から将来の貯蓄予測まで一元管理できる資産管理アプリ。シンプルで使いやすいインターフェースで、あなたの資産管理をサポートします。',
};
```

## ランディングページアプローチのメリット

1. **ユーザー獲得**: アプリの価値提案を明確に伝えることで、新規ユーザーの獲得につながる
2. **第一印象の向上**: 空のダッシュボードよりも魅力的な第一印象を与えられる
3. **機能説明**: アプリの機能や使い方を紹介できる
4. **信頼性の構築**: セキュリティや使いやすさなどの情報を提供することで、ユーザーの信頼を得られる

## ランディングページアプローチのデメリット

1. **追加の開発工数**: ランディングページの設計・実装に追加の工数が必要
2. **コンテンツ管理**: 魅力的なコンテンツやビジュアルの作成・管理が必要
3. **ユーザー体験の分断**: ログイン前後でUIが大きく変わるため、一貫性が低下する可能性がある

## 実装手順

1. `components/landing-page.tsx` ファイルを作成し、ランディングページコンポーネントを実装
2. 必要な画像アセットを `/public/images/` ディレクトリに配置
3. `components/dashboard.tsx` ファイルを作成し、現在のダッシュボード機能を移行
4. `app/page.tsx` を修正して、ログイン状態に応じてコンポーネントを切り替え
5. メタデータを最適化

## 考慮すべき追加事項

- **レスポンシブデザイン**: モバイルからデスクトップまで、様々な画面サイズに対応したデザイン
- **パフォーマンス最適化**: 画像の最適化、コンポーネントの遅延読み込みなど
- **アクセシビリティ**: スクリーンリーダー対応、キーボードナビゲーションなど
- **A/Bテスト**: 異なるランディングページデザインのテストによる最適化

## 次のステップ

1. ランディングページのデザイン詳細化
2. 必要な画像アセットの準備
3. コンポーネントの実装
4. テストとフィードバック収集