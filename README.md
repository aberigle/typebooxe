# typebooxe

[mongoose](https://mongoosejs.com/) meets [TypeBox](https://github.com/sinclairzx81/typebox)


```typescript
import {
  Type,
  Static
} from "@sinclair/typebox"
import { typebooxe } from "typebooxe"

const Person = Type.Object({
  name : Type.String(),
  age  : Type.Number()
}, {
  $id : "Person" // used for collection name
})

type PersonType = Static<typeof Person>

const PersonModel = typebooxe<PersonType>(Person)

// ... connect to mongoose

const person = await PersonModel.create({
  name : "aberigle",
  age : 34
})

console.log(person)
// Type : Document
// {
//   name: "aberigle",
//   age: 34,
//   _id: new ObjectId('670e8b0c500875615df28cac'),
// }

console.log(person.cast())
// Type: PersonType
// {
//   name: "aberigle",
//   age: 34,
// }

```

## Supported types

```typescript
Type.String()   => { type : String }
Type.Number()   => { type : Number }
Type.Integer()  => { type : Number }
Type.Boolean()  => { type : Boolean }
Type.Date()     => { type : Date }
Type.Any()      => { type : Schema.Types.Mixed }
```

By default all fields are required, unless wrapped in `Type.Optional()`

```typescript
Type.Optional(Type.String()) => { type : String, required : false}
```

### `_id` field
The `_id` field wont be serialized if it's not defined in the schema.

```typescript
const Person = Type.Object({
  id : Type.String() // this will have the mongo _id
})
```

### References
You can define references using `Type.Ref()` function and they will be mapped to mongoose references.

```typescript
const Job = Type.Object({
  name : Type.String()
}, {
  $id : "Job"
})

const JobModel = typebooxe<Static<typeof Job>>(Job)

const Person = Type.Object({
  name : Type.String(),
  job  : Type.Ref(Job)
}, {
  $id : "Person"
})

const PersonModel = typebooxe<Static<typeof Person>>(Person)

const person = await PersonModel.findOne({
  name : "aberigle"
}).populate("job")

person.cast()
// Type: Static<typeof Person>
// {
//   name : "aberigle",
//   job : { // Type: Static<typeof Job>
//     name : "developer"
//   }
// }
```
