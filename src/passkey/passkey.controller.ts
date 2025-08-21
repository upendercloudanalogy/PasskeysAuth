// src/auth/auth.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { PasskeyService } from './passkey.service';

@Controller('auth')
export class PasskeyController {
  constructor(private readonly passkeyService: PasskeyService) {}

  // Endpoint to start registration
  @Post('register/start')
  async startRegistration(@Body() body: { userId: string; username: string; displayName: string }) {
    const options = await this.passkeyService.generateRegistrationOptions(
      body.userId,
      body.username,
      body.displayName,
    );
    return options;
  }

  // Endpoint to finish registration
  @Post('register/finish')
  async finishRegistration(@Body() body: any) {
    // Body should contain the entire response from navigator.credentials.create()
    // The service now extracts userId from the challenge store
    const result = await this.passkeyService.verifyRegistrationResponse(body);
    return result;
  }

  // Endpoint to start authentication (login)
  @Post('login/start')
  async startLogin() {
    const options = await this.passkeyService.generateAuthenticationOptions();
    return options;
  }

  // Endpoint to finish authentication (login)
  @Post('login/finish')
  async finishLogin(@Body() body: any) {
    // Body should contain the entire response from navigator.credentials.get()
    const result = await this.passkeyService.verifyAuthenticationResponse(body);
    if (result.verified) {
      // Create a session or JWT token for the user and return it
      // const token = await this.createSessionToken(result.user);
      return { verified: true, user: result.user /*, token */ };
    } else {
      return { verified: false };
    }
  }
}