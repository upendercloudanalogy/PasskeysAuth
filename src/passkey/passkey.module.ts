import { Module } from '@nestjs/common';
import { PasskeyService } from './passkey.service';
import { PasskeyController } from './passkey.controller';
import { SupabaseService } from './supabase.service';

@Module({
  providers: [PasskeyService, SupabaseService],
  controllers: [PasskeyController],
})
export class PasskeyModule {}
