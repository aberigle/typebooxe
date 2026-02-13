import { TObject, Type } from "@sinclair/typebox";
import { describe, expect, it } from "bun:test";

import { createSchema } from "./schema";
import { typebooxePlugin } from "./typebooxe";
import { TypebooxeOptions } from "./types";


function schema<T extends TObject>(
  def: T,
  options: TypebooxeOptions<T> = {}
) {
  return createSchema<T, []>(def, options)
}

describe('typebooxe', () => {
  describe('schema', () => {
    it('timestamps', () => {
      let def = schema(Type.Object({ test: Type.String() }))

      expect("$timestamps" in def).toBe(false)

      def = schema(Type.Object({ test: Type.String() }), { options: { timestamps: true } })
      expect("$timestamps" in def).toBe(true)
    })

    it('indexes', () => {
      const def = schema(Type.Object({ test: Type.String() }), {
        indexes: [
          {
            index: { test: 1 },
            options: { unique: true }
          }
        ]
      })

      let [result] = def.indexes()
      expect(result[0]).toEqual({ test: 1 })
      expect(result[1]).toMatchObject({ unique: true })
    })

    it('getters', () => {
      const fn = (value: string) => "hola"

      const def = schema(
        Type.Object({
          test: Type.String()
        }), {
        getters: {
          test: fn
        }
      })

      // @ts-ignore TODO fix
      expect(def.obj.test?.get).toBe(fn)
    })

    it('setters', () => {
      const fn = (value: string) => "hola"

      const def = schema(
        Type.Object({
          test: Type.String()
        }), {
        setters: {
          test: fn
        }
      })

      // @ts-ignore TODO fix
      expect(def.obj.test?.set).toBe(fn)
    })

    it('plugins', () => {
      const plugin = typebooxePlugin(Type.Object({
        name: Type.String()
      }))

      const def = schema(
        Type.Object({ test: Type.String() }),
        { plugins: [plugin] })

      expect("name" in def.paths).toBe(true)
      if ("name" in def) expect(def.name).toBe("test")
    })
  })
})