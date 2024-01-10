import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { BasicTokenGuard } from './guard/basic-token.guard';
import { RefreshTokenGuard } from './guard/bearer-token.guard';
import { RegisterUserDto } from './dto/register-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('token/access')
  @UseGuards(RefreshTokenGuard)
  createTokenAccess(@Headers('authorization') rawToken: string) {
    const token = this.authService.extractTokenFromHeader(rawToken, true);

    const newToken = this.authService.rotateToken(token, false);

    // { accessToken: { token } } 이런식으로 반환할꺼.
    return {
      accessToken: newToken,
    };
  }

  @Post('token/refresh')
  @UseGuards(RefreshTokenGuard)
  createTokenRefresh(@Headers('authorization') rawToken: string) {
    const token = this.authService.extractTokenFromHeader(rawToken, true);

    const newToken = this.authService.rotateToken(token, true);

    // { refreshToken: { token } } 이런식으로 반환할꺼.
    return {
      refreshToken: newToken,
    };
  }

  // 로그인 end point
  @Post('login/email')
  @UseGuards(BasicTokenGuard)
  loginWithEmail(@Headers('authorization') rawToken: string) {
    // email:password -> base64로 encoding
    // sddsdwsdfdsfdsdf:wjkdkwljdj -> email:password 로 변환.
    /** extractTokenFromHeader()함수에서 'Basic'or'Bearer' prefix 날려보냄 */
    const token = this.authService.extractTokenFromHeader(rawToken, false);

    const credentials = this.authService.decodeBasicToken(token);

    return this.authService.loginWithEmail(credentials);
  }

  // 회원가입 end point
  @Post('register/email')
  registerWithEmail(@Body() body: RegisterUserDto) {
    const { nickname, email, password } = body;
    return this.authService.registerWithEmail({ nickname, email, password });
  }
}
