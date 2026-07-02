import { Type } from "@sinclair/typebox";
import { beforeEach, describe, expect, it } from "bun:test";
import mongoose from "mongoose";
import { modelsCache, typebooxe } from "../typebooxe";
import { ModelReference } from "./reference";

describe('typebooxe', () => {
  describe('reference lazy', () => {
    beforeEach(() => {
      for (let key of Object.keys(mongoose.models)) delete mongoose.models[key]
      const cache = modelsCache()
      for (let key of Object.keys(cache)) delete cache[key]
    })

    it('resolves model eagerly when already in cache', async () => {
      const JobModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        salary: Type.Number()
      }, { $id: 'Job' }))

      const PersonModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        job: ModelReference('Job')
      }, { $id: "Person" }))

      let job = new JobModel({ name: 'developer', salary: 30 })
      let person = new PersonModel({ name: 'aberigle' })

      person.job = job
      let result = person.cast()

      expect(result.job).toMatchObject({ name: 'developer', salary: 30 })
    })

    it('resolves placeholder model lazily at cast time', async () => {
      const PersonModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        job: ModelReference('Job')
      }, { $id: "Person" }))

      const JobModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        salary: Type.Number()
      }, { $id: 'Job' }))

      let job = new JobModel({ name: 'developer', salary: 30 })
      let person = new PersonModel({ name: 'aberigle' })

      person.job = job
      let result = person.cast()

      expect(result.job).toMatchObject({ name: 'developer', salary: 30 })
    })

    it('casts unpopulated string ref when placeholder', async () => {
      const PersonModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        job: ModelReference('Job')
      }, { $id: "Person" }))

      const JobModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String()
      }, { $id: 'Job' }))

      let job = new JobModel({ name: 'developer' })
      let person = new PersonModel({ name: 'aberigle' })

      person.job = job.id
      let result = person.cast()

      expect(result.job).toMatchObject({ id: job.id })
    })

    it('casts unpopulated ref to id when placeholder', async () => {
      const PersonModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        job: ModelReference('Job')
      }, { $id: "Person" }))

      const JobModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String()
      }, { $id: 'Job' }))

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

    it('casts only defined fields via placeholder ref', async () => {
      const PersonModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        job: ModelReference('Job')
      }, { $id: "Person" }))

      const JobModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        salary: Type.Number()
      }, { $id: 'Job' }))

      let job = new JobModel({ name: 'developer', salary: 30 })
      let person = new PersonModel({ name: 'aberigle' })

      person.job = job

      const PublicType = Type.Intersect([
        Type.Omit(PersonModel.$typebooxe, ["job"]),
        Type.Object({ job: Type.Pick(JobModel.$typebooxe, ["name"]) })
      ])

      let result = person.cast(PublicType)

      expect(result.job.id).toBeUndefined()
      expect(result.job).toMatchObject({ name: 'developer' })
    })

    it('handles optional placeholder ref not set', async () => {
      const PersonModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        job: Type.Optional(ModelReference('Job'))
      }, { $id: "Person" }))

      const JobModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String()
      }, { $id: 'Job' }))

      let person = new PersonModel({ name: 'aberigle' })
      let result = person.cast()
      expect(result.job).toBeUndefined()
    })

    it('handles optional placeholder ref set to null', async () => {
      const PersonModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        job: Type.Optional(ModelReference('Job'))
      }, { $id: "Person" }))

      const JobModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String()
      }, { $id: 'Job' }))

      let person = new PersonModel({ name: 'aberigle', job: null })
      let result = person.cast()
      expect(result.job).toBeUndefined()
    })

    it('handles placeholder ref array', async () => {
      const PersonModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        jobs: Type.Array(ModelReference('Job'))
      }, { $id: "Person" }))

      const JobModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        salary: Type.Number()
      }, { $id: 'Job' }))

      let job = new JobModel({ name: 'developer', salary: 30 })
      let job2 = new JobModel({ name: 'QA', salary: 50 })
      let person = new PersonModel({ name: 'aberigle', jobs: [job, job2] })

      const result = person.cast()

      expect(Array.isArray(result.jobs)).toBeTrue()
      expect(result.jobs.at(0)).toMatchObject({ name: "developer" })
      expect(result.jobs.at(1)).toMatchObject({ name: "QA" })
    })

    it('casts unpopulated placeholder ref array with ObjectIds', async () => {
      const PersonModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        jobs: Type.Array(ModelReference('Job'))
      }, { $id: "Person" }))

      const JobModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        salary: Type.Number()
      }, { $id: 'Job' }))

      let job = new JobModel({ name: 'developer', salary: 30 })
      let job2 = new JobModel({ name: 'QA', salary: 50 })
      let person = new PersonModel({ name: 'aberigle' })

      // @ts-ignore
      person.jobs = [job._id, job2._id]
      let result = person.cast()

      expect(Array.isArray(result.jobs)).toBeTrue()
      expect(result.jobs.at(0)).toMatchObject({ id: job._id.toHexString() })
      expect(result.jobs.at(1)).toMatchObject({ id: job2._id.toHexString() })
    })

    it('casts partial placeholder ref array with custom type', async () => {
      const PersonModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        jobs: Type.Array(ModelReference('Job'))
      }, { $id: "Person" }))

      const JobModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        salary: Type.Number()
      }, { $id: 'Job' }))

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

    it('handles bidirectional circular refs', async () => {
      const PersonModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        job: ModelReference('Job')
      }, { $id: "Person" }))

      const JobModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        manager: ModelReference('Person')
      }, { $id: 'Job' }))

      let manager = new PersonModel({ name: 'boss' })
      let job = new JobModel({ name: 'developer', manager })
      let person = new PersonModel({ name: 'aberigle', job })

      let result = person.cast()

      expect(result.name).toBe('aberigle')
      expect(result.job).toMatchObject({ name: 'developer' })

      let jobResult = job.cast()
      expect(jobResult.manager).toMatchObject({ name: 'boss' })
    })

    it('handles mutual circular ref (A -> B -> A) populated one direction', async () => {
      const AModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        bRef: ModelReference('B')
      }, { $id: 'A' }))

      const BModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        aRef: ModelReference('A')
      }, { $id: 'B' }))

      let a = new AModel({ name: 'alpha' })
      let b = new BModel({ name: 'beta', aRef: a })

      let result = b.cast()
      expect(result.name).toBe('beta')
      expect(result.aRef).toMatchObject({ name: 'alpha' })
    })

    it('handles unpopulated circular refs', async () => {
      const AModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        bRef: ModelReference('B')
      }, { $id: 'A' }))

      const BModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        aRef: ModelReference('A')
      }, { $id: 'B' }))

      let a = new AModel({ name: 'alpha' })
      let b = new BModel({ name: 'beta' })

      // @ts-ignore
      b.aRef = a._id
      let result = b.cast()

      expect(result.aRef).toMatchObject({ id: a._id.toHexString() })
    })

    it('combines self-reference and string-based cross-reference', async () => {
      const JobModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String()
      }, { $id: 'Job' }))

      const PersonModel = typebooxe(Type.Recursive(This =>
        Type.Object({
          id: Type.String(),
          name: Type.String(),
          parent: Type.Optional(Type.Union([
            This,
            Type.Object({ id: Type.Optional(Type.String()) })
          ], {
            $id: "ref@Person"
          })),
          job: ModelReference('Job')
        }),
        { $id: "Person" }
      ))

      let parent = new PersonModel({ name: 'parent' })
      let job = new JobModel({ name: 'developer' })
      let child = new PersonModel({ name: 'child', parent, job })

      let result = child.cast()

      expect(result.parent).toMatchObject({ name: 'parent' })
      expect(result.job).toMatchObject({ name: 'developer' })
    })

    it('mixes object-based and string-based references', async () => {
      const JobModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String()
      }, { $id: 'Job' }))

      const DepartmentModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String()
      }, { $id: 'Department' }))

      const PersonModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        job: ModelReference(JobModel),
        department: ModelReference('Department')
      }, { $id: "Person" }))

      let job = new JobModel({ name: 'developer' })
      let dept = new DepartmentModel({ name: 'engineering' })
      let person = new PersonModel({ name: 'aberigle', job, department: dept })

      let result = person.cast()

      expect(result.job).toMatchObject({ name: 'developer' })
      expect(result.department).toMatchObject({ name: 'engineering' })
    })

    it('throws at cast time if referenced model was never registered', async () => {
      const PersonModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        job: ModelReference('NonExistentModel')
      }, { $id: "Person" }))

      let person = new PersonModel({ name: 'ghost' })

      expect(() => person.cast()).toThrow(/NonExistentModel/)
    })

    it('handles populated placeholder ref array with multiple items', async () => {
      const JobModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        salary: Type.Number()
      }, { $id: 'Job' }))

      const PersonModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        jobs: Type.Array(ModelReference('Job'))
      }, { $id: "Person" }))

      let job1 = new JobModel({ name: 'developer', salary: 30 })
      let job2 = new JobModel({ name: 'designer', salary: 40 })
      let job3 = new JobModel({ name: 'manager', salary: 50 })
      let person = new PersonModel({ name: 'alice', jobs: [job1, job2, job3] })

      let result = person.cast()

      expect(result.jobs).toHaveLength(3)
      expect(result.jobs.at(0)).toMatchObject({ name: 'developer' })
      expect(result.jobs.at(1)).toMatchObject({ name: 'designer' })
      expect(result.jobs.at(2)).toMatchObject({ name: 'manager' })
    })

    it('resolves all fields of eagerly resolved ref', async () => {
      const JobModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        salary: Type.Number(),
        active: Type.Boolean()
      }, { $id: 'Job' }))

      const PersonModel = typebooxe(Type.Object({
        id: Type.String(),
        name: Type.String(),
        job: ModelReference('Job')
      }, { $id: "Person" }))

      let job = new JobModel({ name: 'developer', salary: 100, active: true })
      let person = new PersonModel({ name: 'aberigle', job })

      let result = person.cast()
      expect(result.job).toMatchObject({
        name: 'developer',
        salary: 100,
        active: true
      })
    })
  })
})
