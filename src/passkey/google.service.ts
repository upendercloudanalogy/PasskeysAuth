// src/auth/google.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as querystring from 'querystring';

@Injectable()
export class GoogleService {
  private clientId = process.env.GOOGLE_CLIENT_ID!;
  private clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  private redirectUri = process.env.BACKEND_URL + '/auth/google/callback';

  getAuthUrl() {
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
      redirect_uri: this.redirectUri,
      client_id: this.clientId,
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      scope: [
        'openid',
        'profile',
        'email'
      ].join(' ')
    };
    return `${rootUrl}?${querystring.stringify(options)}`;
  }

  async exchangeCodeForToken(code: string) {
    const url = 'https://oauth2.googleapis.com/token';
    const { data } = await axios.post(url, querystring.stringify({
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      grant_type: 'authorization_code',
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    return data;
  }

  async fetchGoogleUser(idToken: string, accessToken: string) {
    // Decode profile info
    const { data } = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${accessToken}`,
      { headers: { Authorization: `Bearer ${idToken}` } }
    );
    return data;
  }
}
