import { Type } from "@sinclair/typebox"
import { Types } from "mongoose"
import { ModelReference } from "./fields/reference"
import { typebooxe } from "./typebooxe"
import type { TypebooxeRaw } from "./types"

// Type-level assertions: only tsc (tsconfig.types.json) checks them; never run.
function _variance() {
  const Post = typebooxe(Type.Object({
    id   : Type.String(),
    title: Type.String()
  }, { $id: "VariancePost" }))

  const Comment = typebooxe(Type.Object({
    id: Type.String(),
    on: ModelReference(Post)
  }, { $id: "VarianceComment" }))

  type On = TypebooxeRaw<typeof Comment.$typebooxe>["on"]

  const post = new Post({ title: "hello" })
  const oid  = new Types.ObjectId()

  const _fromDocument: On = post
  const _fromObjectId: On = oid
  const _fromString  : On = "670e8b0c500875615df28cac"

  // @ts-expect-error un number no es una referencia válida
  const _bad: On = 123

  return [_fromDocument, _fromObjectId, _fromString, _bad]
}
