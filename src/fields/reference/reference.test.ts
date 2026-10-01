import { Type } from "@sinclair/typebox";
import { beforeEach, describe, expect, it } from "bun:test";
import mongoose from "mongoose";
import { modelsCache, typebooxe } from "../../typebooxe";
import { PrefixedId } from "../prefixed-id";
import { ModelReference } from "./index";

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

    describe('dynamic refs (refPath)', () => {
      it('accepts any candidate model when populated', async () => {
        const PostModel = typebooxe(Type.Object({
          id: Type.String(),
          title: Type.String()
        }, { $id: 'Post' }))

        const ProductModel = typebooxe(Type.Object({
          id: Type.String(),
          price: Type.Number()
        }, { $id: 'Product' }))

        const CommentModel = typebooxe(Type.Object({
          id: Type.String(),
          onModel: Type.Union([Type.Literal('Post'), Type.Literal('Product')]),
          on: ModelReference([PostModel, ProductModel], { refPath: 'onModel' })
        }, { $id: 'Comment' }))

        const post = new PostModel({ title: 'hello' })
        const product = new ProductModel({ price: 10 })

        let result = new CommentModel({ onModel: 'Post', on: post }).cast()
        expect(result.on).toMatchObject({ title: 'hello' })

        result = new CommentModel({ onModel: 'Product', on: product }).cast()
        expect(result.on).toMatchObject({ price: 10 })
      })

      it('casts unpopulated dynamic ref to id', async () => {
        const PostModel = typebooxe(Type.Object({
          id: Type.String(),
          title: Type.String()
        }, { $id: 'Post' }))

        const ProductModel = typebooxe(Type.Object({
          id: Type.String(),
          price: Type.Number()
        }, { $id: 'Product' }))

        const CommentModel = typebooxe(Type.Object({
          id: Type.String(),
          onModel: Type.Union([Type.Literal('Post'), Type.Literal('Product')]),
          on: ModelReference([PostModel, ProductModel], { refPath: 'onModel' })
        }, { $id: 'Comment' }))

        const post = new PostModel({ title: 'hello' })
        const comment = new CommentModel({ onModel: 'Post' })

        // @ts-ignore
        comment.on = post._id

        const result = comment.cast()
        expect(result.on?.id).toBe(post._id.toHexString())
      })

      it('handles optional dynamic ref not set', async () => {
        const PostModel = typebooxe(Type.Object({
          id: Type.String(),
          title: Type.String()
        }, { $id: 'Post' }))

        const ProductModel = typebooxe(Type.Object({
          id: Type.String(),
          price: Type.Number()
        }, { $id: 'Product' }))

        const CommentModel = typebooxe(Type.Object({
          id: Type.String(),
          onModel: Type.Union([Type.Literal('Post'), Type.Literal('Product')]),
          on: Type.Optional(ModelReference([PostModel, ProductModel], { refPath: 'onModel' }))
        }, { $id: 'Comment' }))

        const result = new CommentModel({ onModel: 'Post' }).cast()
        expect(result.on).toBeUndefined()
      })

      it('handles dynamic ref array', async () => {
        const PostModel = typebooxe(Type.Object({
          id: Type.String(),
          title: Type.String()
        }, { $id: 'Post' }))

        const ProductModel = typebooxe(Type.Object({
          id: Type.String(),
          price: Type.Number()
        }, { $id: 'Product' }))

        const CommentModel = typebooxe(Type.Object({
          id: Type.String(),
          onModel: Type.Union([Type.Literal('Post'), Type.Literal('Product')]),
          on: Type.Array(ModelReference([PostModel, ProductModel], { refPath: 'onModel' }))
        }, { $id: 'Comment' }))

        const post = new PostModel({ title: 'hello' })
        const post2 = new PostModel({ title: 'world' })
        const comment = new CommentModel({ onModel: 'Post', on: [post, post2] })

        const result = comment.cast()
        expect(result.on.at(0)).toMatchObject({ id: post.id })
        expect(result.on.at(1)).toMatchObject({ id: post2.id })
      })

      it('resolves circular dynamic ref lazily by name', async () => {
        const CommentModel = typebooxe(Type.Object({
          id: Type.String(),
          body: Type.String(),
          onModel: Type.Union([Type.Literal('Post'), Type.Literal('Comment')]),
          on: ModelReference(['Post', 'Comment'], { refPath: 'onModel' })
        }, { $id: 'Comment' }))

        const PostModel = typebooxe(Type.Object({
          id: Type.String(),
          title: Type.String()
        }, { $id: 'Post' }))

        const post = new PostModel({ title: 'hello' })
        const comment = new CommentModel({ body: 'hi', onModel: 'Post', on: post })

        const result = comment.cast()
        expect(result.on).toMatchObject({ title: 'hello' })
      })

      it('casts a dynamic ref through a public type with per-candidate prefixes', async () => {
        const PostModel = typebooxe(Type.Object({
          id: Type.String(),
          title: Type.String()
        }, { $id: 'Post' }))

        const ProductModel = typebooxe(Type.Object({
          id: Type.String(),
          price: Type.Number()
        }, { $id: 'Product' }))

        const CommentModel = typebooxe(Type.Object({
          id: Type.String(),
          onModel: Type.Union([Type.Literal('Post'), Type.Literal('Product')]),
          on: ModelReference([PostModel, ProductModel], { refPath: 'onModel' })
        }, { $id: 'Comment' }))

        const PublicType = Type.Intersect([
          Type.Omit(CommentModel.$typebooxe, ["on", "onModel"]),
          Type.Object({
            on: Type.Union([
              Type.Object({ id: PrefixedId("pst"), title: Type.String() }),
              Type.Object({ id: PrefixedId("prd"), price: Type.Number() })
            ])
          })
        ])

        const post    = new PostModel({ title: 'hello' })
        const product = new ProductModel({ price: 10 })

        const fromPost = new CommentModel({ onModel: 'Post', on: post }).cast(PublicType)
        expect(fromPost.on.id).toStartWith("pst_")
        expect(fromPost.onModel).toBeUndefined()

        const fromProduct = new CommentModel({ onModel: 'Product', on: product }).cast(PublicType)
        expect(fromProduct.on.id).toStartWith("prd_")
      })
    })
  })
})
