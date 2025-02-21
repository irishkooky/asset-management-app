-- 口座テーブルの作成
create table public.accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  balance decimal not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLSポリシーの設定
alter table public.accounts enable row level security;

create policy "Users can view their own accounts"
  on accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own accounts"
  on accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own accounts"
  on accounts for update
  using (auth.uid() = user_id);

-- 取引テーブルの作成
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  account_id uuid references public.accounts(id) not null,
  date date not null,
  amount decimal not null,
  description text not null,
  type text not null check (type in ('regular', 'temporary')),
  transaction_type text not null check (transaction_type in ('income', 'expense')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLSポリシーの設定
alter table public.transactions enable row level security;

create policy "Users can view their own transactions"
  on transactions for select
  using (
    exists (
      select 1 from public.accounts
      where accounts.id = transactions.account_id
      and accounts.user_id = auth.uid()
    )
  );

create policy "Users can insert their own transactions"
  on transactions for insert
  with check (
    exists (
      select 1 from public.accounts
      where accounts.id = transactions.account_id
      and accounts.user_id = auth.uid()
    )
  );

-- インデックスの作成
create index accounts_user_id_idx on accounts(user_id);
create index transactions_account_id_idx on transactions(account_id);
create index transactions_date_idx on transactions(date);