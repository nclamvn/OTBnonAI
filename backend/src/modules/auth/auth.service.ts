import { Injectable, UnauthorizedException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../common/services/audit-log.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditLog: AuditLogService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      this.auditLog.log({ userId: 'anonymous', entityType: 'auth', entityId: email, action: 'login_failed', changes: { reason: 'user_not_found_or_inactive' } });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      this.auditLog.log({ userId: user.id, entityType: 'auth', entityId: user.id, action: 'login_failed', changes: { reason: 'invalid_password' } });
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      permissions: user.role.permissions,
      brandAccess: user.brandAccess,
      storeAccess: user.storeAccess,
    };

    this.auditLog.log({ userId: user.id, entityType: 'auth', entityId: user.id, action: 'login', changes: { role: user.role.name } });

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
        permissions: user.role.permissions,
        storeAccess: user.storeAccess,
        brandAccess: user.brandAccess,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken);
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        include: { role: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found');
      }

      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role.name,
        permissions: user.role.permissions,
        brandAccess: user.brandAccess,
        storeAccess: user.storeAccess,
      };

      return {
        accessToken: this.jwtService.sign(payload),
        refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // SEC-08: Logout — audit log only (stateless JWT, client clears tokens)
  async logout(userId: string) {
    this.auditLog.log({ userId, entityType: 'auth', entityId: userId, action: 'logout', changes: {} });
    return { message: 'Logged out successfully' };
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string; department?: string }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.phone && { phone: data.phone }),
        ...(data.department && { department: data.department }),
      },
      include: { role: true },
    });

    this.auditLog.log({ userId, entityType: 'user', entityId: userId, action: 'profile_updated', changes: data });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.name,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) throw new UnauthorizedException('User not found');

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      department: user.department,
      role: user.role,
      permissions: user.role.permissions,
      storeAccess: user.storeAccess,
      brandAccess: user.brandAccess,
      createdAt: user.createdAt,
    };
  }

  /**
   * GDPR/PDPA Data Erasure (Right to Be Forgotten)
   * Anonymizes user PII instead of hard-deleting to preserve referential integrity.
   * Only accessible by admin users.
   */
  async eraseUser(targetUserId: string, adminUserId: string) {
    // Prevent self-erasure
    if (targetUserId === adminUserId) {
      throw new ForbiddenException('Cannot erase your own account');
    }

    // Verify target user exists
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { role: true },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check if already erased
    if (targetUser.erasedAt) {
      throw new ForbiddenException('User data has already been erased');
    }

    // Anonymize PII fields
    const anonymizedData = {
      name: 'Deleted User',
      email: `deleted_${targetUserId}@erased.local`,
      passwordHash: '', // Clear password hash — login is impossible
      phone: null,
      department: null,
      storeAccess: [],
      brandAccess: [],
      isActive: false,
      erasedAt: new Date(),
    };

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: anonymizedData,
    });

    // Audit log the erasure action
    await this.auditLog.log({
      userId: adminUserId,
      entityType: 'user',
      entityId: targetUserId,
      action: 'gdpr_erasure',
      changes: {
        erasedFields: ['name', 'email', 'passwordHash', 'phone', 'department', 'storeAccess', 'brandAccess'],
        previousEmail: targetUser.email,
        previousName: targetUser.name,
        reason: 'GDPR/PDPA right to be forgotten',
      },
    });

    return {
      message: 'User data has been anonymized successfully',
      userId: targetUserId,
      erasedAt: anonymizedData.erasedAt.toISOString(),
    };
  }
}
