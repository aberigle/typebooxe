import { TObject, TSchema } from "@sinclair/typebox"
import { ValuePointer } from "@sinclair/typebox/value"
import { getModelDefinition } from "../../typebooxe"
import { referenceParts } from "./parts"
import { ReferenceType } from "./schema"

export function resolveDynamicRefs(
  def  : TSchema,
  item : any
): TSchema {
  const parts = referenceParts(def.$id)

  if (parts?.refPath) {
    const name = ValuePointer.Get(item, "/" + parts.refPath)
    if (typeof name === 'string' && parts.names.includes(name)) {
      const modelDef = getModelDefinition(name)
      if (modelDef) return ReferenceType(modelDef as TObject, name)
    }
    return def
  }

  const schema = def as any

  if (def.type === 'object' && schema.properties) {
    const properties: any = {}
    for (const key in schema.properties)
      properties[key] = resolveDynamicRefs(schema.properties[key], item)
    return { ...def, properties } as TSchema
  }

  if (def.type === 'array' && schema.items)
    return { ...def, items: resolveDynamicRefs(schema.items, item) } as TSchema

  return def
}
