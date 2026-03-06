import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    // Protected Route
    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req: { user: unknown }) {
        // req.user is automatically populated by the JwtStrategy's validate() method
        return {
            message: 'You have accessed a protected route successfully!',
            organization: req.user
        };
    }

    @UseGuards(JwtAuthGuard)
    @Post('change-password')
    async changePassword(@Request() req: { user: { id: string } }, @Body() body: Record<string, string>) {
        return this.authService.changePassword(req.user.id, body.oldPassword, body.newPassword);
    }
}
