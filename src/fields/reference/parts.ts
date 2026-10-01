// The reference is encoded in the field's `$id`, the only channel that survives
// Type.Optional() and reaches both definition.ts and cast-type.ts.
//
//   ref@Job                      -> single reference
//   ref@Post|Product#refPath=... -> dynamic reference (refPath)

export const REF_PATH_MARK = "#refPath="

export function referenceParts(id?: string) {
  if (!id?.startsWith("ref@")) return undefined

  const [head, ...rest] = id.slice(4).split(REF_PATH_MARK)

  return {
    names  : head.split("|").filter(Boolean),
    refPath: rest.length ? rest.join(REF_PATH_MARK) : undefined
  }
}
