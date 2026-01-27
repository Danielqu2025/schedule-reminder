/**
 * 表单验证工具函数
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * 验证邮箱格式
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: false, error: '邮箱不能为空' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: '请输入有效的邮箱地址' };
  }
  
  return { isValid: true };
}

/**
 * 验证密码强度
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: '密码不能为空' };
  }
  
  if (password.length < 6) {
    return { isValid: false, error: '密码长度至少为 6 位' };
  }
  
  return { isValid: true };
}

/**
 * 验证字符串长度
 */
export function validateLength(
  value: string,
  min: number,
  max: number,
  fieldName: string = '字段'
): ValidationResult {
  if (!value && min > 0) {
    return { isValid: false, error: `${fieldName}不能为空` };
  }
  
  if (value.length < min) {
    return { isValid: false, error: `${fieldName}长度至少为 ${min} 个字符` };
  }
  
  if (value.length > max) {
    return { isValid: false, error: `${fieldName}长度不能超过 ${max} 个字符` };
  }
  
  return { isValid: true };
}

/**
 * 验证日期范围
 */
export function validateDateRange(
  startDate: string,
  endDate: string
): ValidationResult {
  if (!startDate || !endDate) {
    return { isValid: true }; // 允许为空
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (end < start) {
    return { isValid: false, error: '结束日期不能早于开始日期' };
  }
  
  return { isValid: true };
}

/**
 * 验证时间范围（开始时间 < 结束时间）
 */
export function validateTimeRange(
  startTime: string,
  endTime: string
): ValidationResult {
  if (!startTime || !endTime) {
    return { isValid: true }; // 允许为空
  }
  
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  if (endMinutes <= startMinutes) {
    return { isValid: false, error: '结束时间必须晚于开始时间' };
  }
  
  return { isValid: true };
}

/**
 * 验证必填字段
 */
export function validateRequired(value: any, fieldName: string = '字段'): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName}为必填项` };
  }
  
  return { isValid: true };
}

/**
 * 验证数字范围
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number,
  fieldName: string = '数值'
): ValidationResult {
  if (value < min || value > max) {
    return { isValid: false, error: `${fieldName}必须在 ${min} 到 ${max} 之间` };
  }
  
  return { isValid: true };
}
