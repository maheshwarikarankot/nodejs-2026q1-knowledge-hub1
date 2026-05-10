import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validate } from 'class-validator';
import { CreateUserDto } from '../../../src/user/dto/create-user.dto';
import { UserRole } from '../../../src/common/enums';

describe('User DTOs Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('CreateUserDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = new CreateUserDto();
      dto.login = 'john_doe';
      dto.password = 'strongPassword123';
      dto.role = UserRole.EDITOR;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with valid data and default role', async () => {
      const dto = new CreateUserDto();
      dto.login = 'jane_doe';
      dto.password = 'anotherPassword456';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when login is missing', async () => {
      const dto = new CreateUserDto();
      dto.password = 'strongPassword123';
      dto.role = UserRole.VIEWER;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('login');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when login is empty string', async () => {
      const dto = new CreateUserDto();
      dto.login = '';
      dto.password = 'strongPassword123';
      dto.role = UserRole.VIEWER;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('login');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when login is not a string', async () => {
      const dto = new CreateUserDto();
      (dto as any).login = 123;
      dto.password = 'strongPassword123';
      dto.role = UserRole.VIEWER;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('login');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation when password is missing', async () => {
      const dto = new CreateUserDto();
      dto.login = 'john_doe';
      dto.role = UserRole.VIEWER;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when password is empty string', async () => {
      const dto = new CreateUserDto();
      dto.login = 'john_doe';
      dto.password = '';
      dto.role = UserRole.VIEWER;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when password is not a string', async () => {
      const dto = new CreateUserDto();
      dto.login = 'john_doe';
      (dto as any).password = 12345;
      dto.role = UserRole.VIEWER;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation with invalid enum role', async () => {
      const dto = new CreateUserDto();
      dto.login = 'john_doe';
      dto.password = 'strongPassword123';
      (dto as any).role = 'invalid_role';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('role');
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('should fail validation with invalid enum role type', async () => {
      const dto = new CreateUserDto();
      dto.login = 'john_doe';
      dto.password = 'strongPassword123';
      (dto as any).role = 123;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('role');
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('should pass validation for all valid UserRole enum values', async () => {
      const validRoles = [UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER];
      
      for (const role of validRoles) {
        const dto = new CreateUserDto();
        dto.login = 'test_user';
        dto.password = 'testPassword123';
        dto.role = role;

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('should fail validation when both login and password are missing', async () => {
      const dto = new CreateUserDto();
      dto.role = UserRole.VIEWER;

      const errors = await validate(dto);
      expect(errors).toHaveLength(2);
      
      const loginError = errors.find(e => e.property === 'login');
      const passwordError = errors.find(e => e.property === 'password');
      
      expect(loginError).toBeDefined();
      expect(loginError!.constraints).toHaveProperty('isNotEmpty');
      expect(passwordError).toBeDefined();
      expect(passwordError!.constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation with multiple invalid fields', async () => {
      const dto = new CreateUserDto();
      dto.login = '';
      dto.password = '';
      (dto as any).role = 'invalid_enum';

      const errors = await validate(dto);
      expect(errors).toHaveLength(3);
      
      const loginError = errors.find(e => e.property === 'login');
      const passwordError = errors.find(e => e.property === 'password');
      const roleError = errors.find(e => e.property === 'role');
      
      expect(loginError).toBeDefined();
      expect(loginError!.constraints).toHaveProperty('isNotEmpty');
      expect(passwordError).toBeDefined();
      expect(passwordError!.constraints).toHaveProperty('isNotEmpty');
      expect(roleError).toBeDefined();
      expect(roleError!.constraints).toHaveProperty('isEnum');
    });

    it('should handle edge cases for duplicate user scenarios', async () => {
      // Test common duplicate login patterns
      const duplicateLogins = [
        'admin',
        'administrator', 
        'root',
        'user',
        'test',
        'guest',
      ];

      for (const login of duplicateLogins) {
        const dto = new CreateUserDto();
        dto.login = login;
        dto.password = 'validPassword123';
        dto.role = UserRole.VIEWER;

        const errors = await validate(dto);
        // DTO validation itself should pass - duplicate checking happens at service level
        expect(errors).toHaveLength(0);
      }
    });

    it('should handle edge cases with various login formats', async () => {
      const loginFormats = [
        'user123',
        'user_name',
        'user-name',
        'user.name',
        'user@domain.com', // email format
        'User123', // mixed case
        'u', // single character
        'very_long_username_that_might_exceed_normal_limits_but_should_still_validate',
      ];

      for (const login of loginFormats) {
        const dto = new CreateUserDto();
        dto.login = login;
        dto.password = 'validPassword123';
        dto.role = UserRole.EDITOR;

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });
  });
});