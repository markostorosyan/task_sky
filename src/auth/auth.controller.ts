import { Body, Controller, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResetPasswordDto } from './dto/reset-Password.dto';
import { AuthGuard } from '@nestjs/passport';

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

  @ApiBearerAuth()
  @Patch('password')
  @UseGuards(AuthGuard('jwt'))
  public restPassword(@Req() req, @Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(req.user.userId, body);
  }
}
