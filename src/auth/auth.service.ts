import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ResetPasswordDto } from './dto/reset-Password.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async resetPassword(id: number, resetPasswordDto: ResetPasswordDto) {
    const user = await this.userService.findOne(id);

    if (!user) {
      throw new ForbiddenException({
        message: `User whit id: ${id} not found`,
      });
    }

    if (await bcrypt.compare(resetPasswordDto.newPassword, user.password)) {
      await this.userService.updatePassword(id, resetPasswordDto.newPassword);
    }

    throw new BadRequestException({ message: 'Old password is wrong' });
  }

  register(createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new BadRequestException({
        message: `User with email: ${email} not exists`,
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const { password, ...result } = user;

      return result;
    }

    throw new BadRequestException({ message: 'Password is wrong' });
  }

  async login(user: LoginDto) {
    const exist = await this.validateUser(user.email, user.password);

    if (!exist) {
      throw new BadRequestException({ message: 'Wrong credentials!' });
    }

    const payload = { email: exist.email, id: exist.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
