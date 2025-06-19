# typebooxe

[mongoose](https://mongoosejs.com/) meets [TypeBox](https://github.com/sinclairzx81/typebox)

## Defining a Schema with typebooxe

```typescript
const Person = Type.Object({
  name: Type.String(),
  age: Type.Number(),
}, {
  $id: "Person", // Used for the mongoose collection name
});

type PersonType = Static<typeof Person>; // Define type for Person schema

const PersonModel = typebooxe(Person);

// ... Connect to your MongoDB instance

// Create a new person document
const person = await PersonModel.create({
  name: "aberigle",
  age: 34,
});

console.log(person); // Document type (includes Mongoose-specific properties)
// Output: {
//   name: "aberigle",
//   age: 34,
//   _id: new ObjectId('670e8b0c500875615df28cac'),
// }

console.log(person.cast()); // PersonType
// Output : {
//   name: "aberigle",
//   age: 34
// }
```

Calling `.cast()` turns the Mongoose document into a TypeBox-valiadble object, matching the defined schema

## Supported Data Types

```
Type.String()   => { type : String, required : true }
Type.Number()   => { type : Number, required : true }
Type.Integer()  => { type : Number, required : true }
Type.Boolean()  => { type : Boolean, required : true }
Type.Date()     => { type : Date, required : true }
Type.Any()      => { type : Schema.Types.Mixed, required : true }
```


### Objects and Arrays
Embed documents can be defined with `Type.Object()`
```
Type.Object({              {
  field : Type.String() =>    field : { type : String, required : true }
})                         }
```

Additionally, arrays can be defined with `Type.Array()`
```
Type.Array(Type.String()) => [{ type : String, required : true }]
Type.Array(Type.Object({     [{
  field : Type.String()   =>    field : { type : String, required : true }
}))                          }]
```

### Optional fields
By default, all fields are required unless wrapped in `Type.Optional()`

```
Type.Optional(Type.String()) => { type : String, required : false}
```

### Enums
Enums are defined by typescript a `enum` and `Type.Enum()`
```typescript
enum JobTypes {
  developer = "developer",
  designer  = "designer",
  manager   = "manager"
}

Type.Enum(JobTypes) => { type : String, enum : ["developer", "designer", "manager"]}
```

## Handling the `_id` Field
mongodb automatically generates an `_id` field for each document. If you don't explicitly define it in the schema, it won't be serialized.

```typescript
const Person = Type.Object({
  id : Type.String() // this will have the mongo _id
})
```

## Defining References Between Models
TypeBox allows you to define relationships between models using `Type.Ref()`. This function creates a reference type that maps to mongoose references.

Here's an example of defining a Person with a reference to a Job model:

```typescript
const Job = Type.Object({
  name: Type.String(),
}, {
  $id: "Job",
});

const JobModel = typebooxe(Job);

const Person = Type.Object({
  name: Type.String(),
  job: Type.Ref(Job), // Reference to the Job model
}, {
  $id: "Person",
});

const PersonModel = typebooxe(Person);

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

### Making References Optional

There are two ways to make references optional:

1. **Union with String:** Define the field as a union of `Type.Ref(Job)` and `Type.String()`. This allows to cast to the referenced model or the objectid's string value in the `job` field.
```typescript
const Person = Type.Object({
  name : Type.String(),
  job  : Type.Union([ Type.Ref(Job), Type.String() ])
}, {
  $id : "Person"
})
```

2. **Optional Reference:** Use `Type.Optional(Type.Ref(Job))`. This ensures the `.job` field won't exist altogether in the casted object if not populated
```typescript
const Person = Type.Object({
  name : Type.String(),
  job  : Type.Optional(Type.Ref(Job))
}, {
  $id : "Person"
})
```