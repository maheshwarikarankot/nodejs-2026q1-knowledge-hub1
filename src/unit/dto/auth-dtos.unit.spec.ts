import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validate } from 'class-validator';
import { SignUpDto } from '../../auth/dto/signup.dto';
import { LoginDto } from '../../auth/dto/login.dto';

describe('Auth DTOs Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('SignUpDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = new SignUpDto();
      dto.login = 'john_doe';
      dto.password = 'strongPassword123';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when login is missing', async () => {
      const dto = new SignUpDto();
      dto.password = 'strongPassword123';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('login');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when login is empty string', async () => {
      const dto = new SignUpDto();
      dto.login = '';
      dto.password = 'strongPassword123';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('login');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when login is not a string', async () => {
      const dto = new SignUpDto();
      (dto as any).login = 123;
      dto.password = 'strongPassword123';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('login');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation when password is missing', async () => {
      const dto = new SignUpDto();
      dto.login = 'john_doe';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when password is empty string', async () => {
      const dto = new SignUpDto();
      dto.login = 'john_doe';
      dto.password = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when password is not a string', async () => {
      const dto = new SignUpDto();
      dto.login = 'john_doe';
      (dto as any).password = 12345;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation when both login and password are missing', async () => {
      const dto = new SignUpDto();

      const errors = await validate(dto);
      expect(errors).toHaveLength(2);

      const loginError = errors.find((e) => e.property === 'login');
      const passwordError = errors.find((e) => e.property === 'password');

      expect(loginError).toBeDefined();
      expect(loginError!.constraints).toHaveProperty('isNotEmpty');
      expect(passwordError).toBeDefined();
      expect(passwordError!.constraints).toHaveProperty('isNotEmpty');
    });

    it('should handle edge cases with special characters and whitespace', async () => {
      // Test cases that should fail validation
      const failureCases = [
        { login: '', password: 'validPass123' }, // empty login
        { login: 'valid_user', password: '' }, // empty password
        { login: '', password: '' }, // both empty
      ];

      for (const input of failureCases) {
        const dto = new SignUpDto();
        dto.login = input.login;
        dto.password = input.password;

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
      }

      // Test cases that should pass validation
      const successCases = [
        { login: '  valid_user  ', password: 'validPass123' }, // whitespace around valid input
        { login: 'user@domain.com', password: 'pass with spaces' }, // email as login, spaces in password
        { login: 'user!@#$%^&*()', password: '!@#$%^&*()_+{}|:"<>?[]\\;\',./' }, // special characters
      ];

      for (const input of successCases) {
        const dto = new SignUpDto();
        dto.login = input.login;
        dto.password = input.password;

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });
  });

  describe('LoginDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = new LoginDto();
      dto.login = 'john_doe';
      dto.password = 'strongPassword123';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when login is missing', async () => {
      const dto = new LoginDto();
      dto.password = 'strongPassword123';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('login');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when login is empty string', async () => {
      const dto = new LoginDto();
      dto.login = '';
      dto.password = 'strongPassword123';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('login');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when login is not a string', async () => {
      const dto = new LoginDto();
      (dto as any).login = true;
      dto.password = 'strongPassword123';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('login');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation when password is missing', async () => {
      const dto = new LoginDto();
      dto.login = 'john_doe';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when password is empty string', async () => {
      const dto = new LoginDto();
      dto.login = 'john_doe';
      dto.password = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when password is not a string', async () => {
      const dto = new LoginDto();
      dto.login = 'john_doe';
      (dto as any).password = [];

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation when both login and password are missing', async () => {
      const dto = new LoginDto();

      const errors = await validate(dto);
      expect(errors).toHaveLength(2);

      const loginError = errors.find((e) => e.property === 'login');
      const passwordError = errors.find((e) => e.property === 'password');

      expect(loginError).toBeDefined();
      expect(loginError!.constraints).toHaveProperty('isNotEmpty');
      expect(passwordError).toBeDefined();
      expect(passwordError!.constraints).toHaveProperty('isNotEmpty');
    });
  });
});
