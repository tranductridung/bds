import { ApiErrors } from './../common/decorators/error-response.decorator';
import {
  Get,
  Req,
  Res,
  Body,
  Post,
  Param,
  UseGuards,
  Controller,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBody,
  ApiParam,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';
import {
  FindTokenResponseDto,
  FindTokensResponseDto,
} from './dto/response/find-token.response.dto';
import { EmailDto } from './dto/email.dto';
import { LoginDTO } from './dto/login.dto';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { SetupPasswordDto } from './dto/setup-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthenticationService } from './authentication.service';
import { ApiResponseDto } from '../common/dtos/api-response.dto';
import { LoginResponseDto } from './dto/response/login.response.dto';
import { MessageResponseDto } from '../common/dtos/message-response';
import { RateLimit } from '../common/decorators/rate-limit.decorator';
import { ResponseService } from '../common/helpers/response.service';
import { AuthJwtGuard, SetupPasswordJwtGuard } from './guards/auth.guard';
import { RefreshTokenService } from './../refresh-token/refresh-token.service';
import { RefreshTokenResponseDto } from './dto/response/refresh-token.response.dto';

@ApiTags('Authentication')
@Controller('authentication')
export class AuthController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly configService: ConfigService,
  ) {}

  @RateLimit({ limit: 5, ttl: 60 })
  @ApiOperation({ summary: 'Log in and receive access and refresh tokens' })
  @ApiBody({ type: LoginDTO })
  @ApiOkResponse({
    type: ApiResponseDto<LoginResponseDto>(LoginResponseDto, true),
    description: 'Login successful',
  })
  @ApiErrors(400, 401)
  @Post('login')
  async login(
    @Req() req: Request,
    @Body() loginDto: LoginDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { email, password } = loginDto;

    const { accessToken, refreshToken, user } =
      await this.authenticationService.login(
        email,
        password,
        req.requestContext,
      );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge:
        Number(this.configService.get('MAX_AGE') || 7) * 24 * 60 * 60 * 1000,
    });

    return ResponseService.format({ accessToken, user });
  }

  @ApiOperation({
    summary: 'Log out and clear refresh token in cookie and database',
  })
  @ApiOkResponse({
    type: ApiResponseDto<MessageResponseDto>(MessageResponseDto),
    description: 'Logout successful',
  })
  @ApiErrors(401)
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

  @ApiOperation({
    summary: 'Refresh access token using stored refresh token cookie',
  })
  @ApiCookieAuth('refresh-token')
  @ApiOkResponse({
    type: ApiResponseDto<RefreshTokenResponseDto>(RefreshTokenResponseDto),
    description: 'New access token issued',
  })
  @ApiErrors(401)
  @Post('refresh')
  async refreshToken(@Req() req: Request) {
    const cookies = req.cookies as { refreshToken?: string };
    const refreshToken = cookies?.refreshToken;
    const accessToken = await this.authenticationService.refresh(refreshToken);

    return ResponseService.format(accessToken);
  }

  @ApiOperation({ summary: 'Send password reset link to the user email' })
  @ApiBody({ type: EmailDto })
  @ApiOkResponse({
    type: ApiResponseDto<MessageResponseDto>(MessageResponseDto),
    description: 'Password reset link sent',
  })
  @ApiErrors(400, 404)
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    await this.authenticationService.sendResetPasswordLink(email);

    return ResponseService.format({
      message: 'Reset link is sent to your email!',
    });
  }

  @ApiOperation({ summary: 'Reset password using a reset token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiOkResponse({
    type: ApiResponseDto<MessageResponseDto>(MessageResponseDto),
    description: 'Password reset successfully',
  })
  @ApiErrors(400)
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDTO: ResetPasswordDto) {
    await this.authenticationService.resetPassword(resetPasswordDTO);
    return ResponseService.format({ message: 'Reset password successfully!' });
  }

  @UseGuards(SetupPasswordJwtGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Set initial password for a new user' })
  @ApiBody({ type: SetupPasswordDto })
  @ApiErrors(401)
  @ApiOkResponse({
    type: ApiResponseDto<MessageResponseDto>(MessageResponseDto),
    description: 'Password setup successfully',
  })
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

  @ApiOperation({ summary: 'Resend setup password email' })
  @ApiBody({ type: EmailDto })
  @ApiOkResponse({
    type: ApiResponseDto<MessageResponseDto>(MessageResponseDto),
    description: 'Setup password email resent',
  })
  @ApiErrors(400, 404)
  @Post('resend-setup-password-email')
  async resendSetupPasswordEmail(@Body('email') email: string) {
    await this.authenticationService.resendSetupPasswordEmail(email);
    return ResponseService.format({
      message: 'A setup password link has been sent to your email!',
    });
  }

  @UseGuards(AuthJwtGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all stored refresh tokens' })
  @ApiOkResponse({
    type: ApiResponseDto<FindTokensResponseDto>(FindTokensResponseDto),
    description: 'Refresh tokens retrieved',
  })
  @ApiErrors(401)
  @Get('tokens')
  async findAllToken() {
    const tokens = await this.refreshTokenService.find();
    return ResponseService.format({ tokens });
  }

  @UseGuards(AuthJwtGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get refresh token details by token ID' })
  @ApiParam({
    name: 'tokenId',
    description: 'Refresh token identifier',
    type: 'string',
  })
  @ApiOkResponse({
    type: ApiResponseDto<FindTokenResponseDto>(FindTokenResponseDto),
    description: 'Get token by ID successfully',
  })
  @ApiErrors(404, 401)
  @Get('tokens/:tokenId')
  async findToken(@Param('tokenId') id: string) {
    const token = await this.refreshTokenService.findOne(id);
    return ResponseService.format({ token });
  }
}
