// // src/auth/auth.controller.ts
// import { Body, Controller, Post } from '@nestjs/common';
// import { PasskeyService } from './passkey.service';

// @Controller('auth')
// export class PasskeyController {
//   constructor(private readonly passkeyService: PasskeyService) {}

//   // Endpoint to start registration
//   @Post('register/start')
//   async startRegistration(@Body() body: { userId: string; username: string; displayName: string }) {
//     const options = await this.passkeyService.generateRegistrationOptions(
//       body.userId,
//       body.username,
//       body.displayName,
//     );
//     return options;
//   }

//   // Endpoint to finish registration
//   @Post('register/finish')
//   async finishRegistration(@Body() body: any) {
//     // Body should contain the entire response from navigator.credentials.create()
//     // The service now extracts userId from the challenge store
//     const result = await this.passkeyService.verifyRegistrationResponse(body);
//     return result;
//   }

//   // Endpoint to start authentication (login)
//   @Post('login/start')
//   async startLogin() {
//     const options = await this.passkeyService.generateAuthenticationOptions();
//     return options;
//   }

//   // Endpoint to finish authentication (login)
//   @Post('login/finish')
//   async finishLogin(@Body() body: any) {
//     // Body should contain the entire response from navigator.credentials.get()
//     const result = await this.passkeyService.verifyAuthenticationResponse(body);
//     if (result.verified) {
//       // Create a session or JWT token for the user and return it
//       // const token = await this.createSessionToken(result.user);
//       return { verified: true, user: result.user /*, token */ };
//     } else {
//       return { verified: false };
//     }
//   }
// }

// src/auth/passkey.controller.ts
// 
  // async githubCallback(@Query('code') code: string, @Res() res: Response) {
  //   try {
  //     const token = await this.githubService.exchangeCodeForToken(code);
  //     const gh = await this.githubService.fetchGithubUser(token);

  //     // Lookup user
  //     let user = await this.supabase.getUserByGithubId(String(gh.id));
  //     if (!user) {
  //       user = await this.supabase.createUser({
  //         id: crypto.randomUUID(),
  //         username: gh.login,
  //         display_name: gh.name || gh.login,
  //         email: gh.email,
  //         github_id: String(gh.id),
  //         avatar_url: gh.avatar_url,
  //       });
  //     }

  //     // JWT issue
  //     const jwtSecret = process.env.JWT_SECRET;
  //     if (!jwtSecret) throw new Error('JWT_SECRET must be set');

  //     const appToken = jwt.sign(
  //       { sub: user.id, username: user.username, provider: 'github' },
  //       jwtSecret,
  //       { expiresIn: '7d' },
  //     );

  //     res.cookie('app_token', appToken, {
  //       httpOnly: true,
  //       sameSite: 'lax',
  //       secure: process.env.NODE_ENV === 'production',
  //       path: '/',
  //       maxAge: 7 * 24 * 3600 * 1000,
  //     });

  //     const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
  //     return res.redirect(`${frontend}/home`);
  //   } catch (e: any) {
  //     console.error('GitHub OAuth error:', e.message, e);
  //     return res.status(500).send('GitHub authentication failed');
  //   }
  // }

// src/auth/passkey.controller.ts
import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PasskeyService } from './passkey.service';
import { GithubService } from './github.service';
import * as jwt from 'jsonwebtoken';
import { SupabaseService } from './supabase.service';
import * as crypto from 'crypto';
import { Logger } from '@nestjs/common';

// Define user interface
interface User {
  id: string;
  username: string;
  display_name?: string;
  email?: string;
  github_id?: string;
  avatar_url?: string;
  created_at?: string;
}

@Controller('auth')
export class PasskeyController {
  private readonly logger = new Logger(PasskeyController.name);

  constructor(
    private readonly passkeyService: PasskeyService,
    private readonly githubService: GithubService,
    private readonly supabase: SupabaseService,
  ) {}

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
    const result = await this.passkeyService.verifyAuthenticationResponse(body);
    if (result.verified) {
      return { verified: true, user: result.user };
    } else {
      return { verified: false };
    }
  }

  @Get('github')
  async githubStart(@Res() res: Response) {
    const url = this.githubService.getAuthUrl();
    return res.redirect(url);
  }

  @Get('github/callback')
  async githubCallback(@Query('code') code: string, @Res() res: Response) {
    try {
      this.logger.debug('GitHub callback received with code:', code);
      
      if (!code) {
        throw new Error('No authorization code provided');
      }

      const token = await this.githubService.exchangeCodeForToken(code);
      this.logger.debug('Access token received:', token ? 'Yes' : 'No');
      
      if (!token) {
        throw new Error('Failed to obtain access token');
      }

      const gh = await this.githubService.fetchGithubUser(token);
      this.logger.debug('GitHub user data:', gh);
      
      if (!gh || !gh.id) {
        throw new Error('Invalid GitHub user data received');
      }

      // Lookup user with proper typing
      let user: User | null = null;
      try {
        user = await this.supabase.getUserByGithubId(String(gh.id)) as User;
        this.logger.debug('User found in DB:', user ? user.id : 'None');
      } catch (error) {
        this.logger.warn('User lookup failed, might be first login:', error.message);
        // Continue to create user
      }
      
      if (!user) {
        try {
          user = await this.supabase.createUser({
            id: crypto.randomUUID(),
            username: gh.login,
            display_name: gh.name || gh.login,
            email: gh.email,
            github_id: String(gh.id),
            avatar_url: gh.avatar_url,
          }) as User;
          this.logger.debug('New user created:', user?.id);
        } catch (error) {
          this.logger.error('Failed to create user:', error.message);
          throw new Error(`Failed to create user: ${error.message}`);
        }
      }

      // Check if user was created successfully
      if (!user || !user.id) {
        throw new Error('User creation failed');
      }

      // JWT issue
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) throw new Error('JWT_SECRET must be set');

      const appToken = jwt.sign(
        { 
          sub: user.id, 
          username: user.username, 
          provider: 'github' 
        },
        jwtSecret,
        { expiresIn: '7d' },
      );

      res.cookie('app_token', appToken, {
        httpOnly: true,
        secure:false
      });

      const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
      this.logger.debug('Redirecting to frontend:', frontend);
      return res.redirect(`${frontend}/home`);
    } catch (e: any) {
      this.logger.error('GitHub OAuth error:', e.message, e.stack);
      const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontend}/login?error=github_auth_failed`);
    }
  }
}