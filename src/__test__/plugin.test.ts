import { Type, type Static } from "@sinclair/typebox";
import { beforeEach, describe, expect, it } from "bun:test";
import mongoose from "mongoose";
import { typebooxe, typebooxePlugin } from "../typebooxe";

function createModel<T>(plugin) {
  const TestType = Type.Object({ test: Type.String() }, { $id: "Test" })
  return typebooxe<
    typeof TestType.static,
    [T]
  >(TestType, {
    plugins : [plugin]
  })
}

describe('typebooxe', () => {
  beforeEach(() => {
    for (let key of Object.keys(mongoose.models)) delete mongoose.models[key]
  })

  describe('plugin', () => {
    it('adds fields', () => {
      const PluginType = Type.Object({ number : Type.Number()})
      const Plugin = typebooxePlugin<Static<typeof PluginType>>(PluginType)

      const TestModel = createModel<typeof PluginType.static>(Plugin)

      const model = new TestModel({ test: "hola", number: 3 })
      expect(model.number).toBe(3)

      const object = model.cast()
      expect(object.number).toBe(3)

    })
  })
})
