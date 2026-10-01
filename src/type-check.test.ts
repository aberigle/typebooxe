import { test, expect } from "bun:test"
import { $ } from "bun"

// Único runner de los tests de tipos: typechequea todos los *.types.test.ts (ver tsconfig.types.json).
test("type-level assertions hold", async () => {
  const result = await $`./node_modules/.bin/tsc -p tsconfig.types.json`.nothrow().quiet()

  expect(result.exitCode).toBe(0)
})
