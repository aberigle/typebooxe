import { Type } from "@sinclair/typebox";
import { beforeEach, describe, expect, it } from "bun:test";
import mongoose from "mongoose";
import { modelsCache, typebooxe } from "../typebooxe";
import { ModelReference } from "./reference";

describe('typebooxe', () => {
  describe('types', () => {
    beforeEach(() => {
      for (let key of Object.keys(mongoose.models)) delete mongoose.models[key]
      const cache = modelsCache()
      for (let key of Object.keys(cache)) delete cache[key]
    })

    it('handles ref objectids', async () => {
      const JobModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String()
      }, { $id: 'Job' }))

      const PersonModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        job: ModelReference(JobModel)
      }, { $id: "Person" }))

      let job = new JobModel({ name: 'developer' })
      let person = new PersonModel({ name: 'aberigle' })

      person.job = job
      let result = person.cast()

      expect(result.job).toMatchObject({ name: 'developer' })

      person.job = job.id
      result = person.cast()

      expect(result.job).toMatchObject({ id: job.id })
    })

    it('casts ref to string when not populated', async () => {

      const JobModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String()
      }, { $id: 'Job' }))

      const PersonModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        job: ModelReference(JobModel)
      }, { $id: "Person" }))

      let job = new JobModel({ name: 'developer' })
      let person = new PersonModel({ name: 'aberigle' })

      person.job = job

      let result = person.cast()
      expect(result.job).toMatchObject({ name: 'developer' })

      // @ts-ignore
      person.job = job._id

      result = person.cast()
      expect(result.job?.id).toBe(job._id.toHexString())
    })

    it('casts only defined fields', async () => {
      const JobModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String()
      }, { $id: 'Job' }))

      const PersonModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        job: ModelReference(JobModel)
      }, { $id: "Person" }))

      let job = new JobModel({ name: 'developer' })
      let person = new PersonModel({ name: 'aberigle' })

      person.job = job

      const PublicType = Type.Intersect([
        Type.Omit(PersonModel.$typebooxe, ["job"]),
        Type.Object({ job: Type.Pick(JobModel.$typebooxe, ["name"]) })
      ])

      let result = person.cast(PublicType)

      expect(result.job.id).toBeUndefined()
    })

    it('handles optional ref not set', async () => {
      const JobModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String()
      }, { $id: 'Job' }))

      const PersonModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        job: Type.Optional(ModelReference(JobModel))
      }, { $id: "Person" }))

      let person = new PersonModel({ name: 'aberigle' })

      let result = person.cast()
      expect(result.job).toBeUndefined()
    })

    it('handles optional ref set to null', async () => {
      const JobModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String()
      }, { $id: 'Job' }))

      const PersonModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        job: Type.Optional(ModelReference(JobModel))
      }, { $id: "Person" }))

      let person = new PersonModel({ name: 'aberigle', job: null })

      let result = person.cast()
      expect(result.job).toBeUndefined()
    })

    it('handles ref array', async () => {
      const JobModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        salary: Type.Number()
      }, { $id: 'Job' }))

      const PersonModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        jobs: Type.Array(ModelReference(JobModel))
      }, { $id: "Person" }))

      let job = new JobModel({ name: 'developer', salary: 30 })
      let job2 = new JobModel({ name: 'QA', salary: 50 })
      let person = new PersonModel({ name: 'aberigle', jobs: [job, job2] })

      const result = person.cast()

      expect(Array.isArray(result.jobs)).toBeTrue()
      expect(result.jobs.at(0)).toMatchObject({ name: "developer" })
      expect(result.jobs.at(1)).toMatchObject({ name: "QA" })
    })

    it('casts reference arrays with partial fields', async () => {
      const JobModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        salary: Type.Number()
      }, { $id: 'Job' }))

      const PersonModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        jobs: Type.Array(ModelReference(JobModel))
      }, { $id: "Person" }))

      let job = new JobModel({ name: 'developer', salary: 30 })
      let job2 = new JobModel({ name: 'QA', salary: 50 })
      let person = new PersonModel({ name: 'aberigle', jobs: [job, job2] })

      const PublicType = Type.Intersect([
        Type.Omit(PersonModel.$typebooxe, ["jobs"]),
        Type.Optional(Type.Object({ jobs: Type.Array(Type.Pick(JobModel.$typebooxe, ["name"])) }))
      ])

      const result = person.cast(PublicType)

      expect(Array.isArray(result.jobs)).toBeTrue()
      expect(result.jobs.at(0)).toEqual({ name: "developer" })
    })
  })
})
