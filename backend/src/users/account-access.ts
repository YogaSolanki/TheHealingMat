import { UnauthorizedException } from '@nestjs/common';
import { AccountStatus } from './enums/account-status.enum';
import { User } from './user.entity';

export function isAccountInactive(user: Pick<User, 'accountStatus'>) {
  return user.accountStatus === AccountStatus.Inactive;
}

export function assertUserAccountActive(user: Pick<User, 'accountStatus'>) {
  if (isAccountInactive(user)) {
    throw new UnauthorizedException(
      'This account has been deactivated. Please contact support if you need access restored.',
    );
  }
}
