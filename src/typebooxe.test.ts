import { Type } from "@sinclair/typebox";
import { beforeEach, describe, expect, it } from "bun:test";
import mongoose from "mongoose";
import { typebooxe } from "./typebooxe";

describe('typebooxe', () => {
  describe('model', () => {
    beforeEach(() => {
      for (let key of Object.keys(mongoose.models)) delete mongoose.models[key]
    })

    it('creates a model', async () => {
      const TestType = Type.Object({ test: Type.String() }, { $id: "Test" })
      const TestModel = typebooxe(TestType)

      let item = new TestModel({ test: "hola" })
      expect(item.test).toBe("hola")
    })

    it('casts the type', async () => {
      const TestType = Type.Object({ test: Type.String(), date: Type.Date() }, { $id: "Test" })
      const TestModel = typebooxe(TestType)

      let item = new TestModel({ test: "hola", date : new Date("2024-01-01") })
      expect(item.test).toBe("hola")

      const object = item.cast()
      expect(object.date instanceof Date).toBe(true)

      // @ts-ignore
      expect(object._id).toBeUndefined()
    })

    it('maintains the id', async () => {
      const TestType = Type.Object({ id : Type.String()}, { $id: "Test" })

      const TestModel = typebooxe(TestType)
      let item = new TestModel({})

      const object = item.cast()
      expect(object.id).toBe(item._id.toHexString())
    })

    it('handles ref objectids', async () => {
      const JobType    = Type.Object({ name: Type.String() }, { $id: 'Job' })
      const PersonType = Type.Object({
        name: Type.String(),
        job: Type.Ref(JobType)
      }, { $id: "Person" })

      const JobModel    = typebooxe(JobType)
      const PersonModel = typebooxe(PersonType)

      let job    = new JobModel({ name: 'developer' })
      let person = new PersonModel({ name: 'aberigle' })

      person.job = job

      let result = person.cast()
      expect(result.job).toMatchObject({ name: 'developer' })

      // @ts-ignore
      person.job = job._id

      result = person.cast()
      expect(result.job).toBeUndefined()
    })

    it('casts union with ref to string when not populated', async () => {
      const JobType    = Type.Object({ name: Type.String() }, { $id: 'Job' })
      const PersonType = Type.Object({
        name : Type.String(),
        job  : Type.Union([Type.Ref(JobType), Type.String()])
      }, { $id: "Person" })

      const JobModel    = typebooxe(JobType)
      const PersonModel = typebooxe(PersonType)

      let job    = new JobModel({ name: 'developer' })
      let person = new PersonModel({ name: 'aberigle' })

      person.job = job

      let result = person.cast()
      expect(result.job).toMatchObject({ name: 'developer' })

      // @ts-ignore
      person.job = job._id

      result = person.cast()
      expect(result.job).toBe(job._id.toHexString())
    })

  })
})

