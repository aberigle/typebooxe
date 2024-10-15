import { Type, type Static } from "@sinclair/typebox";
import { describe, expect, it } from "bun:test";
import { typebooxe } from "..";

function create(
  defition: any,
  options = { $id: "Test" + Date.now() }
) {
  const TestType = Type.Object(defition, options)
  const TestModel = typebooxe<Static<typeof TestType>>(TestType)
  return { TestType, TestModel }
}
describe('typeboose', () => {
  describe('model', () => {
    it('creates a model', async () => {
      const { TestModel } = create({ test: Type.String() })
      let item = new TestModel({ test: "hola" })
      expect(item.test).toBe("hola")
    })

    it('casts the type', async () => {
      const {
        TestModel
      } = create({ test: Type.String(), date: Type.Date() })
      let item = new TestModel({ test: "hola", date : new Date("2024-01-01") })
      expect(item.test).toBe("hola")

      const object = item.cast()
      expect(object.date instanceof Date).toBe(true)
      expect(object._id).toBeUndefined()
    })

    it('maintains the id', async () => {
      const {
        TestModel
      } = create({ id : Type.String() })
      let item = new TestModel({})

      const object = item.cast()
      expect(object.id).toBe(item._id.toHexString())
    })

    it('handles ref objectids', async () => {
      const JobType    = Type.Object({ name: Type.String() }, { $id: 'Job' })
      const PersonType = Type.Object({
        name: Type.String(),
        job: Type.Ref(JobType)
      },{ $id : "Person"})

      const JobModel    = typebooxe<typeof JobType.static>(JobType)
      const PersonModel = typebooxe<typeof PersonType.static>(PersonType)

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

  })
})

