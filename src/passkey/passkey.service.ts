// src/auth/passkey.service.ts
import { Injectable } from '@nestjs/common';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { SupabaseService } from './supabase.service';

// RP ID (domain) must match frontend domain (e.g., example.com)
// In dev, your frontend is likely http://localhost:3000
const rpID = process.env.RP_ID || 'localhost';
const expectedOrigin =
  process.env.NODE_ENV === 'production'
    ? `https://${rpID}`
    : `http://${rpID}:5173`;

interface StoredChallenge {
  challenge: string;
  userId?: string; // userId is optional for authentication
}

@Injectable()
export class PasskeyService {
  private challengeStore = new Map<string, StoredChallenge>();

  constructor(private readonly supabase: SupabaseService) {}

  /** Store challenge with expiration */
  private setChallenge(key: string, challenge: string, userId?: string) {
    this.challengeStore.set(key, { challenge, userId });
    setTimeout(() => this.challengeStore.delete(key), 5 * 60 * 1000); // 5 min TTL
  }

  /** Retrieve challenge */
  private getChallenge(key: string): StoredChallenge | undefined {
    return this.challengeStore.get(key);
  }

  /** Generate options for registering a new passkey */
  async generateRegistrationOptions(userId: string, userName: string, displayName: string) {
    let user = await this.supabase.getUserById(userId);

    if (!user) {
      const existingUser = await this.supabase.getUserByUsername(userName);
      if (existingUser) throw new Error('Username already taken');

      user = await this.supabase.createUser({
        id: userId,
        username: userName,
        display_name: displayName,
      });
    }

    const userCredentials = await this.supabase.getUserCredentials(userId);

    const options = await generateRegistrationOptions({
      rpName: 'Your App Name',
      rpID,
      userID: new TextEncoder().encode(userId),
      userName,
      userDisplayName: displayName,
      excludeCredentials: userCredentials.map((cred) => ({
        id: cred.credential_id,
        transports: cred.transports,
      })),
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
      },
    });

    // Store challenge with a unique key based on the challenge itself
    const challengeKey = `reg_${options.challenge}`;
    this.setChallenge(challengeKey, options.challenge, userId);
    
    return options;
  }

  /** Verify registration response and persist credential */
//   async verifyRegistrationResponse(body: any) {
//     // Extract the challenge from the response
//     const clientDataJSON = JSON.parse(
//       Buffer.from(body.response.clientDataJSON, 'base64').toString('utf8'),
//     );
//     const responseChallengeB64Url: string = clientDataJSON.challenge;

//     // Retrieve the stored challenge and userId using the challenge as key
//     const storedData = this.getChallenge(`reg_${responseChallengeB64Url}`);
//     if (!storedData) {
//       throw new Error('No challenge found for registration');
//     }

//     const { challenge: expectedChallenge, userId } = storedData;

//     let verification;
//     try {
//       verification = await verifyRegistrationResponse({
//         response: body,
//         expectedChallenge,
//         expectedOrigin,
//         expectedRPID: rpID,
//       });
//     } catch (error: any) {
//       console.error('Verification failed', error);
//       throw new Error(`Registration verification failed: ${error.message}`);
//     }

//     const { verified, registrationInfo } = verification;

// if (verified && registrationInfo) {
//   const newCredential = {
//     user_id: userId,
//     credential_id: registrationInfo.credentialID
//       ? Buffer.from(registrationInfo.credentialID).toString('base64url')
//       : null,
//     public_key: registrationInfo.credentialPublicKey
//       ? Buffer.from(registrationInfo.credentialPublicKey).toString('base64url')
//       : null,
//     counter: registrationInfo.counter ?? 0,
//     device_type: registrationInfo.credentialDeviceType ?? null,
//     backed_up: registrationInfo.credentialBackedUp ?? false,
//     transports: body?.response?.transports ?? null,
//   };

//   if (!newCredential.credential_id || !newCredential.public_key) {
//     throw new Error('Incomplete registrationInfo from authenticator');
//   }

//   await this.supabase.createUserCredential(newCredential);

//   this.challengeStore.delete(`reg_${userId}`);
// }


//     return { verified };
//   }

/** Verify registration response and persist credential */
// async verifyRegistrationResponse(body: any) {
//   // Extract the challenge from the response
//   const clientDataJSON = JSON.parse(
//     Buffer.from(body.response.clientDataJSON, 'base64').toString('utf8'),
//   );
//   const responseChallengeB64Url: string = clientDataJSON.challenge;

//   // Retrieve the stored challenge and userId using the challenge as key
//   const storedData = this.getChallenge(`reg_${responseChallengeB64Url}`);
//   if (!storedData) {
//     throw new Error('No challenge found for registration');
//   }

//   const { challenge: expectedChallenge, userId } = storedData;

//   let verification;
//   try {
//     verification = await verifyRegistrationResponse({
//       response: body,
//       expectedChallenge,
//       expectedOrigin,
//       expectedRPID: rpID,
//       requireUserVerification: false, // Add this to be more lenient
//     });
//   } catch (error: any) {
//     console.error('Verification failed', error);
//     throw new Error(`Registration verification failed: ${error.message}`);
//   }

