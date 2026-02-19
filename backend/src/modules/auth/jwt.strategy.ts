import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.includes('change-in-production') || secret.includes('change-this')) {
    throw new Error('JWT_SECRET must be set to a secure random value. Run: openssl rand -hex 32');
  }
  return secret;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  async validate(payload: any) {
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
      brandAccess: payload.brandAccess,
      storeAccess: payload.storeAccess,
    };
  }
}
