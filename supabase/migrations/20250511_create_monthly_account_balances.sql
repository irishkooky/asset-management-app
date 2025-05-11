-- 月初残高テーブルの作成
create table if not exists public.monthly_account_balances (
  id uuid not null default uuid_generate_v4() primary key,
  account_id uuid not null references public.accounts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  year int2 not null,
  month int2 not null,
  balance numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- 同じアカウント、同じ年月の組み合わせはユニークにする
  unique(account_id, year, month)
);

-- セキュリティ設定
alter table public.monthly_account_balances enable row level security;

-- RLSポリシー
create policy "Users can view their own monthly_account_balances"
  on public.monthly_account_balances
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own monthly_account_balances"
  on public.monthly_account_balances
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own monthly_account_balances"
  on public.monthly_account_balances
  for update
  using (auth.uid() = user_id);

create policy "Users can delete their own monthly_account_balances"
  on public.monthly_account_balances
  for delete
  using (auth.uid() = user_id);
