
import { Type } from "@sinclair/typebox";
import { describe, expect, it } from "bun:test";
import { Schema } from "mongoose";
import { createDefinition } from "../definition";

function definition(def: any, options = {}) {
  return createDefinition(Type.Object(def, options))
}

describe('typeboose', () => {
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
  })

})