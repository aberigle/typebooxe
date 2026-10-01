import { test, expect } from "bun:test"
import { $ } from "bun"
import { Static, Type } from "@sinclair/typebox"
import { ModelReference } from "./index"
import { typebooxe } from "../../typebooxe"
import { type TypebooxeRaw } from "../../types"

// Type-level assertions: only tsc (tsconfig.types.json) checks them; never run.
function _types() {
  const Post = typebooxe(Type.Object({
    id   : Type.String(),
    title: Type.String()
  }, { $id: "TypePost" }))

  const Product = typebooxe(Type.Object({
    id   : Type.String(),
    price: Type.Number()
  }, { $id: "TypeProduct" }))

  const Comment = typebooxe(Type.Object({
    id     : Type.String(),
    onModel: Type.Union([Type.Literal("TypePost"), Type.Literal("TypeProduct")]),
    on     : ModelReference([Post, Product], { refPath: "onModel" })
  }, { $id: "TypeComment" }))

  type On = TypebooxeRaw<typeof Comment.$typebooxe>["on"]

  const post    = {} as Static<typeof Post.$typebooxe>
  const product = {} as Static<typeof Product.$typebooxe>

  const _post   : On = post
  const _product: On = product
  const _string : On = "670e8b0c500875615df28cac"

  // @ts-expect-error a number is not a valid reference
  const _bad: On = 123

  return [_post, _product, _string, _bad]
}

test("refPath type-level assertions hold", async () => {
  const result = await $`./node_modules/.bin/tsc -p tsconfig.types.json`.nothrow().quiet()

  expect(result.exitCode).toBe(0)
})
