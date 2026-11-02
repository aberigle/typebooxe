import { Type } from "@sinclair/typebox";
import { beforeEach, describe, expect, it } from "bun:test";
import mongoose from "mongoose";
import { ModelReference } from "./fields/reference";
import { typebooxe } from "./typebooxe";

describe('typebooxe', () => {
  describe('union', () => {
    beforeEach(() => {
      for (let key of Object.keys(mongoose.models)) delete mongoose.models[key]
    })

    it('stores a union of objects as Mixed', async () => {
      const LeftType  = Type.Object({ kind: Type.Literal("left"), value: Type.String() })
      const RightType = Type.Object({ kind: Type.Literal("right"), value: Type.String() })

      const TestType = Type.Object({
        items: Type.Array(Type.Union([LeftType, RightType]))
      }, { $id: "Test" })
      const TestModel = typebooxe(TestType)

      const item = new TestModel({
        items: [
          { kind: "left", value: "one" },
          { kind: "right", value: "two" }
        ]
      })

      await expect(item.validate()).resolves.toBeUndefined()
      expect(item.cast().items).toEqual([
        { kind: "left", value: "one" },
        { kind: "right", value: "two" }
      ])
    })

    it('stores a union of literals as a string enum', async () => {
      const TestType = Type.Object({
        test: Type.Union([Type.Literal("a"), Type.Literal("b")])
      }, { $id: "Test" })
      const TestModel = typebooxe(TestType)

      const item = new TestModel({ test: "a" })
      await expect(item.validate()).resolves.toBeUndefined()
      expect(item.cast().test).toBe("a")

      await expect(new TestModel({ test: "c" }).validate()).rejects.toThrow()
    })

    it('resolves a ref inside a union', async () => {
      const JobType  = Type.Object({ id: Type.String(), name: Type.String() }, { $id: "Job" })
      const JobModel = typebooxe(JobType)

      const PersonType = Type.Object({
        name: Type.String(),
        job : Type.Union([ModelReference(JobModel), Type.Null()])
      }, { $id: "Person" })
      const PersonModel = typebooxe(PersonType)

      const job    = new JobModel({ name: "developer" })
      const person = new PersonModel({ name: "aberigle", job: job._id })

      await expect(person.validate()).resolves.toBeUndefined()
      expect(person.cast().job).toEqual({ id: job._id.toHexString() })
    })
  })
})
