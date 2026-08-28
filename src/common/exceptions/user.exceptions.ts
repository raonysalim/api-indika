import { NotFoundException, ConflictException } from '@nestjs/common';

export class UserNotFoundException extends NotFoundException {
  constructor() {
    super('User not found');
  }
}

export class EmailAlreadyVerifiedException extends ConflictException {
  constructor() {
    super('Email is already verified');
  }
}
