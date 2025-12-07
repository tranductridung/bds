import { LoginDTO } from './dto/login.dto';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { SetupPasswordJwtGuard } from './guards/auth.guard';
import { SetupPasswordDto } from './dto/setup-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthenticationService } from './authentication.service';
import { Req, Res, Body, Post, Controller, UseGuards } from '@nestjs/common';

@Controller('authentication')
export class AuthController {
  constructor(
    private readonly authenticationService: AuthenticationService,
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

    return { accessToken, user };
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

    return { message: 'Logout success!' };
  }

  @Post('refresh')
  async refreshToken(@Req() req: Request) {
    const cookies = req.cookies as { refreshToken?: string };
    const refreshToken = cookies?.refreshToken;
    const accessToken = await this.authenticationService.refresh(refreshToken);

    return { accessToken };
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authenticationService.sendResetPasswordLink(email);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDTO: ResetPasswordDto) {
    return this.authenticationService.resetPassword(resetPasswordDTO);
  }

  @UseGuards(SetupPasswordJwtGuard)
  @Post('setup-password')
  async setupPassword(
    @Req() req: Request,
    @Body() setupPasswordDTO: SetupPasswordDto,
  ) {
    return this.authenticationService.setupPassword(
      Number(req.user?.id),
      setupPasswordDTO,
    );
  }

  @Post('resend-setup-password-email')
  async resendSetupPasswordEmail(@Body('email') email: string) {
    return this.authenticationService.resendSetupPasswordEmail(email);
  }
}
