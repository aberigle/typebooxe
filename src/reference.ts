import { TObject, Type } from "@sinclair/typebox";
import { TypebooxeModel } from "./types";

export function TypebooxeRef<T extends TObject>(
  model : TypebooxeModel<T>
) {
  if (!("$typebooxe" in model)) throw new Error('Only can reference TypebooxeModel')

  const object : T = model.$typebooxe

  return Type.Partial(object, {
    $id : "ref@" + object.$id
  })
}