import { TObject, Type } from "@sinclair/typebox";
import { TypebooxeModel } from "./types";

export function TypebooxeRef<T extends TObject>(
  model : TypebooxeModel<T>
) {
  if (!("$typebooxe" in model)) throw new Error('Only can reference TypebooxeModel')

  const object : T = model.$typebooxe

  return Type.Intersect([Type.Optional(Type.Partial(object)), Type.Pick(object, ["id"])], {
    $id : "ref@" + object.$id
  })
}