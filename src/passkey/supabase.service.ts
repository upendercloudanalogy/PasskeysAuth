import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

@Injectable()
export class SupabaseService {
  public supabase: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);

  constructor() {
    this.logger.log("SUPABASE_URL:", process.env.SUPABASE_URL);
    this.logger.log("SUPABASE_KEY:", process.env.SUPABASE_KEY ? 'Set' : 'Not set');
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      throw new Error('Supabase URL and Key must be set in environment variables');
    }
    
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!
    );
  }

  async getUserById(id: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      this.logger.error('getUserById error:', error);
      throw new Error(error.message);
    }
    return data;
  }

  async createUserCredential(credential: any) {
    const { data, error } = await this.supabase
      .from('user_credentials')
      .insert([credential])
      .select()
      .single();
    
    if (error) {
      this.logger.error('createUserCredential error:', error);
      throw new Error(error.message);
    }
    return data;
  }

  async getCredentialById(credentialId: string) {
    const { data, error } = await this.supabase
      .from('user_credentials')
      .select('*, user:user_id(*)')
      .eq('credential_id', credentialId)
      .maybeSingle();
    
    if (error) {
      this.logger.error('getCredentialById error:', error);
      throw new Error(error.message);
    }
    return data;
  }

  async updateCredentialCounter(credentialId: string, newCounter: number) {
    const { data, error } = await this.supabase
      .from('user_credentials')
      .update({ counter: newCounter, updated_at: new Date().toISOString() })
      .eq('id', credentialId)
      .select()
      .single();
    
    if (error) {
      this.logger.error('updateCredentialCounter error:', error);
      throw new Error(error.message);
    }
    return data;
  }

  async getUserCredentials(userId: string) {
    const { data, error } = await this.supabase
      .from('user_credentials')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      this.logger.error('getUserCredentials error:', error);
      throw new Error(error.message);
    }
    return data;
  }

  async getUserByUsername(username: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle();
    
    if (error) {
      this.logger.error('getUserByUsername error:', error);
      throw new Error(error.message);
    }
    return data;
  }

  async createUser(user: any) {
    const { data, error } = await this.supabase
      .from('users')
      .insert([user])
      .select()
      .single();
    
    if (error) {
      this.logger.error('createUser error:', error);
      throw new Error(`Failed to create user: ${error.message}`);
    }
    return data;
  }

  async getUserByEmail(email: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    if (error) {
      this.logger.error('getUserByEmail error:', error);
      throw new Error(error.message);
    }
    return data;
  }

  async getUserByGithubId(githubId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('github_id', githubId)
      .maybeSingle();
    
    if (error) {
      this.logger.error('getUserByGithubId error:', error);
      throw new Error(error.message);
    }
    return data;
  }

  async createUserFromGithub(profile: {
    id: string;
    login: string;
    email?: string;
    name?: string;
    avatar_url?: string;
  }) {
    const { data, error } = await this.supabase
      .from('users')
      .insert([
        {
          id: crypto.randomUUID(),
          github_id: profile.id,
          username: profile.login,
          email: profile.email ?? null,
          display_name: profile.name ?? profile.login,
          avatar_url: profile.avatar_url,
        },
      ])
      .select()
      .single();

    if (error) {
      this.logger.error('createUserFromGithub error:', error);
      throw new Error(`Failed to create user from GitHub: ${error.message}`);
    }
    return data;
  }
}