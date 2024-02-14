import { NotFoundException } from '@nestjs/common';

export class UserNotFoundExceptions extends NotFoundException {
  constructor() {
    super('error.userNotFound');
  }
}
