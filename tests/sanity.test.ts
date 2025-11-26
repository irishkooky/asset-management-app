import { describe, expect, it } from "vitest";

/**
 * CI で `pnpm test` を実行した際に
 * 「No test files found」エラーで落ちないようにするための
 * 最小限のサニティテスト。
 *
 * 実際のユニットテストが追加されたら、このファイルは削除して構いません。
 */
describe("sanity test", () => {
	it("ensures vitest can run at least one spec", () => {
		expect(true).toBe(true);
	});
});

