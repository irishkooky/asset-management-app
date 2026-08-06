import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@/app": path.resolve(__dirname, "app"),
			"@/lib": path.resolve(__dirname, "lib"),
			"@/components": path.resolve(__dirname, "components"),
			"@/styles": path.resolve(__dirname, "styles"),
			"@/utils": path.resolve(__dirname, "utils"),
			"@/types": path.resolve(__dirname, "types"),
		},
	},
	test: {
		environment: "jsdom",
		globals: true,
		include: ["**/*.test.{ts,tsx}"],
	},
});
