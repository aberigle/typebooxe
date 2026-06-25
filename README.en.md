# typebooxe

[mongoose](https://mongoosejs.com/) meets [TypeBox](https://github.com/sinclairzx81/typebox)

[español](README.md)

## Defining a Schema with typebooxe

```typescript
const Person = Type.Object({
  name: Type.String(),
  age : Type.Number()
}, {
  $id: "Person"  // used as the mongoose collection name
})

type PersonType = Static<typeof Person>

const PersonModel = typebooxe(Person)
```

```typescript
// Create a document
const person = await PersonModel.create({ name: "aberigle", age: 34 })

console.log(person)       // Mongoose document (includes _id, __v, etc.)
console.log(person.cast()) // PersonType — validated schema without mongoose internals
// { name: "aberigle", age: 34 }
```

## Supported Types

| TypeBox | Mongoose |
|---------|----------|
| `Type.String()`  | `{ type: String, required: true }` |
| `Type.Number()`  | `{ type: Number, required: true }` |
| `Type.Integer()` | `{ type: Number, required: true }` |
| `Type.Boolean()` | `{ type: Boolean, required: true }` |
| `Type.Date()`    | `{ type: Date, required: true }` |
| `Type.Any()`     | `{ type: Schema.Types.Mixed }` |

### Objects and Arrays

```typescript
Type.Object({ field: Type.String() })
// ⇒ { field: { type: String, required: true } }

Type.Array(Type.String())
// ⇒ [{ type: String, required: true }]

Type.Array(Type.Object({ field: Type.String() }))
// ⇒ [{ field: { type: String, required: true } }]
```

### Optional Fields

All fields are required by default. Use `Type.Optional()` to make them optional:

```typescript
Type.Optional(Type.String())  // ⇒ { type: String, required: false }
```

### Enums

```typescript
enum JobTypes {
  developer = "developer",
  designer  = "designer"
}

Type.Enum(JobTypes)  // ⇒ { type: String, enum: ["developer", "designer"] }
```

## The `_id` Field

MongoDB auto-generates an `_id`. If you don't define it in the schema, it won't be serialized.

```typescript
const Person = Type.Object({ id: Type.String() })  // will hold the mongo _id
```

## Model References

Use `ModelReference(model)` to define relationships. The field accepts a populated document, a string ID, or a mongoose ObjectId:

```typescript
const JobModel = typebooxe(Type.Object({
  name: Type.String()
}, { $id: "Job" }))

const PersonModel = typebooxe(Type.Object({
  name: Type.String(),
  job : ModelReference(JobModel)
}, { $id: "Person" }))

// All of these are valid:
PersonModel.find({ job: "670e8b0c500875615df28cac" })
PersonModel.find({ job: new Types.ObjectId("670e8b0c500875615df28cac") })
```

### Casting populated / unpopulated references

`.cast()` returns the document with normalized references:

- **Populated**: cast to the referenced model's schema (`{ name, id }`)
- **Unpopulated** (ObjectId only): cast to `{ id }`

```typescript
const person = await PersonModel.findOne({ name: "aberigle" }).populate("job")
const result = person.cast()
// result.job ⇒ { name: "developer", id: "..." }
```

```typescript
let person = new PersonModel({ name: "aberigle", job: someJob })
let result = person.cast()
// result.job ⇒ { name: "developer", ... }

person.job = job._id
result = person.cast()
// result.job ⇒ { id: "abc123..." }
```

To make a reference optional (omitted from the casted object when not set):

```typescript
const Person = Type.Object({
  name: Type.String(),
  job : Type.Optional(ModelReference(JobModel))
}, { $id: "Person" })
```

### Array of references

```typescript
const PersonModel = typebooxe(Type.Object({
  name: Type.String(),
  jobs: Type.Array(ModelReference(JobModel))
}, { $id: "Person" }))
```

## Self-references (recursive models)

Use `Type.Recursive` for models that reference themselves:

```typescript
const Person = Type.Recursive(This =>
  Type.Object({
    id     : Type.String(),
    name   : Type.String(),
    parent : Type.Optional(This)
  }),
  { $id: "Person" }
)

const PersonModel = typebooxe(Person)

let parent = new PersonModel({ name: "parent" })
let child  = new PersonModel({ name: "child", parent })

let result = child.cast()
// result.parent ⇒ { name: "parent", id: "..." }

child.parent = parent._id  // unpopulated
result = child.cast()
// result.parent ⇒ { id: "abc123..." }
```

Multiple self-references in the same model:

```typescript
const Person = Type.Recursive(This =>
  Type.Object({
    id     : Type.String(),
    name   : Type.String(),
    parent : Type.Optional(This),
    coach  : Type.Optional(This)
  }),
  { $id: "Person" }
)
```

Self-references with arrays:

```typescript
const Person = Type.Recursive(This =>
  Type.Object({
    id       : Type.String(),
    name     : Type.String(),
    children : Type.Optional(Type.Array(This))
  }),
  { $id: "Person" }
)
```

The `$id` goes on `Type.Recursive`, not on the inner `Type.Object` — it defines the `$ref` for `This`.

## Getters and Setters

```typescript
const PersonModel = typebooxe(Type.Object({
  name: Type.String(),
  age : Type.Number()
}, { $id: "Person" }), {
  getters: {
    name: (value: string) => value.toUpperCase()
  },
  setters: {
    name: (value: string) => value.trim()
  }
})
```

## Indexes

```typescript
const PersonModel = typebooxe(Type.Object({
  name: Type.String(),
  age : Type.Number()
}, { $id: "Person" }), {
  indexes: [
    { index: { name: 1 }, options: { unique: true } },
    { index: { age: 1 } }
  ]
})
```
