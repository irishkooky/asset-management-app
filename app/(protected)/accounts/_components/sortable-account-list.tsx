"use client";

import { Button } from "@/components/button";
import type { Account } from "@/types/database";
import {
	DndContext,
	KeyboardSensor,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { useEffect, useState } from "react";
import { updateAccountOrderAction } from "../actions";

// ドラッグ可能な口座アイテム
interface SortableAccountItemProps {
	account: Account;
	isSorting: boolean;
}

function SortableAccountItem({ account, isSorting }: SortableAccountItemProps) {
	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({ id: account.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...(isSorting ? { ...attributes, ...listeners } : {})}
			className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${isSorting ? "cursor-move" : ""}`}
		>
			<div className="flex justify-between items-start mb-4">
				<h2 className="text-xl font-semibold">{account.name}</h2>
				{!isSorting && (
					<div className="flex space-x-2">
						<Button variant="outline" size="sm" asChild>
							<Link href={`/accounts/${account.id}`}>詳細</Link>
						</Button>
						<Button variant="outline" size="sm" asChild>
							<Link href={`/accounts/${account.id}/edit`}>編集</Link>
						</Button>
					</div>
				)}
			</div>
			<p className="text-2xl font-bold mb-2">
				¥{account.current_balance.toLocaleString()}
			</p>
			<p className="text-sm text-gray-500">
				最終更新: {new Date(account.updated_at).toLocaleDateString()}
			</p>
		</div>
	);
}

// 口座リスト
interface SortableAccountListProps {
	initialAccounts: Account[];
}

export default function SortableAccountList({
	initialAccounts,
}: SortableAccountListProps) {
	const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
	const [isSorting, setIsSorting] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		setAccounts(initialAccounts);
	}, [initialAccounts]);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleDragEnd = (event: DragEndEvent): void => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			setAccounts((items) => {
				const oldIndex = items.findIndex((item) => item.id === active.id);
				const newIndex = items.findIndex((item) => item.id === over.id);

				return arrayMove(items, oldIndex, newIndex);
			});
		}
	};

	const saveSortOrder = async (): Promise<void> => {
		setIsSubmitting(true);
		try {
			// 並び順を保存
			for (let i = 0; i < accounts.length; i++) {
				const result = await updateAccountOrderAction(accounts[i].id, i);
				if (result.error) {
					throw new Error(result.error);
				}
			}
			setIsSorting(false);
			alert("並び順を保存しました");
		} catch (error) {
			console.error("並び順の保存に失敗しました:", error);
			alert("並び順の保存に失敗しました");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				{isSorting ? (
					<div className="space-x-2">
						<Button
							onClick={saveSortOrder}
							disabled={isSubmitting}
							variant="default"
						>
							{isSubmitting ? "保存中..." : "並び順を保存"}
						</Button>
						<Button
							onClick={() => {
								setIsSorting(false);
								setAccounts(initialAccounts);
							}}
							variant="outline"
							disabled={isSubmitting}
						>
							キャンセル
						</Button>
					</div>
				) : (
					<Button onClick={() => setIsSorting(true)} variant="outline">
						並び替え
					</Button>
				)}
			</div>

			{accounts.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{isSorting ? (
						<DndContext
							sensors={sensors}
							collisionDetection={closestCenter}
							onDragEnd={handleDragEnd}
						>
							<SortableContext
								items={accounts.map((account) => account.id)}
								strategy={verticalListSortingStrategy}
							>
								{accounts.map((account) => (
									<SortableAccountItem
										key={account.id}
										account={account}
										isSorting={true}
									/>
								))}
							</SortableContext>
						</DndContext>
					) : (
						accounts.map((account) => (
							<SortableAccountItem
								key={account.id}
								account={account}
								isSorting={false}
							/>
						))
					)}
				</div>
			) : (
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
					<p className="text-lg mb-4">口座がまだ登録されていません</p>
					<Button asChild>
						<Link href="/accounts/new">最初の口座を追加する</Link>
					</Button>
				</div>
			)}
		</div>
	);
}
