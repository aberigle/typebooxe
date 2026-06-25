import { Type } from '@sinclair/typebox';
import { ObjectId } from 'mongoose';

const PrefixedIdPattern = (prefix: string) => `^${prefix}_[a-z0-9]+$`;

export const PrefixedIdType = (prefix: string) =>
  Type.String({
    pattern: PrefixedIdPattern(prefix),
    examples: [`${prefix}_35qdq9mgpsa7alngckj`],
    default: `${prefix}_000000000000000000000000`
  })

export const PrefixedId = (prefix: string) => Type.Transform(PrefixedIdType(prefix))
  .Decode(value => unmaskId(value))
  .Encode(value => maskId(value, prefix))

export function maskId(objectId: ObjectId | string, prefix: string) {
  const hex = objectId.toString();

  const base36 = BigInt(`0x${hex}`).toString(36);

  return `${prefix}_${base36}`;
}

export function unmaskId(masked: string) {
  const [, value] = masked.split('_');

  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  let bigIntValue = BigInt(0);
  for (const char of value.toLowerCase()) {
    bigIntValue = bigIntValue * BigInt(36) + BigInt(chars.indexOf(char));
  }

  let hex = bigIntValue.toString(16);
  return hex.padStart(24, '0');
}