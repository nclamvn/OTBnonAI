import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../../common/guards/permissions.guard';

class LoginDto {
  @ApiProperty({ example: 'admin@dafc.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'dafc@2026' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

class RefreshDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto) {
    return {
      success: true,
      data: await this.authService.login(dto.email, dto.password),
    };
  }

  @Post('microsoft')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Login with Microsoft SSO token' })
  async loginWithMicrosoft(@Body() body: { msAccessToken: string }) {
    return {
      success: true,
      data: await this.authService.loginWithMicrosoft(body.msAccessToken),
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() dto: RefreshDto) {
    return {
      success: true,
      data: await this.authService.refresh(dto.refreshToken),
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout (audit log + client token cleanup)' })
  async logout(@Request() req: any) {
    return {
      success: true,
      data: await this.authService.logout(req.user.sub),
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: any) {
    return {
      success: true,
      data: await this.authService.getProfile(req.user.sub),
    };
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(@Request() req: any, @Body() body: { name?: string; phone?: string; department?: string }) {
    return {
      success: true,
      data: await this.authService.updateProfile(req.user.sub, body),
    };
  }

  @Delete('users/:id/erase')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('*') // Admin-only (wildcard permission)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'GDPR/PDPA data erasure — anonymize user PII (admin only)' })
  async eraseUser(@Param('id') id: string, @Request() req: any) {
    return {
      success: true,
      data: await this.authService.eraseUser(id, req.user.sub),
    };
  }
}
