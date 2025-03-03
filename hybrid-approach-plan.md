# 資産管理アプリ ハイブリッドアプローチ実装計画

## ハイブリッドアプローチの概要

ハイブリッドアプローチは、ランディングページとデモモードの利点を組み合わせたアプローチです。ログインしていないユーザーには魅力的なランディングページを表示しつつ、「デモを見る」ボタンを設置し、ユーザーが実際のアプリ機能を体験できるデモモードを提供します。

## 実装計画

### 1. ルート構造の設計

```
/                  # ランディングページ（未ログイン時）またはダッシュボード（ログイン時）
/demo              # デモモード（未ログイン時でもダッシュボードを表示）
/sign-in           # ログインページ
/dashboard         # ダッシュボード（ログイン必須）
```

### 2. ランディングページコンポーネントの作成

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
                  {/* Google logo SVG path */}
                </svg>
                今すぐ始める
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/demo">デモを見る</Link>
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
          {/* Feature cards */}
        </div>
      </section>

      {/* 使い方セクション */}
      <section className="bg-muted/50 rounded-lg p-8">
        <h2 className="text-3xl font-bold text-center mb-8">簡単3ステップ</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step cards */}
        </div>
      </section>

      {/* CTAセクション */}
      <section className="text-center space-y-6 py-8">
        <h2 className="text-3xl font-bold">今すぐ始めましょう</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          資産管理の第一歩は、現状を把握することから。
          シンプルで使いやすいツールで、あなたの資産管理をサポートします。
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
          <Button asChild size="lg">
            <Link href="/sign-in">無料で始める</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/demo">デモを試す</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
```

### 3. デモデータの作成

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
    // 他の予測データ
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
    // 他の定期的な収支データ
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
    // 他の最近の臨時収支データ
  ];
}
```

### 4. ダッシュボードコンポーネントの作成

```typescript
// components/dashboard.tsx
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Dashboard({ 
  totalBalance, 
  predictions, 
  recurringTransactions, 
  recentTransactions,
  isDemo = false
}: {
  totalBalance: number;
  predictions: any[];
  recurringTransactions: any[];
  recentTransactions: any[];
  isDemo?: boolean;
}) {
  return (
    <div className="space-y-8">
      {/* デモモード通知 */}
      {isDemo && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-medium text-blue-800 dark:text-blue-300">デモモード</h3>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                これはデモデータです。実際のデータを管理するにはログインしてください。
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild size="sm" className="whitespace-nowrap">
                <Link href="/sign-in">ログインする</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="whitespace-nowrap">
                <Link href="/">ホームに戻る</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

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
            {/* テーブルの内容 */}
          </table>
        </div>
      </div>

      {/* 定期的な収支 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium mb-4">定期的な収支</h2>
        {/* テーブルまたは「データなし」メッセージ */}
      </div>

      {/* 最近の臨時収支 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium mb-4">最近の臨時収支</h2>
        {/* テーブルまたは「データなし」メッセージ */}
      </div>
    </div>
  );
}
```

### 5. ルーティングの実装

#### トップページ（`app/page.tsx`）

```typescript
// app/page.tsx
import { createClient } from "@/utils/supabase/server";
import { getAllPredictions } from "@/utils/predictions";
import { getTotalBalance } from "@/utils/supabase/accounts";
import { getUserOneTimeTransactions } from "@/utils/supabase/one-time-transactions";
import { getUserRecurringTransactions } from "@/utils/supabase/recurring-transactions";
import LandingPage from "@/components/landing-page";
import Dashboard from "@/components/dashboard";

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

#### デモページ（`app/demo/page.tsx`）

```typescript
// app/demo/page.tsx
import Dashboard from "@/components/dashboard";
import { 
  getDemoTotalBalance, 
  getDemoPredictions, 
  getDemoRecurringTransactions, 
  getDemoRecentTransactions 
} from "@/utils/demo-data";

export default function DemoPage() {
  // デモデータを取得
  const totalBalance = getDemoTotalBalance();
  const predictions = getDemoPredictions();
  const recurringTransactions = getDemoRecurringTransactions();
  const recentTransactions = getDemoRecentTransactions();
  
  return (
    <Dashboard 
      totalBalance={totalBalance}
      predictions={predictions}
      recurringTransactions={recurringTransactions}
      recentTransactions={recentTransactions}
      isDemo={true}
    />
  );
}
```

### 6. ミドルウェアの修正（必要に応じて）

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  
  // ユーザー情報を取得
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // This is a no-op because we handle setting cookies in updateSession
        },
        remove(name: string, options: CookieOptions) {
          // This is a no-op because we handle removing cookies in updateSession
        },
      },
    }
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  
  // 保護されたルートの設定
  // /dashboard は認証が必要
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images folder)
     * - fonts (public fonts folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|images|fonts).*)',
  ],
};
```

### 7. 画像アセットの準備

ランディングページには、アプリの使用イメージを伝えるためのスクリーンショットやイラストが必要です。以下のような画像を準備します：

1. ダッシュボードのプレビュー画像
2. 機能説明用のイラストやスクリーンショット
3. アプリのロゴ（必要に応じて）

これらの画像は `/public/images/` ディレクトリに配置します。

## ハイブリッドアプローチのメリット

1. **最適なユーザー体験**: ランディングページでアプリの価値を伝えつつ、デモモードで実際の機能を体験できる
2. **マーケティングと機能体験の両立**: マーケティング要素と実際の機能体験の両方を提供
3. **ユーザーの選択肢**: ユーザーが自分のペースでアプリを理解できる
4. **コンバージョン率の向上**: 複数の導線（直接ログイン、デモ体験後のログイン）を提供することでコンバージョン率が向上

## ハイブリッドアプローチのデメリット

1. **開発工数の増加**: ランディングページとデモモードの両方を実装する必要がある
2. **メンテナンスの複雑さ**: 複数のエントリーポイントを維持する必要がある
3. **ユーザーフローの複雑化**: 複数のパスがあることで、ユーザーフローが複雑になる可能性がある

## 実装手順

1. `components/landing-page.tsx` ファイルを作成し、ランディングページコンポーネントを実装
2. `utils/demo-data.ts` ファイルを作成し、デモデータ関数を実装
3. `components/dashboard.tsx` ファイルを作成し、ダッシュボードコンポーネントを実装（デモモード対応）
4. `app/demo/page.tsx` ファイルを作成し、デモページを実装
5. `app/page.tsx` を修正して、ログイン状態に応じてコンポーネントを切り替え
6. 必要に応じて、ミドルウェアを修正して保護されたルートを設定
7. 必要な画像アセットを準備

## ユーザーフロー

1. **初回訪問**: ユーザーはランディングページを表示
   - 「今すぐ始める」→ ログインページ → ダッシュボード
   - 「デモを見る」→ デモモード → （オプション）ログインページ → ダッシュボード

2. **ログイン済み**: ユーザーは直接ダッシュボードを表示

## 考慮すべき追加事項

- **デモデータの現実性**: 実際のユースケースを反映した現実的なデモデータを用意する
- **デモからログインへの導線**: デモモードからログインへの明確な導線を提供する
- **A/Bテスト**: ランディングページのデザインやCTAボタンの配置などをテストして最適化する
- **アナリティクス**: ユーザーの行動を追跡し、どのパスが最も効果的かを分析する

## 次のステップ

1. ランディングページのデザイン詳細化
2. デモデータの作成
3. コンポーネントの実装
4. ルーティングの設定
5. テストとフィードバック収集