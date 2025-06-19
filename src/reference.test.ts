import { Type } from "@sinclair/typebox";
import { beforeEach, describe, expect, it } from "bun:test";
import mongoose from "mongoose";
import { TypebooxeRef } from "./reference";
import { typebooxe } from "./typebooxe";
import { ObjectId } from "./types";

describe('typebooxe', () => {
  describe('model', () => {
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

      let job    = new JobModel({ name: 'developer' })
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
        id : Type.String(),
        name: Type.String(),
        job: TypebooxeRef(JobModel)
      }, { $id: "Person" }))

      let job    = new JobModel({ name: 'developer' })
      let person = new PersonModel({ name: 'aberigle' })

      person.job = job

      let result = person.cast()
      expect(result.job).toMatchObject({ name: 'developer' })

      // @ts-ignore
      person.job = job._id

      result = person.cast()
      expect(result.job.id).toBe(job._id.toHexString())
    })

  })
})

