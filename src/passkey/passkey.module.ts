import { Module } from '@nestjs/common';
import { PasskeyService } from './passkey.service';
import { PasskeyController } from './passkey.controller';
import { SupabaseService } from './supabase.service';
import { GithubService } from './github.service';
import { GoogleService } from './google.service';

@Module({
  providers: [PasskeyService, SupabaseService, GithubService, GoogleService],
  controllers: [PasskeyController],
})
export class PasskeyModule {}
