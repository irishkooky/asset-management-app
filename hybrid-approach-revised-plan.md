# 資産管理アプリ ハイブリッドアプローチ修正計画

## 重要な前提条件

- ヘッダーのログインボタンは直接Googleの認証ページに遷移する（`signInWithGoogleAction`を使用）
- 専用の`/sign-in`ページは存在しない

## 修正後のハイブリッドアプローチの概要

ハイブリッドアプローチは、ランディングページとデモモードの利点を組み合わせたアプローチです。ログインしていないユーザーには魅力的なランディングページを表示しつつ、「デモを見る」ボタンを設置し、ユーザーが実際のアプリ機能を体験できるデモモードを提供します。ログインは全てヘッダーのボタンから直接Googleの認証ページに遷移します。

## 実装計画

### 1. ルート構造の設計

```
/                  # ランディングページ（未ログイン時）またはダッシュボード（ログイン時）
/demo              # デモモード（未ログイン時でもダッシュボードを表示）
/dashboard         # ダッシュボード（ログイン必須）
```

### 2. ログインアクションの共通化

```typescript
// components/login-button.tsx
import { signInWithGoogleAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

interface LoginButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
}

export default function LoginButton({
  variant = "default",
  size = "default",
  className = "",
  children = "ログイン"
}: LoginButtonProps) {
  return (
    <form action={signInWithGoogleAction}>
      <Button 
        type="submit" 
        variant={variant} 
        size={size} 
        className={`flex items-center gap-2 ${className}`}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
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
        {children}
      </Button>
    </form>
  );
}
```

### 3. ランディングページコンポーネントの作成

```typescript
// components/landing-page.tsx
import LoginButton from "@/components/login-button";
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
            <LoginButton size="lg">今すぐ始める</LoginButton>
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
          <LoginButton size="lg">無料で始める</LoginButton>
          <Button variant="outline" size="lg" asChild>
            <Link href="/demo">デモを試す</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
```

### 4. デモデータの作成

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

### 5. ダッシュボードコンポーネントの作成

```typescript
// components/dashboard.tsx
import LoginButton from "@/components/login-button";
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
              <LoginButton size="sm" className="whitespace-nowrap">ログインする</LoginButton>
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

### 6. ルーティングの実装

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

### 7. ミドルウェアの修正

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
    // sign-inページではなく、トップページにリダイレクト
    return NextResponse.redirect(new URL('/', request.url));
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

### 8. ヘッダーの認証部分の修正（既に実装済み）

```typescript
// components/header-auth.tsx
import { signInWithGoogleAction, signOutAction } from "@/app/actions";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export default async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!hasEnvVars) {
    return (
      <>
        <div className="flex gap-4 items-center">
          <div>
            <Badge
              variant={"default"}
              className="font-normal pointer-events-none"
            >
              .env.localファイルを更新してください
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              asChild
              size="sm"
              variant={"outline"}
              disabled
              className="opacity-75 cursor-none pointer-events-none"
            >
              <Link href="/sign-in">ログイン</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }
  return user ? (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium hidden sm:inline-block">
        こんにちは、{user.email?.split("@")[0]}さん
      </span>
      <form action={signOutAction}>
        <Button type="submit" variant={"outline"} size="sm">
          ログアウト
        </Button>
      </form>
    </div>
  ) : (
    <div className="flex gap-2">
      <form action={signInWithGoogleAction}>
        <Button type="submit" size="sm" variant={"outline"} className="flex items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
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
          ログイン
        </Button>
      </form>
    </div>
  );
}
```

## ハイブリッドアプローチの修正点

1. **ログインフローの簡素化**:
   - `/sign-in`ページを使用せず、全てのログインボタンから直接Google認証に遷移
   - 共通の`LoginButton`コンポーネントを作成して再利用

2. **ユーザーフローの変更**:
   - 初回訪問: ランディングページ → 直接Google認証 → ダッシュボード
   - または: ランディングページ → デモモード → 直接Google認証 → ダッシュボード

3. **リダイレクト先の変更**:
   - 保護されたルートへの未認証アクセスは`/sign-in`ではなく`/`（トップページ）にリダイレクト

## ハイブリッドアプローチのメリット（修正後）

1. **シンプルな認証フロー**: ログインボタンから直接Google認証に遷移するため、ステップが減少
2. **一貫したユーザー体験**: 全てのログインボタンが同じ動作をする
3. **マーケティングと機能体験の両立**: ランディングページでアプリの価値を伝えつつ、デモモードで実際の機能を体験できる

## 実装手順

1. `components/login-button.tsx` ファイルを作成し、共通のログインボタンコンポーネントを実装
2. `components/landing-page.tsx` ファイルを作成し、ランディングページコンポーネントを実装
3. `utils/demo-data.ts` ファイルを作成し、デモデータ関数を実装
4. `components/dashboard.tsx` ファイルを作成し、ダッシュボードコンポーネントを実装
5. `app/demo/page.tsx` ファイルを作成し、デモページを実装
6. `app/page.tsx` を修正して、ログイン状態に応じてコンポーネントを切り替え
7. 必要に応じて、ミドルウェアを修正して保護されたルートを設定

## 次のステップ

1. ランディングページのデザイン詳細化
2. デモデータの作成
3. コンポーネントの実装
4. ルーティングの設定
5. テストとフィードバック収集