
import { Type } from "@sinclair/typebox";
import { describe, expect, it } from "bun:test";
import { Schema } from "mongoose";
import { createDefinition } from "../definition";

function definition(def: any, options = {}) {
  return createDefinition(Type.Object(def, options))
}

describe('typebooxe', () => {
  describe('definition', () => {
    it("strings", () => {
      const def = definition({
        test: Type.String()
      })

      expect(def.test).toMatchObject({ type: String })
    })

    it("number", () => {
      const def = definition({
        number : Type.Number(),
        integer : Type.Integer()
      })

      expect(def.number).toMatchObject({ type: Number })
      expect(def.integer).toMatchObject({ type: Number })
    })

    it("boolean", () => {
      const def = definition({ test : Type.Boolean() })
      expect(def.test).toMatchObject({ type: Boolean })
    })

    it("dates", () => {
      const def = definition({ test : Type.Date() })
      expect(def.test).toMatchObject({ type: Date })
    })

    it("optionals", () => {
      const def = definition({
        mandatory : Type.String(),
        optional: Type.Optional(Type.String())
      })
      expect(def.mandatory).toMatchObject({ type : String, required:true })
      expect(def.optional).toMatchObject({ type: String, required: false })
    })

    it("defaults", () => {
      const def = definition({
        flag   : Type.Boolean({ default: false }),
        text   : Type.String({ default: "hello" }),
        number : Type.Number({ default: 27 })
      })

      expect(def.flag).toMatchObject({ type: Boolean, default: false })
      expect(def.text).toMatchObject({ type : String, default : "hello" })
      expect(def.number).toMatchObject({ type : Number, default : 27 })
    })

    it("any (Mixed)",  () => {
      const def = definition({
        test : Type.Any()
      })

      expect(def.test).toMatchObject({ type: Schema.Types.Mixed })
    })

    it("refs",  () => {
      const tReferenced = Type.Object({ test: Type.String() }, { $id: "Referenced" })
      const def = definition({
        reference: Type.Optional(Type.Ref(tReferenced)),
      },{
        references : [tReferenced]
      })

      expect(def.reference).toMatchObject({ type: Schema.Types.ObjectId, ref : 'Referenced' })
    })

    it("enums", () => {
      enum TestEnum {
        ONE = "ONE",
        TWO = "TWO"
      }

      const def = definition({
        field : Type.Enum(TestEnum)
      })

      expect(def.field).toMatchObject({
        type : String, enum : ["ONE", "TWO"]
      })

    })

    it("objects", () => {
      const def = definition({
        test : Type.Object({
          field : Type.String()
        })
      })

      expect(def.test).toStrictEqual({
        field: { type: String, required : true }
      })
    })

    it("arrays", () => {
      const def = definition({
        text : Type.Array(Type.String()),
        objects : Type.Array(Type.Object({
          test  : Type.String()
        }))
      })

      expect(def.text).toMatchObject([{ type : String }])
      expect(def.objects).toMatchObject([{ test: { type: String } }])
    })

    it("not populated refs", () => {
      const tReferenced = Type.Object({ test: Type.String() }, { $id: "Referenced" })
      const def = definition({
        reference: Type.Union([Type.Ref(tReferenced), Type.String()]),
      },{
        references : [tReferenced]
      })

      expect(def.reference).toMatchObject({ type: Schema.Types.ObjectId, ref : 'Referenced' })
    })
  })

})