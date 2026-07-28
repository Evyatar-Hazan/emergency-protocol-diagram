import { describe, expect, it, vi } from 'vitest';
import { loginOrCreateUser, verifyGoogleToken } from '../../services/authService';

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('google-auth-library', () => ({
  OAuth2Client: vi.fn(function OAuth2Client() {
    return {
    verifyIdToken: vi.fn().mockRejectedValue(new Error('invalid token')),
    };
  }),
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(function PrismaClient() {
    return prismaMock;
  }),
}));

describe('Auth Service', () => {
  describe('verifyGoogleToken', () => {
    it('should return null for invalid token', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const result = await verifyGoogleToken('invalid-token');

      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('loginOrCreateUser', () => {
    it('should create a new user', async () => {
      const payload = {
        sub: 'google-id',
        email: 'newuser@example.com',
        name: 'New User',
        picture: 'https://example.com/pic.jpg',
        iss: '',
        azp: '',
        aud: '',
        email_verified: true,
        at_hash: '',
        given_name: '',
        family_name: '',
        locale: '',
        iat: 0,
        exp: 0,
      };

      const mockUser = {
        id: 'user-1',
        ...payload,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(mockUser);

      const result = await loginOrCreateUser(payload);

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          email: 'newuser@example.com',
          googleId: 'google-id',
          name: 'New User',
          picture: 'https://example.com/pic.jpg',
          isAdmin: false,
        },
      });
      expect(result.user.email).toBe('newuser@example.com');
      expect(result.token).toEqual(expect.any(String));
    });
  });
});
