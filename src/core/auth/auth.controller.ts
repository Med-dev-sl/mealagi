import { Controller, Post, Body, Req, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from "@nestjs/swagger";
import { Request } from "express";
import { AuthService } from "./auth.service";
import { Public } from "../../shared/decorators/public.decorator";
import { LoginDto } from "./dto/login.dto";
import { LoginResponseDto } from "./dto/login-response.dto";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Authenticate user with email and password" })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: "Login successful",
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: "Invalid email or password" })
  @ApiResponse({ status: 403, description: "Account or organization is not active" })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
  ): Promise<LoginResponseDto> {
    const ipAddress = req.ip;
    const userAgent = req.headers["user-agent"];
    return this.authService.login(dto, ipAddress, userAgent);
  }
}
