import type { TransactionType } from "@/types/database";
import {
	literal,
	maxValue,
	minValue,
	number,
	object,
	optional,
	parse,
	pipe,
	safeParse,
	string,
	union,
} from "valibot";

// 取引タイプのバリデーションスキーマ
export const transactionTypeSchema = union([
	literal("income"),
	literal("expense"),
]);

// 日付バリデーションスキーマ
export const dayOfMonthSchema = pipe(
	number(),
	minValue(1, "日付は1から31の間で入力してください"),
	maxValue(31, "日付は1から31の間で入力してください"),
);

// 取引作成のバリデーションスキーマ
export const createTransactionSchema = object({
	accountId: string("口座IDは必須です"),
	name: string("名前は必須です"),
	amount: pipe(number(), minValue(0, "金額は正の数値で入力してください")),
	type: transactionTypeSchema,
	dayOfMonth: dayOfMonthSchema,
	description: optional(string()),
});

// 取引更新のバリデーションスキーマ
export const updateTransactionSchema = object({
	name: optional(string("名前を入力してください")),
	amount: optional(
		pipe(number(), minValue(0, "金額は正の数値で入力してください")),
	),
	type: optional(transactionTypeSchema),
	dayOfMonth: optional(dayOfMonthSchema),
	description: optional(string()),
});

// 入力型
export type CreateTransactionInput = {
	accountId: string;
	name: string;
	amount: number;
	type: TransactionType;
	dayOfMonth: number | string;
	description?: string;
};

// 出力型
export type CreateTransactionOutput = {
	accountId: string;
	name: string;
	amount: number;
	type: TransactionType;
	dayOfMonth: number;
	description?: string;
};

// 更新用入力型
export type UpdateTransactionInput = {
	name?: string;
	amount?: number;
	type?: TransactionType;
	dayOfMonth?: number | string;
	description?: string | null;
};

// 更新用出力型
export type UpdateTransactionOutput = {
	name?: string;
	amount?: number;
	type?: TransactionType;
	dayOfMonth?: number;
	description?: string;
};

// 入力をバリデーション
export function validateCreateTransaction(
	input: CreateTransactionInput,
): CreateTransactionOutput {
	// 日付が文字列の場合は数値に変換
	const sanitizedInput = {
		...input,
		dayOfMonth:
			typeof input.dayOfMonth === "string"
				? Number.parseInt(input.dayOfMonth, 10)
				: input.dayOfMonth,
	};

	// バリデーション実行
	return parse(createTransactionSchema, sanitizedInput);
}

// 更新データのバリデーション
export function validateUpdateTransaction(
	input: UpdateTransactionInput,
): UpdateTransactionOutput {
	// 日付が文字列の場合は数値に変換
	const sanitizedInput = { ...input };
	if (
		typeof input.dayOfMonth !== "undefined" &&
		typeof input.dayOfMonth === "string"
	) {
		sanitizedInput.dayOfMonth = Number.parseInt(input.dayOfMonth, 10);
	}

	// nullを削除（valibotはnullを許容しないため）
	if (sanitizedInput.description === null) {
		sanitizedInput.description = undefined;
	}

	// バリデーション実行
	return parse(updateTransactionSchema, sanitizedInput);
}

// 安全なバリデーション（エラーをthrowせず結果を返す）
export function safeValidateCreateTransaction(input: CreateTransactionInput) {
	// 日付が文字列の場合は数値に変換
	const sanitizedInput = {
		...input,
		dayOfMonth:
			typeof input.dayOfMonth === "string"
				? Number.parseInt(input.dayOfMonth, 10)
				: input.dayOfMonth,
	};

	return safeParse(createTransactionSchema, sanitizedInput);
}

export function safeValidateUpdateTransaction(input: UpdateTransactionInput) {
	// 日付が文字列の場合は数値に変換
	const sanitizedInput = { ...input };
	if (
		typeof input.dayOfMonth !== "undefined" &&
		typeof input.dayOfMonth === "string"
	) {
		sanitizedInput.dayOfMonth = Number.parseInt(input.dayOfMonth, 10);
	}

	// nullを削除（valibotはnullを許容しないため）
	if (sanitizedInput.description === null) {
		sanitizedInput.description = undefined;
	}

	return safeParse(updateTransactionSchema, sanitizedInput);
}
