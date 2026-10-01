import { Type } from "@sinclair/typebox"
import { typebooxe } from "./typebooxe"
import type { TypebooxeOptions } from "./types"

// Type-level assertions: only tsc (tsconfig.types.json) checks them; never run.
function _options() {
  const Model = typebooxe(Type.Object({
    id  : Type.String(),
    name: Type.String()
  }, { $id: "OptionsModel" }), {
    getters: {
      name: value => value
    },
    setters: {
      name: (value, prior) => value ?? prior ?? ""
    }
  })

  type Options = TypebooxeOptions<typeof Model.$typebooxe>

  const _valid: Options = { getters: { name: value => value } }

  // @ts-expect-error 'nope' no es una clave del schema
  const _badKey: Options = { getters: { nope: value => value } }

  return [_valid, _badKey]
}
