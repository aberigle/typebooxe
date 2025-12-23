import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { describe, expect, it } from "bun:test";
import mongoose from "mongoose";
import { typebooxe } from "../typebooxe";
import {
  PrefixedId,
  PrefixedIdType,
  maskId,
  unmaskId
} from "./prefixed-id";

describe('typebooxe', () => {
  describe('types', () => {

    describe('maskId and unmaskId', () => {
      it('should correctly mask a MongoDB ObjectId string to Base36', () => {
        const mongoId = "6585f1c2e4b0a123456789ab";
        const prefix = "prj";
        const result = maskId(mongoId, prefix);

        expect(result).toStartWith(prefix + "_");
        expect(result).not.toContain(mongoId);
      });

      it('should be reversible', () => {
        const originalId = "6585f1c2e4b0a123456789ab";
        const masked = maskId(originalId, "prj");
        const unmasked = unmaskId(masked);

        expect(unmasked).toBe(originalId);
      });

      it('should handle ObjectIds from mongoose', () => {
        const mongoId = new mongoose.Types.ObjectId();
        const masked = maskId(mongoId as any, "usr");

        expect(masked).toStartWith("usr_");
        expect(unmaskId(masked)).toBe(mongoId.toHexString());
      });

      it('should pad with zeros if the hex is short', () => {
        const shortHexId = "000000000000000000000abc";
        const masked = maskId(shortHexId, "test");
        const unmasked = unmaskId(masked);

        expect(unmasked).toBe(shortHexId);
        expect(unmasked.length).toBe(24);
      });
    });

    describe('PrefixedIdType', () => {
      const UserSchema = PrefixedIdType("usr");

      it('should validate correctly formatted IDs', () => {
        const validId = "usr_1kqy8z";
        expect(Value.Check(UserSchema, validId)).toBe(true)
      })

      it('should reject IDs with wrong prefix', () => {
        const invalidId = "prj_1kqy8z"
        expect(Value.Check(UserSchema, invalidId)).toBe(false)
      })

      it('should reject malformed IDs', () => {
        expect(Value.Check(UserSchema, "usr_")).toBe(false)
        expect(Value.Check(UserSchema, "usr-123")).toBe(false)
      })
    })

    describe('PrefixedId', () => {

      it('should transform IDs transparently during model casting', () => {

        const ProjectModel = typebooxe(Type.Object({
          id: PrefixedId("prj"),
          name: Type.String()
        }, { $id: 'Project' }));

        const instance = new ProjectModel({ name: "Test" });

        const result = instance.cast();
        expect(result.id).toStartWith("prj");
      })

    });
  })
})
