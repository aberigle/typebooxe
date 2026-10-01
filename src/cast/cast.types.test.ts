import { Type } from "@sinclair/typebox"
import { typebooxe } from "../typebooxe"

// Type-level assertions: only tsc (tsconfig.types.json) checks them; never run.
function _cast() {
  const Doc = typebooxe(Type.Object({
    id  : Type.String(),
    name: Type.String()
  }, { $id: "CastDoc" }))

  // Crear sin id explícito: mongo lo genera.
  const doc = new Doc({ name: "x" })

  const plain = doc.cast()
  const _name: string = plain.name
  const _id  : string = plain.id

  const shaped = doc.cast(Type.Object({ name: Type.String() }))
  const _shapedName: string = shaped.name
  // @ts-expect-error el tipo público no declara id
  const _shapedId: string = shaped.id

  return [_name, _id, _shapedName, _shapedId]
}
