import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  public login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('register')
  public register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }
}
