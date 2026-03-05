import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    login(@Body() body: any) {
        return this.authService.validateUser(body.email, body.password).then(user => {
            return this.authService.login(user);
        });
    }
}
