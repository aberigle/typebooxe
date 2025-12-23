import { Type } from "@sinclair/typebox";
import { beforeEach, describe, expect, it } from "bun:test";
import mongoose from "mongoose";
import { typebooxe, typebooxePlugin } from "./typebooxe";

describe('typebooxe', () => {
  beforeEach(() => {
    for (let key of Object.keys(mongoose.models)) delete mongoose.models[key]
  })

  describe('plugin', () => {
    it('adds fields', () => {
      const Plugin  = typebooxePlugin(Type.Object({ number: Type.Number() }))
      const Plugin2 = typebooxePlugin(Type.Object({ date: Type.Date() }))

      const TestModel = typebooxe(Type.Object({
        test: Type.String()
      }, { $id: "Test" }), {
        plugins: [Plugin, Plugin2]
      })

      const model = new TestModel({ test: "hola", number: 3, date: new Date })
      expect(model.number).toBe(3)

      const object = model.cast()
      expect(object.number).toBe(3)
    })
  })
})
