// src/auth/github.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  private clientId = process.env.GITHUB_CLIENT_ID;
  private clientSecret = process.env.GITHUB_CLIENT_SECRET;
  private backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

  getAuthUrl() {
    const scope = encodeURIComponent('read:user user:email');
    return `https://github.com/login/oauth/authorize?client_id=${this.clientId}&scope=${scope}&redirect_uri=${encodeURIComponent(
      `${this.backendUrl}/auth/github/callback`,
    )}&prompt=consent`;
  }

  async exchangeCodeForToken(code: string) {
    try {
      const resp = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          redirect_uri: `${this.backendUrl}/auth/github/callback`,
        },
        { 
          headers: { 
            Accept: 'application/json',
            'Content-Type': 'application/json'
          } 
        },
      );
      
      this.logger.debug('Token exchange response:', resp.data);
      return resp.data.access_token;
    } catch (error) {
      this.logger.error('Token exchange failed:', error.response?.data || error.message);
      throw new Error(`Failed to exchange code for token: ${error.message}`);
    }
  }

  async fetchGithubUser(accessToken: string) {
    try {
      const userResp = await axios.get('https://api.github.com/user', {
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json'
        },
      });
      
      this.logger.debug('GitHub user response:', userResp.data);
      
      let email = userResp.data.email;
      if (!email) {
        this.logger.debug('No primary email found, fetching emails...');
        const emailsResp = await axios.get('https://api.github.com/user/emails', {
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json'
          },
        });
        
        const primaryEmail = emailsResp.data.find((e: any) => e.primary && e.verified);
        email = primaryEmail?.email || (emailsResp.data[0]?.email ?? null);
        this.logger.debug('Emails fetched:', emailsResp.data);
      }
      
      return { 
        ...userResp.data, 
        email 
      };
    } catch (error) {
      this.logger.error('Fetch GitHub user failed:', error.response?.data || error.message);
      throw new Error(`Failed to fetch GitHub user: ${error.message}`);
    }
  }
}