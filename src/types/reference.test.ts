import { Type } from "@sinclair/typebox";
import { beforeEach, describe, expect, it } from "bun:test";
import mongoose from "mongoose";
import { TypebooxeRef } from "./reference";
import { typebooxe } from "../typebooxe";

describe('typebooxe', () => {
  describe('types', () => {
    beforeEach(() => {
      for (let key of Object.keys(mongoose.models)) delete mongoose.models[key]
    })

    it('handles ref objectids', async () => {
      const JobModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String()
      }, { $id: 'Job' }))

      const PersonModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        job: TypebooxeRef(JobModel)
      }, { $id: "Person" }))

      let job = new JobModel({ name: 'developer' })
      let person = new PersonModel({ name: 'aberigle' })

      person.job = job
      let result = person.cast()

      expect(result.job).toMatchObject({ name: 'developer' })

      person.job = job.id
      result = person.cast()

      expect(result.job).toEqual({ id: job.id })
    })

    it('casts ref to string when not populated', async () => {

      const JobModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String()
      }, { $id: 'Job' }))

      const PersonModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        job: TypebooxeRef(JobModel)
      }, { $id: "Person" }))

      let job = new JobModel({ name: 'developer' })
      let person = new PersonModel({ name: 'aberigle' })

      person.job = job

      let result = person.cast()
      expect(result.job).toMatchObject({ name: 'developer' })

      // @ts-ignore
      person.job = job._id

      result = person.cast()
      expect(result.job.id).toBe(job._id.toHexString())
    })

    it('casts only defined fields', async () => {
      const JobModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String()
      }, { $id: 'Job' }))

      const PersonModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        job: TypebooxeRef(JobModel)
      }, { $id: "Person" }))

      let job = new JobModel({ name: 'developer' })
      let person = new PersonModel({ name: 'aberigle' })

      person.job = job

      const PublicType = Type.Intersect([
        Type.Omit(PersonModel.$typebooxe, ["job"]),
        Type.Object({ job: Type.Pick(JobModel.$typebooxe, ["name"]) })
      ])

      let result = person.cast(PublicType)

      // @ts-ignore
      expect(result.job.id).toBeUndefined()
    })

    it('casts reference arrays', async () => {
      const JobModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        salary: Type.Number()
      }, { $id: 'Job' }))

      const PersonModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        jobs: Type.Array(TypebooxeRef(JobModel))
      }, { $id: "Person" }))

      let job = new JobModel({ name: 'developer', salary: 30 })
      let job2 = new JobModel({ name: 'QA', salary: 50 })
      let person = new PersonModel({ name: 'aberigle', jobs: [job, job2] })

      const PublicType = Type.Intersect([
        Type.Omit(PersonModel.$typebooxe, ["jobs"]),
        Type.Optional(Type.Object({ jobs: Type.Array(Type.Pick(JobModel.$typebooxe, ["name"])) }))
      ])

      const result = person.cast(PublicType)
      expect(result.jobs[0]).toEqual({ name: "developer" })
    })

  })
})

