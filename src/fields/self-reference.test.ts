import { Type } from "@sinclair/typebox"
import { beforeEach, describe, expect, it } from "bun:test"
import mongoose from "mongoose"
import { modelsCache, typebooxe } from "../typebooxe"
import { ModelReference } from "./reference"
import { SelfReference } from "./self-reference"

describe('typebooxe', () => {

  beforeEach(() => {
    for (let key of Object.keys(mongoose.models)) delete mongoose.models[key]
    const cache = modelsCache()
    for (let key of Object.keys(cache)) delete cache[key]
  })

  it('handles self-referential ref with Type.Recursive', async () => {
    const PersonType = Type.Recursive(This =>
      Type.Object({
        id: Type.String(),
        name: Type.String(),
        parent: Type.Optional(SelfReference(This))
      }),
      { $id: "Person" }
    )

    const PersonModel = typebooxe(PersonType)

    let parent = new PersonModel({ name: 'parent' })

    expect(parent.cast()).toMatchObject({ name: "parent" })

    let child = new PersonModel({ name: 'child', parent })

    let result = child.cast()
    expect(result.parent).toMatchObject({ name: 'parent' })

    child.parent = parent.id
    result = child.cast()
    expect(result.parent).toMatchObject({ id: parent.id })
  })

  it('handles self-referential array with Type.Recursive', async () => {
    const PersonModel = typebooxe(Type.Recursive(This =>
      Type.Object({
        id: Type.String(),
        name: Type.String(),
        children: Type.Optional(Type.Array(SelfReference(This)))
      }),
      { $id: "Person" }
    ))

    let parent = new PersonModel({ name: 'parent' })
    let child1 = new PersonModel({ name: 'child1' })
    let child2 = new PersonModel({ name: 'child2' })

    parent.children = [child1, child2]
    let result = parent.cast()

    expect(Array.isArray(result.children)).toBeTrue()
    expect(result.children.at(0)).toMatchObject({ name: 'child1' })
    expect(result.children.at(1)).toMatchObject({ name: 'child2' })
  })

  it('casts unpopulated self-ref with Type.Recursive', async () => {
    const PersonModel = typebooxe(Type.Recursive(This =>
      Type.Object({
        id: Type.String(),
        name: Type.String(),
        parent: Type.Optional(SelfReference(This))
      }),
      { $id: "Person" }
    ))

    let parent = new PersonModel({ name: 'parent' })
    let child = new PersonModel({ name: 'child', parent })

    let result = child.cast()
    expect(result.parent).toMatchObject({ name: 'parent' })

    // @ts-ignore
    child.parent = parent._id
    result = child.cast()
    expect(result.parent?.id).toBe(parent._id.toHexString())
  })

  it('handles optional self-ref not set', async () => {
    const PersonModel = typebooxe(Type.Recursive(This =>
      Type.Object({
        id: Type.String(),
        name: Type.String(),
        parent: Type.Optional(SelfReference(This))
      }),
      { $id: "Person" }
    ))

    let child = new PersonModel({ name: 'child' })

    let result = child.cast()
    expect(result.parent).toBeUndefined()
  })

  it('handles optional self-ref set to null', async () => {
    const PersonModel = typebooxe(Type.Recursive(This =>
      Type.Object({
        id: Type.String(),
        name: Type.String(),
        parent: Type.Optional(SelfReference(This))
      }),
      { $id: "Person" }
    ))

    let child = new PersonModel({ name: 'child', parent: null })

    let result = child.cast()
    expect(result.parent).toBeUndefined()
  })

  it('casts partial self-ref with Type.Recursive', async () => {
    const PersonModel = typebooxe(Type.Recursive(This =>
      Type.Object({
        id: Type.String(),
        name: Type.String(),
        parent: Type.Optional(SelfReference(This))
      }),
      { $id: "Person" }
    ))

    let parent = new PersonModel({ name: 'parent' })
    let child = new PersonModel({ name: 'child', parent })

    const PublicType = Type.Intersect([
      Type.Omit(PersonModel.$typebooxe, ["parent"]),
      Type.Optional(Type.Object({ parent: Type.Pick(PersonModel.$typebooxe, ["name"]) }))
    ])

    let result = child.cast(PublicType)
    expect(result.parent).toMatchObject({ name: 'parent' })
    expect(result.parent.id).toBeUndefined()
  })

  it('casts unpopulated array of self-refs', async () => {
    const PersonModel = typebooxe(Type.Recursive(This =>
      Type.Object({
        id: Type.String(),
        name: Type.String(),
        children: Type.Optional(Type.Array(SelfReference(This)))
      }),
      { $id: "Person" }
    ))

    let child1 = new PersonModel({ name: 'child1' })
    let child2 = new PersonModel({ name: 'child2' })
    let parent = new PersonModel({ name: 'parent' })

    // @ts-ignore
    parent.children = [child1._id, child2._id]
    let result = parent.cast()

    expect(Array.isArray(result.children)).toBeTrue()
    expect(result.children.at(0)).toMatchObject({ id: child1._id.toHexString() })
    expect(result.children.at(1)).toMatchObject({ id: child2._id.toHexString() })
  })

  it('handles self-referential doc referencing itself', async () => {
    const PersonModel = typebooxe(Type.Recursive(This =>
      Type.Object({
        id: Type.String(),
        name: Type.String(),
        parent: Type.Optional(SelfReference(This))
      }),
      { $id: "Person" }
    ))

    let person = new PersonModel({ name: 'self-referenced' })

    // @ts-ignore
    person.parent = person._id
    let result = person.cast()

    expect(result.parent?.id).toBe(person._id.toHexString())
  })

  it('handles self-ref and cross-ref in the same model', async () => {
    const JobModel = typebooxe(Type.Object({
      id: Type.String(),
      name: Type.String()
    }, { $id: 'Job' }))

    const PersonModel = typebooxe(Type.Recursive(This =>
      Type.Object({
        id: Type.String(),
        name: Type.String(),
        parent: Type.Optional(SelfReference(This)),
        job: ModelReference(JobModel)
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

  it('handles multiple self-referential fields', async () => {
    const PersonModel = typebooxe(Type.Recursive(This =>
      Type.Object({
        id: Type.String(),
        name: Type.String(),
        parent: Type.Optional(SelfReference(This)),
        coach: Type.Optional(SelfReference(This))
      }),
      { $id: "Person" }
    ))

    let parent = new PersonModel({ name: 'parent' })
    let coach = new PersonModel({ name: 'coach' })
    let child = new PersonModel({ name: 'child', parent, coach })

    let result = child.cast()

    expect(result.parent).toMatchObject({ name: 'parent' })
    expect(result.coach).toMatchObject({ name: 'coach' })
  })

  it('supports Type.Omit on recursive $typebooxe', async () => {
    const PersonModel = typebooxe(Type.Recursive(This =>
      Type.Object({
        id: Type.String(),
        name: Type.String(),
        parent: Type.Optional(SelfReference(This))
      }),
      { $id: "Person" }
    ))

    let parent = new PersonModel({ name: 'parent' })
    let child = new PersonModel({ name: 'child', parent })

    const PublicType = Type.Omit(PersonModel.$typebooxe, ["parent"])

    let result = child.cast(PublicType)

    expect(result.name).toBe('child')
    // @ts-ignore
    expect(result.parent).toBeUndefined()
  })

  it('supports Type.Pick on recursive $typebooxe', async () => {
    const PersonModel = typebooxe(Type.Recursive(This =>
      Type.Object({
        id: Type.String(),
        name: Type.String(),
        parent: Type.Optional(SelfReference(This))
      }),
      { $id: "Person" }
    ))

    let parent = new PersonModel({ name: 'parent' })
    let child = new PersonModel({ name: 'child', parent })

    const PublicType = Type.Object({ parent: Type.Pick(PersonModel.$typebooxe, ["name"]) })

    let result = child.cast(PublicType)

    expect(result.parent).toMatchObject({ name: 'parent' })
    expect(result.parent.id).toBeUndefined()
  })

  it('casts against original recursive schema when self-ref is not populated', async () => {
    const PersonType = Type.Recursive(This =>
      Type.Object({
        id: Type.String(),
        name: Type.String(),
        parent: Type.Optional(SelfReference(This))
      }),
      { $id: "Person" }
    )

    const PersonModel = typebooxe(PersonType)

    let parent = new PersonModel({ name: 'parent' })
    let child = new PersonModel({ name: 'child' })

    // @ts-ignore
    child.parent = parent._id

    let result = child.cast(PersonType)

    expect(result.parent).toMatchObject({ id: parent._id.toHexString() })
  })
})
