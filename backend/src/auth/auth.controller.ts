import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Patch,
  Delete,
  Param,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: { ip?: string; headers: { 'x-forwarded-for'?: string; 'x-real-ip'?: string } },
  ) {
    // Extract IP from request (handle proxy scenarios)
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
               req.headers['x-real-ip'] ||
               req.ip ||
               'unknown';
    return this.authService.login(loginDto, ip);
  }

  // Protected Route
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: { user: unknown }) {
    // req.user is automatically populated by the JwtStrategy's validate() method
    return {
      message: 'You have accessed a protected route successfully!',
      organization: req.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Request() req: { user: { id: string } },
    @Body() updateDto: UpdateUserDto,
  ) {
    const userId = req.user.id;
    return this.authService.updateProfile(userId, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Request()
    req: {
      user: { id: string };
      headers: { authorization?: string };
    },
    @Body() body: Record<string, string>,
  ) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    return this.authService.changePassword(
      req.user.id,
      body.oldPassword,
      body.newPassword,
      token,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Request()
    req: {
      user: { id: string };
      headers: { authorization?: string };
    },
  ) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    return this.authService.logout(req.user.id, token);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getSessions(@Request() req: { user: { id: string } }) {
    return this.authService.getSessions(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:sessionId')
  async revokeSession(
    @Request()
    req: { user: { id: string }; headers: { authorization?: string } },
    @Param('sessionId') sessionId: string,
  ) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    return this.authService.revokeSession(req.user.id, sessionId, token);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions')
  async revokeAllSessions(
    @Request()
    req: {
      user: { id: string };
      headers: { authorization?: string };
    },
  ) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    return this.authService.revokeAllSessions(req.user.id, token);
  }
}
