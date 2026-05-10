import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validate } from 'class-validator';
import { CreateCategoryDto } from '../../category/dto/create-category.dto';

describe('Category DTOs Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('CreateCategoryDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = new CreateCategoryDto();
      dto.name = 'Programming';
      dto.description = 'All about programming languages and frameworks';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with just name (description is optional)', async () => {
      const dto = new CreateCategoryDto();
      dto.name = 'Technology';
      dto.description = 'Some description'; // description is required per DTO definition

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when name is missing', async () => {
      const dto = new CreateCategoryDto();
      dto.description = 'Some description';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when name is empty string', async () => {
      const dto = new CreateCategoryDto();
      dto.name = '';
      dto.description = 'Some description';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when name is not a string', async () => {
      const dto = new CreateCategoryDto();
      (dto as any).name = 123;
      dto.description = 'Some description';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation when description is empty string', async () => {
      const dto = new CreateCategoryDto();
      dto.name = 'Technology';
      dto.description = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when description is not a string', async () => {
      const dto = new CreateCategoryDto();
      dto.name = 'Technology';
      (dto as any).description = 456;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation with multiple invalid fields', async () => {
      const dto = new CreateCategoryDto();
      (dto as any).name = 123;
      dto.description = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(2);

      const nameError = errors.find((e) => e.property === 'name');
      const descriptionError = errors.find((e) => e.property === 'description');

      expect(nameError).toBeDefined();
      expect(nameError!.constraints).toHaveProperty('isString');
      expect(descriptionError).toBeDefined();
      expect(descriptionError!.constraints).toHaveProperty('isNotEmpty');
    });

    it('should handle null values correctly', async () => {
      const dto = new CreateCategoryDto();
      (dto as any).name = null;
      (dto as any).description = null;

      const errors = await validate(dto);
      expect(errors).toHaveLength(2);

      const nameError = errors.find((e) => e.property === 'name');
      const descriptionError = errors.find((e) => e.property === 'description');

      expect(nameError).toBeDefined();
      expect(descriptionError).toBeDefined();
    });

    it('should handle undefined values correctly', async () => {
      const dto = new CreateCategoryDto();
      // name and description are undefined by default

      const errors = await validate(dto);
      expect(errors).toHaveLength(2); // Both name and description are required

      const nameError = errors.find((e) => e.property === 'name');
      const descriptionError = errors.find((e) => e.property === 'description');

      expect(nameError).toBeDefined();
      expect(nameError!.constraints).toHaveProperty('isNotEmpty');
      expect(descriptionError).toBeDefined();
      expect(descriptionError!.constraints).toHaveProperty('isNotEmpty');
    });
  });
});
