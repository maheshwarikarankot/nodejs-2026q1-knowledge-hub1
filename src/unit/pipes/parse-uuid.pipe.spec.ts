import { describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe';
import { v4 as uuidv4, v1 as uuidv1, v3 as uuidv3, v5 as uuidv5 } from 'uuid';

describe('ParseUuidPipe', () => {
  let pipe: ParseUuidPipe;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParseUuidPipe],
    }).compile();

    pipe = module.get<ParseUuidPipe>(ParseUuidPipe);
  });

  describe('transform', () => {
    it('should return valid v4 UUID unchanged', () => {
      const validUuid = uuidv4();
      const result = pipe.transform(validUuid);

      expect(result).toBe(validUuid);
    });

    it('should accept multiple valid v4 UUIDs', () => {
      const uuids = [
        '550e8400-e29b-41d4-a716-446655440000',
        uuidv4(),
        uuidv4(),
      ];

      for (const uuid of uuids) {
        expect(() => pipe.transform(uuid)).not.toThrow();
      }
    });

    it('should throw BadRequestException for non-string input', () => {
      const invalidInputs = [
        null,
        undefined,
        123,
        {},
        [],
        true,
        false,
      ];

      for (const input of invalidInputs) {
        expect(() => pipe.transform(input as any)).toThrow(BadRequestException);
        expect(() => pipe.transform(input as any)).toThrow('ID must be a string');
      }
    });

    it('should throw BadRequestException for invalid UUID format', () => {
      const invalidUuids = [
        '',
        'not-a-uuid',
        '123',
        'abc-def-ghi',
        '550e8400-e29b-41d4-a716',
        '550e8400-e29b-41d4-a716-446655440000-extra',
        '550e8400xe29bx41d4xa716x446655440000',
        'gggggggg-gggg-gggg-gggg-gggggggggggg',
        '550e8400-e29b-41d4-a716-44665544000g',
      ];

      for (const uuid of invalidUuids) {
        expect(() => pipe.transform(uuid)).toThrow(BadRequestException);
        expect(() => pipe.transform(uuid)).toThrow('Invalid UUID format');
      }
    });

    it('should reject non-v4 UUIDs', () => {
      // Generate other UUID versions
      const v1Uuid = uuidv1();
      const v3Uuid = uuidv3('hello', uuidv3.DNS);
      const v5Uuid = uuidv5('hello', uuidv5.DNS);

      const nonV4Uuids = [v1Uuid, v3Uuid, v5Uuid];

      for (const uuid of nonV4Uuids) {
        expect(() => pipe.transform(uuid)).toThrow(BadRequestException);
        expect(() => pipe.transform(uuid)).toThrow('Invalid UUID format');
      }
    });

    it('should handle edge cases with malformed v4 UUIDs', () => {
      const malformedUuids = [
        '550e8400-e29b-31d4-a716-446655440000', // wrong version digit
        '550e8400-e29b-51d4-a716-446655440000', // wrong version digit
        '550e8400-e29b-41d4-1716-446655440000', // wrong variant bits
        '550e8400-e29b-41d4-c716-446655440000', // wrong variant bits
      ];

      for (const uuid of malformedUuids) {
        expect(() => pipe.transform(uuid)).toThrow(BadRequestException);
        expect(() => pipe.transform(uuid)).toThrow('Invalid UUID format');
      }
    });

    it('should handle whitespace and special characters', () => {
      const invalidUuids = [
        ' 550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440000 ',
        ' 550e8400-e29b-41d4-a716-446655440000 ',
        '550e8400-e29b-41d4-a716-446655440000\n',
        '550e8400-e29b-41d4-a716-446655440000\t',
      ];

      for (const uuid of invalidUuids) {
        expect(() => pipe.transform(uuid)).toThrow(BadRequestException);
        expect(() => pipe.transform(uuid)).toThrow('Invalid UUID format');
      }
    });

    it('should handle case sensitivity correctly', () => {
      const upperCaseUuid = '550E8400-E29B-41D4-A716-446655440000';
      const lowerCaseUuid = '550e8400-e29b-41d4-a716-446655440000';
      const mixedCaseUuid = '550E8400-e29b-41D4-a716-446655440000';

      // UUID validation should be case-insensitive
      expect(() => pipe.transform(upperCaseUuid)).not.toThrow();
      expect(() => pipe.transform(lowerCaseUuid)).not.toThrow();
      expect(() => pipe.transform(mixedCaseUuid)).not.toThrow();
    });

    it('should preserve original UUID string format', () => {
      const originalUuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = pipe.transform(originalUuid);

      expect(result).toBe(originalUuid);
      expect(typeof result).toBe('string');
    });

    it('should handle nil UUID (all zeros)', () => {
      const nilUuid = '00000000-0000-0000-0000-000000000000';
      
      // Nil UUID is not a valid v4 UUID
      expect(() => pipe.transform(nilUuid)).toThrow(BadRequestException);
      expect(() => pipe.transform(nilUuid)).toThrow('Invalid UUID format');
    });

    it('should validate UUID structure strictly', () => {
      // Test valid v4 UUID pattern: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      // where y is one of 8, 9, A, or B
      const strictlyValidV4Uuids = [
        '550e8400-e29b-41d4-8716-446655440000',
        '550e8400-e29b-41d4-9716-446655440000', 
        '550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-b716-446655440000',
      ];

      for (const uuid of strictlyValidV4Uuids) {
        expect(() => pipe.transform(uuid)).not.toThrow();
      }
    });
  });
});