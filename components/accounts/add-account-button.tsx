"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AccountFormData } from "@/types";
import { createClient } from "@/utils/supabase/client";
import {
	Button,
	Card,
	Modal,
	ModalBody,
	ModalContent,
	ModalHeader,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AddAccountButton() {
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			const formData = new FormData(e.currentTarget);
			const data: AccountFormData = {
				name: formData.get("name") as string,
				balance: Number.parseFloat(formData.get("balance") as string),
			};

			const supabase = createClient();
			const { error: supabaseError } = await supabase
				.from("accounts")
				.insert([data]);

			if (supabaseError) {
				throw supabaseError;
			}

			setIsOpen(false);
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : "口座の作成に失敗しました");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<Button onClick={() => setIsOpen(true)}>口座を追加</Button>
			<Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
				<ModalContent>
					<Card>
						<ModalHeader>新規口座の追加</ModalHeader>
						<ModalBody>
							<form onSubmit={handleSubmit} className="space-y-4">
								{error && (
									<div className="text-sm text-rose-500 bg-rose-50 p-2 rounded">
										{error}
									</div>
								)}
								<div>
									<Label htmlFor="name">口座名</Label>
									<Input
										id="name"
										name="name"
										required
										placeholder="例：メイン口座"
										className="mt-1"
									/>
								</div>
								<div>
									<Label htmlFor="balance">現在残高</Label>
									<Input
										id="balance"
										name="balance"
										type="number"
										required
										placeholder="0"
										className="mt-1"
									/>
								</div>
								<Button type="submit" disabled={isLoading} className="w-full">
									{isLoading ? "作成中..." : "作成"}
								</Button>
							</form>
						</ModalBody>
					</Card>
				</ModalContent>
			</Modal>
		</>
	);
}
