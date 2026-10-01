import { Type } from "@sinclair/typebox";
import { beforeEach, describe, expect, it } from "bun:test";
import mongoose from "mongoose";
import { modelsCache, typebooxe } from "../typebooxe";
import { ModelReference } from "../fields/reference";
import { PrefixedId } from "../fields/prefixed-id";

// Suite exhaustiva de `.cast()`: cada caso apunta a una rama de `handleError`
// (cast/index.ts) o de `resolveDynamicRefs` (fields/reference/resolve.ts).
describe('cast', () => {
  beforeEach(() => {
    for (let key of Object.keys(mongoose.models)) delete mongoose.models[key]
    const cache = modelsCache()
    for (let key of Object.keys(cache)) delete cache[key]
  })

  describe('ids', () => {
    it('derives id from _id when the schema declares id', () => {
      const Model = typebooxe(Type.Object({
        id  : Type.String(),
        name: Type.String()
      }, { $id: 'CastId' }))

      const doc = new Model({ name: 'x' })

      expect(doc.cast().id).toBe(doc._id.toHexString())
    })

    it('drops _id, __v and id when the schema declares none', () => {
      const Model = typebooxe(Type.Object({
        name: Type.String()
      }, { $id: 'CastNoId' }))

      const result = new Model({ name: 'x' }).cast()

      expect(result).not.toHaveProperty('id')
      expect(result).not.toHaveProperty('_id')
      expect(result).not.toHaveProperty('__v')
    })

    it('maps the _id of a nested object to its id', () => {
      const Model = typebooxe(Type.Object({
        id      : Type.String(),
        provider: Type.Object({ id: Type.String(), name: Type.String() })
      }, { $id: 'CastNestedId' }))

      const doc = new Model({ name: 'x', provider: { name: 'p' } })

      expect(doc.cast()).toEqual({
        id: doc._id.toHexString(),
        provider: { id: doc.provider!._id.toHexString(), name: 'p' }
      })
    })

    it('encodes a PrefixedId field on the way out', () => {
      const Model = typebooxe(Type.Object({
        id  : PrefixedId('prj'),
        name: Type.String()
      }, { $id: 'CastPrefixedId' }))

      expect(new Model({ name: 'x' }).cast().id).toStartWith('prj_')
    })
  })

  describe('references', () => {
    const setup = () => {
      const Job = typebooxe(Type.Object({
        id  : Type.String(),
        name: Type.String()
      }, { $id: 'CastJob' }))

      const Person = typebooxe(Type.Object({
        id  : Type.String(),
        name: Type.String(),
        job : ModelReference(Job)
      }, { $id: 'CastPerson' }))

      return { Job, Person }
    }

    it('casts an unpopulated ref to { id }', () => {
      const { Job, Person } = setup()
      const job = new Job({ name: 'dev' })

      const result = new Person({ name: 'a', job: job._id }).cast()

      expect(result.job).toEqual({ id: job._id.toHexString() })
    })

    it('casts a ref nested in a subdocument', () => {
      const Job = typebooxe(Type.Object({
        id  : Type.String(),
        name: Type.String()
      }, { $id: 'CastNestedJob' }))

      const Person = typebooxe(Type.Object({
        id  : Type.String(),
        meta: Type.Object({ job: ModelReference(Job) })
      }, { $id: 'CastNestedPerson' }))

      const job = new Job({ name: 'dev' })

      const result = new Person({ meta: { job: job._id } }).cast()

      expect(result.meta!.job).toEqual({ id: job._id.toHexString() })
    })

    it('casts an array of unpopulated refs', () => {
      const Job = typebooxe(Type.Object({
        id  : Type.String(),
        name: Type.String()
      }, { $id: 'CastArrayJob' }))

      const Person = typebooxe(Type.Object({
        id  : Type.String(),
        jobs: Type.Array(ModelReference(Job))
      }, { $id: 'CastArrayPerson' }))

      const jobs = [new Job({ name: 'a' }), new Job({ name: 'b' })]
      const result = new Person({ jobs: jobs.map(j => j._id) }).cast()

      expect(result.jobs).toEqual(jobs.map(j => ({ id: j._id.toHexString() })))
    })
  })

  describe('unions', () => {
    it('recurses into the union to cast a nullable ref', () => {
      const Job = typebooxe(Type.Object({
        id  : Type.String(),
        name: Type.String()
      }, { $id: 'CastUnionJob' }))

      const Person = typebooxe(Type.Object({
        id : Type.String(),
        job: Type.Union([ModelReference(Job), Type.Null()])
      }, { $id: 'CastUnionPerson' }))

      const job = new Job({ name: 'dev' })

      const result = new Person({ job: job._id }).cast()

      expect(result.job).toEqual({ id: job._id.toHexString() })
    })
  })

  describe('dynamic refPath', () => {
    const setup = () => {
      const Post = typebooxe(Type.Object({
        id   : Type.String(),
        title: Type.String()
      }, { $id: 'CastPost' }))

      const Product = typebooxe(Type.Object({
        id   : Type.String(),
        price: Type.Number()
      }, { $id: 'CastProduct' }))

      const Comment = typebooxe(Type.Object({
        id     : Type.String(),
        onModel: Type.Union([Type.Literal('CastPost'), Type.Literal('CastProduct')]),
        on     : ModelReference([Post, Product], { refPath: 'onModel' })
      }, { $id: 'CastComment' }))

      return { Post, Product, Comment }
    }

    it('casts an unpopulated dynamic ref to { id }', () => {
      const { Post, Comment } = setup()
      const post = new Post({ title: 'hello' })

      const result = new Comment({ onModel: 'CastPost', on: post._id }).cast()

      expect(result.on).toEqual({ id: post._id.toHexString() })
    })
  })
})
