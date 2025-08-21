import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  public supabase: SupabaseClient;

  constructor() {
    console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
  console.log("SUPABASE_KEY:", process.env.SUPABASE_KEY);
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
    if (error) throw new Error(error.message);
    return data;
  }




  async createUserCredential(credential: any) {
    const { data, error } = await this.supabase
      .from('user_credentials')
      .insert([credential]);
    if (error) throw new Error(error.message);
    return data;
  }

  async getCredentialById(credentialId: string) {
    const { data, error } = await this.supabase
      .from('user_credentials')
      .select('*, user:user_id(*)') // Join user data
      .eq('credential_id', credentialId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async updateCredentialCounter(credentialId: string, newCounter: number) {
    const { data, error } = await this.supabase
      .from('user_credentials')
      .update({ counter: newCounter, updated_at: new Date().toISOString() })
      .eq('id', credentialId);
    if (error) throw new Error(error.message);
    return data;
  }

  // ... other methods like getUserCredentials, createUser, etc.
    async getUserCredentials(userId: string) {
        const { data, error } = await this.supabase
        .from('user_credentials')
        .select('*')
        .eq('user_id', userId);
        if (error) throw new Error(error.message);
        return data;
    }
    async getUserByUsername(username: string) {
        const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle();
        if (error) throw new Error(error.message);
        return data;
    }
    async createUser(user: any) {
        const { data, error } = await this.supabase
        .from('users')
        .insert([user]);
        if (error) throw new Error(error.message);
        return data;
    }
    async getUserByEmail(email: string) {
        const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();
        if (error) throw new Error(error.message);
        return data;
    }
}