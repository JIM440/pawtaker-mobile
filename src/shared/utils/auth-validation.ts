export function validateRequired(value: string): boolean {
  return value.trim().length > 0;
}

export function validatePassword(value: string): boolean {
  return value.length >= 8;
}

export function validatePasswordMatch(
  password: string,
  confirmPassword: string,
): boolean {
  return confirmPassword.length > 0 && password === confirmPassword;
}