//   const { verified, registrationInfo } = verification;

//   if (verified && registrationInfo) {
//     // Check if registrationInfo has the required fields
//     if (!registrationInfo.credentialID || !registrationInfo.credentialPublicKey) {
//       console.error('Incomplete registrationInfo:', registrationInfo);
//       throw new Error('Incomplete registrationInfo from authenticator');
//     }

//     const newCredential = {
//       user_id: userId,
//       credential_id: Buffer.from(registrationInfo.credentialID).toString('base64url'),
//       public_key: Buffer.from(registrationInfo.credentialPublicKey).toString('base64url'),
//       counter: registrationInfo.counter ?? 0,
//       device_type: registrationInfo.credentialDeviceType ?? 'singleDevice',
//       backed_up: registrationInfo.credentialBackedUp ?? false,
//       transports: body.transports ?? [],
//     };

//     await this.supabase.createUserCredential(newCredential);

//     // Clean up - use the correct key (based on challenge, not userId)
//     this.challengeStore.delete(`reg_${responseChallengeB64Url}`);
//   }

//   return { verified };
// }

/** Verify registration response and persist credential */
async verifyRegistrationResponse(body: any) {
  // Extract the challenge from the response
  const clientDataJSON = JSON.parse(
    Buffer.from(body.response.clientDataJSON, 'base64').toString('utf8'),
  );
  const responseChallengeB64Url: string = clientDataJSON.challenge;

  // Retrieve the stored challenge and userId using the challenge as key
  const storedData = this.getChallenge(`reg_${responseChallengeB64Url}`);
  if (!storedData) {
    throw new Error('No challenge found for registration');
  }

  const { challenge: expectedChallenge, userId } = storedData;

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: false,
    });
  } catch (error: any) {
    console.error('Verification failed', error);
    throw new Error(`Registration verification failed: ${error.message}`);
  }

  const { verified, registrationInfo } = verification;

  console.log('Registration info:', registrationInfo); // Debug log

  if (verified && registrationInfo) {
    // Check if credential data exists
    if (!registrationInfo.credential || !registrationInfo.credential.id || !registrationInfo.credential.publicKey) {
      console.error('Incomplete credential data:', registrationInfo);
      throw new Error('Incomplete credential data from authenticator');
    }

    const newCredential = {
      user_id: userId,
      credential_id: registrationInfo.credential.id, // Already a base64url string
      public_key: Buffer.from(registrationInfo.credential.publicKey).toString('base64url'),
      counter: registrationInfo.credential.counter ?? 0,
      device_type: registrationInfo.credentialDeviceType ?? 'singleDevice',
      backed_up: registrationInfo.credentialBackedUp ?? false,
      transports: body.transports ?? [],
    };

    await this.supabase.createUserCredential(newCredential);

    // Clean up
    this.challengeStore.delete(`reg_${responseChallengeB64Url}`);
  }

  return { verified };
}

  /** Generate authentication (login) options */
  async generateAuthenticationOptions() {
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'preferred',
      // Optionally: allowCredentials if you want to hint specific creds
    });

    // Store as `auth_${challenge}`. challenge is a base64url string.
    // For authentication, we don't need userId, so we pass undefined
    this.setChallenge(`auth_${options.challenge}`, options.challenge);
    return options;
  }

  /** Verify authentication response */
  async verifyAuthenticationResponse(body: any) {
    // Decode + parse clientDataJSON to extract the challenge
    const clientDataJSON = JSON.parse(
      Buffer.from(body.response.clientDataJSON, 'base64').toString('utf8'),
    );

    // clientDataJSON.challenge is a base64url string that must match options.challenge
    const responseChallengeB64Url: string = clientDataJSON.challenge;

    // Retrieve the challenge using the same key format we used when storing it
    const storedData = this.getChallenge(`auth_${responseChallengeB64Url}`);
    if (!storedData) {
      throw new Error('No challenge found for authentication');
    }

    const { challenge: expectedChallenge } = storedData;

    // body.id is the credentialID as base64url string
    const credentialId = body.id;

    // Look up the stored credential by its ID
    const credential = await this.supabase.getCredentialById(credentialId);
    if (!credential) {
      throw new Error('Credential not found');
    }

    // Fetch the user associated to the credential
    const user = await this.supabase.getUserById(credential.user_id);

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: body,
        expectedChallenge, // base64url string
        expectedOrigin,
        expectedRPID: rpID,
        credential: {
          id: credential.credential_id, // must be string (base64url)
          publicKey: Buffer.from(credential.public_key, 'base64url'), // Uint8Array
          counter: credential.counter,
          transports: credential.transports ?? undefined,
        },
      });
    } catch (error: any) {
      console.error('Authentication verification failed', error);
      throw new Error(`Authentication failed: ${error.message}`);
    }

    const { verified, authenticationInfo } = verification;

    if (verified) {
      // Prevent replay by updating the signature counter
      await this.supabase.updateCredentialCounter(
        credential.id,
        authenticationInfo.newCounter,
      );

      // Clean up used challenge
      this.challengeStore.delete(`auth_${responseChallengeB64Url}`);

      return { verified, user };
    }

    return { verified: false };
  }
}