import { typebooxe } from "./typebooxe"
export {
  type TypebooxeDocument,
  type TypebooxeModel,
  type TypebooxeOptions
} from "./types"

export { PrefixedId } from "./fields/prefixed-id"
export { ModelReference, ReferenceType } from "./fields/reference"
export { SelfReference } from './fields/self-reference'

export {
  typebooxePlugin,
  useModels
} from "./typebooxe"

export default typebooxe