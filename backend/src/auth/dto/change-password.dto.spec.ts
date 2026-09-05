import { validate } from 'class-validator';
import { ChangePasswordDto } from './change-password.dto';
import { isValidPassword, PASSWORD_MESSAGE } from './password.rules';

describe('password.rules', () => {
  it('accepts a valid password', () => {
    expect(isValidPassword('SecurePass1')).toBe(true);
  });

  it('rejects passwords missing required character classes', () => {
    expect(isValidPassword('short')).toBe(false);
    expect(isValidPassword('alllowercase1')).toBe(false);
    expect(isValidPassword('ALLUPPERCASE1')).toBe(false);
    expect(isValidPassword('NoNumbersHere')).toBe(false);
  });
});

describe('ChangePasswordDto', () => {
  it('rejects when new password matches current password', async () => {
    const dto = Object.assign(new ChangePasswordDto(), {
      currentPassword: 'OldPass123',
      newPassword: 'OldPass123',
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'newPassword')).toBe(true);
  });

  it('rejects weak new passwords', async () => {
    const dto = Object.assign(new ChangePasswordDto(), {
      currentPassword: 'OldPass123',
      newPassword: 'weak',
    });

    const errors = await validate(dto);
    const newPasswordError = errors.find((error) => error.property === 'newPassword');
    expect(newPasswordError).toBeDefined();
    expect(newPasswordError?.constraints?.matches).toBe(PASSWORD_MESSAGE);
  });

  it('accepts a valid password change payload', async () => {
    const dto = Object.assign(new ChangePasswordDto(), {
      currentPassword: 'OldPass123',
      newPassword: 'NewPass456',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
