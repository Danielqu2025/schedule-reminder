/**
 * Tests for validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePassword,
  validateLength,
  validateDateRange,
  validateRequired,
  validateNumberRange,
} from '../utils/validation';

describe('validation utilities', () => {
  describe('validateEmail', () => {
    it('should return valid result for valid email', () => {
      const result = validateEmail('test@example.com');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error for invalid email', () => {
      const result = validateEmail('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('请输入有效的邮箱地址');
    });

    it('should return error for empty email', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('邮箱不能为空');
    });
  });

  describe('validatePassword', () => {
    it('should return valid result for strong password', () => {
      const result = validatePassword('Password123!');
      expect(result.isValid).toBe(true);
    });

    it('should return error for short password', () => {
      const result = validatePassword('123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('密码长度至少为 6 位');
    });

    it('should return error for empty password', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('密码不能为空');
    });
  });

  describe('validateLength', () => {
    it('should return valid result for within bounds', () => {
      const result = validateLength('test', 1, 10, '测试');
      expect(result.isValid).toBe(true);
    });

    it('should return error for too short', () => {
      const result = validateLength('test', 5, 10, '测试');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('测试长度至少为 5 个字符');
    });

    it('should return error for too long', () => {
      const result = validateLength('test'.repeat(5), 1, 10, '测试');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('测试长度不能超过 10 个字符');
    });
  });

  describe('validateDateRange', () => {
    it('should return valid result for valid range', () => {
      const result = validateDateRange('2024-01-01', '2024-12-31');
      expect(result.isValid).toBe(true);
    });

    it('should return error for invalid range', () => {
      const result = validateDateRange('2024-12-31', '2024-01-01');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('结束日期不能早于开始日期');
    });

    it('should return valid for empty dates', () => {
      const result = validateDateRange('', '');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateRequired', () => {
    it('should return valid result for non-empty string', () => {
      const result = validateRequired('test', '字段');
      expect(result.isValid).toBe(true);
    });

    it('should return error for empty string', () => {
      const result = validateRequired('', '字段');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('字段为必填项');
    });

    it('should return error for null', () => {
      const result = validateRequired(null, '字段');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('字段为必填项');
    });
  });

  describe('validateNumberRange', () => {
    it('should return valid result for within bounds', () => {
      const result = validateNumberRange(50, 0, 100, '数值');
      expect(result.isValid).toBe(true);
    });

    it('should return error for too small', () => {
      const result = validateNumberRange(-1, 0, 100, '数值');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('数值必须在 0 到 100 之间');
    });

    it('should return error for too large', () => {
      const result = validateNumberRange(150, 0, 100, '数值');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('数值必须在 0 到 100 之间');
    });
  });
});
