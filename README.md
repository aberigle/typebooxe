# typebooxe

[mongoose](https://mongoosejs.com/) meets [TypeBox](https://github.com/sinclairzx81/typebox)

[english](README.en.md)

## Definir un Schema con typebooxe

```typescript
const Person = Type.Object({
  name: Type.String(),
  age : Type.Number()
}, {
  $id: "Person"  // usado como nombre de la colección mongoose
})

type PersonType = Static<typeof Person>

const PersonModel = typebooxe(Person)
```

```typescript
// Crear un documento
const person = await PersonModel.create({ name: "aberigle", age: 34 })

console.log(person)       // Documento mongoose (incluye _id, __v, etc.)
console.log(person.cast()) // PersonType — schema validado sin propiedades de mongoose
// { name: "aberigle", age: 34 }
```

## Tipos Soportados

| TypeBox | Mongoose |
|---------|----------|
| `Type.String()`  | `{ type: String, required: true }` |
| `Type.Number()`  | `{ type: Number, required: true }` |
| `Type.Integer()` | `{ type: Number, required: true }` |
| `Type.Boolean()` | `{ type: Boolean, required: true }` |
| `Type.Date()`    | `{ type: Date, required: true }` |
| `Type.Any()`     | `{ type: Schema.Types.Mixed }` |

### Objetos y Arrays

```typescript
Type.Object({ field: Type.String() })
// ⇒ { field: { type: String, required: true } }

Type.Array(Type.String())
// ⇒ [{ type: String, required: true }]

Type.Array(Type.Object({ field: Type.String() }))
// ⇒ [{ field: { type: String, required: true } }]
```

### Campos Opcionales

Por defecto todos los campos son requeridos. Usa `Type.Optional()` para hacerlos opcionales:

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

## El campo `_id`

MongoDB genera un `_id` automáticamente. Si no lo defines en el schema, no se serializa.

```typescript
const Person = Type.Object({ id: Type.String() })  // tendrá el _id de mongo
```

## Referencias entre modelos

Usa `ModelReference(modelo)` para crear relaciones. El campo acepta un documento populado, un string ID, o un ObjectId de mongoose:

```typescript
const JobModel = typebooxe(Type.Object({
  name: Type.String()
}, { $id: "Job" }))

const PersonModel = typebooxe(Type.Object({
  name: Type.String(),
  job : ModelReference(JobModel)
}, { $id: "Person" }))

// Todos son válidos:
PersonModel.find({ job: "670e8b0c500875615df28cac" })
PersonModel.find({ job: new Types.ObjectId("670e8b0c500875615df28cac") })
```

### Cast de referencias populadas

`.cast()` devuelve el documento con las referencias normalizadas:

- **Poluado**: se castea al schema del modelo referenciado (`{ name, id }`)
- **No poblada** (solo ObjectId): se castea a `{ id }`

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

Para hacer la referencia opcional (no aparece en el casteado si no se setea):

```typescript
const Person = Type.Object({
  name: Type.String(),
  job : Type.Optional(ModelReference(JobModel))
}, { $id: "Person" })
```

### Arrays de referencias

```typescript
const PersonModel = typebooxe(Type.Object({
  name: Type.String(),
  jobs: Type.Array(ModelReference(JobModel))
}, { $id: "Person" }))
```

### Referencias dinámicas (`refPath`)

Cuando la colección referenciada depende de otro campo del documento (el `refPath` de
mongoose), pasa la lista de modelos candidatos y el nombre del campo discriminador. El
discriminador lo declaras tú; `typebooxe` no lo rellena solo. También admite nombres de
modelo en string, para referencias circulares.

```typescript
const PostModel    = typebooxe(Type.Object({ title: Type.String() }, { $id: "Post" }))
const ProductModel = typebooxe(Type.Object({ price: Type.Number() }, { $id: "Product" }))

const CommentModel = typebooxe(Type.Object({
  body   : Type.String(),
  onModel: Type.Union([Type.Literal("Post"), Type.Literal("Product")]),
  on     : ModelReference([PostModel, ProductModel], { refPath: "onModel" })
}, { $id: "Comment" }))

const comment = new CommentModel({ body: "hi", onModel: "Post", on: post })

comment.cast().on  // ⇒ { title: "hello", id: "..." } — se resuelve según onModel
```

Con strings, para referencias circulares (el modelo aún no existe al declarar el schema):

```typescript
on: ModelReference(["Post", "Comment"], { refPath: "onModel" })
```

El discriminador es obligatorio en el resultado: si falta o no coincide con ningún
candidato, el casteado falla.

## IDs con prefijo

`PrefixedId(prefix)` declara un `id` que se serializa con prefijo Base36 en lugar del
hex de 24 caracteres de mongo. Se desenmascara al leer y se enmascara al escribir.

```typescript
const ProjectModel = typebooxe(Type.Object({
  id  : PrefixedId("prj"),
  name: Type.String()
}, { $id: "Project" }))

new ProjectModel({ name: "x" }).cast().id  // ⇒ "prj_35qdq9mgpsa7alngckj"
```

## Auto-referencias (modelos recursivos)

Usa `Type.Recursive` para modelos que se referencian a sí mismos:

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

child.parent = parent._id  // no populado
result = child.cast()
// result.parent ⇒ { id: "abc123..." }
```

Múltiples auto-referencias en el mismo modelo:

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

Auto-referencias con arrays:

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

El `$id` va en `Type.Recursive`, no en el `Type.Object` interno — es quien define el `$ref` del `This`.

## Getters y Setters

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
