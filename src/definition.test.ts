
import { Type } from "@sinclair/typebox";
import { describe, expect, test } from "bun:test";
import { Schema } from "mongoose";
import { createDefinition } from "./definition";

function definition(def: any, options = {}) {
  return createDefinition(Type.Object(def, options))
}

describe('typebooxe', () => {
  describe('definition', () => {
    test("strings", () => {
      const def = definition({
        test: Type.String()
      })

      expect(def.test).toMatchObject({ type: String })
    })

    test("number", () => {
      const def = definition({
        number: Type.Number(),
        integer: Type.Integer()
      })

      expect(def.number).toMatchObject({ type: Number })
      expect(def.integer).toMatchObject({ type: Number })
    })

    test("boolean", () => {
      const def = definition({ test: Type.Boolean() })
      expect(def.test).toMatchObject({ type: Boolean })
    })

    test("dates", () => {
      const def = definition({ test: Type.Date() })
      expect(def.test).toMatchObject({ type: Date })
    })

    test("optionals", () => {
      const def = definition({
        mandatory: Type.String(),
        optional: Type.Optional(Type.String())
      })
      expect(def.mandatory).toMatchObject({ type: String, required: true })
      expect(def.optional).toMatchObject({ type: String, required: false })
    })

    test("defaults", () => {
      const def = definition({
        flag: Type.Boolean({ default: false }),
        text: Type.String({ default: "hello" }),
        number: Type.Number({ default: 27 })
      })

      expect(def.flag).toMatchObject({ type: Boolean, default: false })
      expect(def.text).toMatchObject({ type: String, default: "hello" })
      expect(def.number).toMatchObject({ type: Number, default: 27 })
    })

    test("any (Mixed)", () => {
      const def = definition({
        test: Type.Any()
      })

      expect(def.test).toMatchObject({ type: Schema.Types.Mixed })
    })


    test("enums", () => {
      enum TestEnum {
        ONE = "ONE",
        TWO = "TWO"
      }

      const def = definition({
        field: Type.Enum(TestEnum)
      })

      expect(def.field).toMatchObject({
        type: String, enum: ["ONE", "TWO"]
      })

    })

    test("objects", () => {
      const def = definition({
        test: Type.Object({
          field: Type.String()
        })
      })

      expect(def.test.required).toBeTrue()
      expect(def.test.type.obj).toMatchObject({
        field: {
          type: String,
          required: true
        }
      })
    })

    test("optional objects", () => {
      const def = definition({
        test: Type.Optional(
          Type.Object({
            field: Type.String()
          }))
      })

      expect(def.test.required).toBeFalse()
    })

    test("arrays", () => {
      const def = definition({
        text: Type.Array(Type.String()),
        objects: Type.Array(
          Type.Object({
            test: Type.String()
          })
        )
      })

      expect(def.text.type).toMatchObject([{ type: String }])
      expect(def.objects.type).toBeArray()
      expect(def.objects.type[0].type.obj).toMatchObject({ test: { type: String } })
    })

    test("recursive this ref", () => {
      const Person = Type.Recursive(This =>
        Type.Object({
          name: Type.String(),
          parent: Type.Optional(This)
        }), { $id: "Person" }
      )
      const def = createDefinition(Person)

      expect(def.parent).toMatchObject({ type: Schema.Types.ObjectId, ref: Person.$id })
      expect(Person.$id).toBe("Person")
    })

    test("recursive this ref array", () => {
      const Person = Type.Recursive(This =>
        Type.Object({
          name: Type.String(),
          children: Type.Array(This)
        }), { $id: "Person" }
      )
      const def = createDefinition(Person)

      expect(def.children.type).toMatchObject([{ type: Schema.Types.ObjectId, ref: Person.$id }])
    })


  })

})