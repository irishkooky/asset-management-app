import {
	custom,
	date,
	literal,
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
import type { TransactionType } from "@/types/database";

// 取引タイプのバリデーションスキーマ
export const transactionTypeSchema = union([
	literal("income"),
	literal("expense"),
]);

// 一時的取引作成のバリデーションスキーマ
export const createOneTimeTransactionSchema = object({
	accountId: string("口座IDは必須です"),
	name: string("名前は必須です"),
	amount: pipe(number(), minValue(0, "金額は正の数値で入力してください")),
	type: transactionTypeSchema,
	transactionDate: date("有効な日付を入力してください"),
	description: optional(string()),
});

// 一時的送金作成のバリデーションスキーマ
export const createOneTimeTransferSchema = pipe(
	object({
		sourceAccountId: string("送金元口座IDは必須です"),
		destinationAccountId: string("送金先口座IDは必須です"),
		name: string("名前は必須です"),
		amount: pipe(number(), minValue(0, "金額は正の数値で入力してください")),
		transactionDate: date("有効な日付を入力してください"),
		description: optional(string()),
	}),
	custom((input) => {
		// 送金元と送金先が異なることを確認
		const data = input as {
			sourceAccountId: string;
			destinationAccountId: string;
		};
		return data.sourceAccountId !== data.destinationAccountId;
	}, "送金元と送金先は異なる口座である必要があります"),
);

// 一時的取引用入力型
export type CreateOneTimeTransactionInput = {
	accountId: string;
	name: string;
	amount: number;
	type: TransactionType;
	transactionDate: Date;
	description?: string;
};

// 一時的取引用出力型
export type CreateOneTimeTransactionOutput = {
	accountId: string;
	name: string;
	amount: number;
	type: TransactionType;
	transactionDate: Date;
	description?: string;
};

// 一時的送金用入力型
export type CreateOneTimeTransferInput = {
	sourceAccountId: string;
	destinationAccountId: string;
	name: string;
	amount: number;
	transactionDate: Date;
	description?: string;
};

// 一時的送金用出力型
export type CreateOneTimeTransferOutput = {
	sourceAccountId: string;
	destinationAccountId: string;
	name: string;
	amount: number;
	transactionDate: Date;
	description?: string;
};

// 一時的取引のバリデーション
export function validateCreateOneTimeTransaction(
	input: CreateOneTimeTransactionInput,
): CreateOneTimeTransactionOutput {
	return parse(createOneTimeTransactionSchema, input);
}

// 一時的送金のバリデーション
export function validateCreateOneTimeTransfer(
	input: CreateOneTimeTransferInput,
): CreateOneTimeTransferOutput {
	return parse(createOneTimeTransferSchema, input);
}

// 安全な一時的取引のバリデーション
export function safeValidateCreateOneTimeTransaction(
	input: CreateOneTimeTransactionInput,
) {
	return safeParse(createOneTimeTransactionSchema, input);
}

// 安全な一時的送金のバリデーション
export function safeValidateCreateOneTimeTransfer(
	input: CreateOneTimeTransferInput,
) {
	return safeParse(createOneTimeTransferSchema, input);
}
