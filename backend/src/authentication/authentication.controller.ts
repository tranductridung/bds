import {
  Get,
  Req,
  Res,
  Body,
  Post,
  Controller,
  UseGuards,
} from '@nestjs/common';
import { LoginDTO } from './dto/login.dto';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { SetupPasswordDto } from './dto/setup-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthenticationService } from './authentication.service';
import { ResponseService } from '../common/helpers/response.service';
import { AuthJwtGuard, SetupPasswordJwtGuard } from './guards/auth.guard';
import { RefreshTokenService } from './../refresh-token/refresh-token.service';

@Controller('authentication')
export class AuthController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  async login(
    @Req() req: Request,
    @Body() loginDto: LoginDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { email, password } = loginDto;

    const { accessToken, refreshToken, user } =
      await this.authenticationService.login(email, password);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge:
        Number(this.configService.get('MAX_AGE') || 7) * 24 * 60 * 60 * 1000,
    });

    return ResponseService.format({ accessToken, user });
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookies = req.cookies as { refreshToken?: string };
    const refreshToken = cookies?.refreshToken;

    if (refreshToken) {
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      });

      await this.authenticationService.logout(refreshToken);
    }

    return ResponseService.format({ message: 'Logout successfully!' });
  }

  @Post('refresh')
  async refreshToken(@Req() req: Request) {
    const cookies = req.cookies as { refreshToken?: string };
    const refreshToken = cookies?.refreshToken;
    const accessToken = await this.authenticationService.refresh(refreshToken);

    return ResponseService.format(accessToken);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    await this.authenticationService.sendResetPasswordLink(email);

    return ResponseService.format({
      message: 'Reset link is sent to your email!',
    });
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDTO: ResetPasswordDto) {
    await this.authenticationService.resetPassword(resetPasswordDTO);
    return ResponseService.format({ message: 'Reset password successfully!' });
  }

  @UseGuards(SetupPasswordJwtGuard)
  @Post('setup-password')
  async setupPassword(
    @Req() req: Request,
    @Body() setupPasswordDTO: SetupPasswordDto,
  ) {
    await this.authenticationService.setupPassword(
      Number(req.user?.id),
      setupPasswordDTO,
    );

    return ResponseService.format({ message: 'Setup password successfully!' });
  }

  @Post('resend-setup-password-email')
  async resendSetupPasswordEmail(@Body('email') email: string) {
    await this.authenticationService.resendSetupPasswordEmail(email);
    return ResponseService.format({
      message: 'A setup password link has been sent to your email!',
    });
  }

  @UseGuards(AuthJwtGuard)
  @Get('tokens')
  async findAllToken() {
    const tokens = await this.refreshTokenService.find();
    return tokens;
  }

  @UseGuards(AuthJwtGuard)
  @Get('tokens/:tokenId')
  async findToken(id: string) {
    const token = await this.refreshTokenService.findOne(id);
    return token;
  }
}
