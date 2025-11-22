// src/services/auth/passwordAuth.ts
import { EncryptionService } from '../storage/encryptionService';
import { secureStorage } from '../storage/secureStorage';

export interface AuthUser {
  email: string;
  createdAt: string;
}

export class PasswordAuth {
  private static readonly USER_KEY = 'auth_user';
  private static readonly PASSWORD_KEY = 'auth_password_encrypted';
  private static readonly ENC_KEY = 'auth_encryption_key';
  private static readonly SESSION_KEY = 'auth_session';
  private static readonly SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 jours en ms

  // Validation d'email
  private static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Vérifier si la session est expirée
  private static isSessionExpired(createdAt: string): boolean {
    const sessionDate = new Date(createdAt).getTime();
    const now = Date.now();
    return (now - sessionDate) > this.SESSION_DURATION;
  }

  static async register(email: string, password: string): Promise<void> {
    if (!email || !password) throw new Error('Email et mot de passe requis');
    if (!this.validateEmail(email)) throw new Error('Format d\'email invalide');
    if (password.length < 6) throw new Error('Le mot de passe doit contenir au moins 6 caractères');

    const encryptionKey = await EncryptionService.generateKey();
    const encrypted = await EncryptionService.encrypt(password, encryptionKey);
    const user: AuthUser = { email, createdAt: new Date().toISOString() };

    await secureStorage.setItem(this.USER_KEY, JSON.stringify(user));
    await secureStorage.setItem(this.PASSWORD_KEY, encrypted);
    await secureStorage.setItem(this.ENC_KEY, encryptionKey);
  }

  static async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!email || !password) return { success: false, error: 'Email et mot de passe requis' };
      if (!this.validateEmail(email)) return { success: false, error: 'Format d\'email invalide' };

      const userStr = await secureStorage.getItem(this.USER_KEY);
      const encrypted = await secureStorage.getItem(this.PASSWORD_KEY);
      const encKey = await secureStorage.getItem(this.ENC_KEY);

      if (!userStr || !encrypted || !encKey) {
        return { success: false, error: 'Aucun compte trouvé' };
      }

      const user = JSON.parse(userStr) as AuthUser;
      if (user.email !== email) {
        return { success: false, error: 'Email ou mot de passe incorrect' };
      }

      const stored = await EncryptionService.decrypt(encrypted, encKey);
      if (stored !== password) {
        return { success: false, error: 'Email ou mot de passe incorrect' };
      }

      // Créer une session avec timestamp
      const session = { email, createdAt: new Date().toISOString() };
      await secureStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Erreur lors de la connexion' };
    }
  }

  static async logout(): Promise<void> {
    await secureStorage.deleteItem(this.SESSION_KEY);
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const session = await secureStorage.getItem(this.SESSION_KEY);
      if (!session) return null;

      const s = JSON.parse(session);
      
      // Vérifier expiration de session
      if (this.isSessionExpired(s.createdAt)) {
        await this.logout();
        return null;
      }

      const userStr = await secureStorage.getItem(this.USER_KEY);
      if (!userStr) return null;

      return JSON.parse(userStr) as AuthUser;
    } catch {
      return null;
    }
  }

  static async isRegistered(): Promise<boolean> {
    const user = await secureStorage.getItem(this.USER_KEY);
    const pwd = await secureStorage.getItem(this.PASSWORD_KEY);
    return !!(user && pwd);
  }

  static async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!currentPassword || !newPassword) {
        return { success: false, error: 'Tous les champs sont requis' };
      }
      if (newPassword.length < 6) {
        return { success: false, error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' };
      }

      const encrypted = await secureStorage.getItem(this.PASSWORD_KEY);
      const encKey = await secureStorage.getItem(this.ENC_KEY);

      if (!encrypted || !encKey) {
        return { success: false, error: 'Erreur de configuration' };
      }

      // Vérifier mot de passe actuel
      const stored = await EncryptionService.decrypt(encrypted, encKey);
      if (stored !== currentPassword) {
        return { success: false, error: 'Mot de passe actuel incorrect' };
      }

      // Chiffrer et sauvegarder nouveau mot de passe
      const newEncrypted = await EncryptionService.encrypt(newPassword, encKey);
      await secureStorage.setItem(this.PASSWORD_KEY, newEncrypted);

      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: 'Erreur lors du changement de mot de passe' };
    }
  }

  static async updateEmail(newEmail: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!newEmail || !password) {
        return { success: false, error: 'Email et mot de passe requis' };
      }
      if (!this.validateEmail(newEmail)) {
        return { success: false, error: 'Format d\'email invalide' };
      }

      const encrypted = await secureStorage.getItem(this.PASSWORD_KEY);
      const encKey = await secureStorage.getItem(this.ENC_KEY);
      const userStr = await secureStorage.getItem(this.USER_KEY);

      if (!encrypted || !encKey || !userStr) {
        return { success: false, error: 'Erreur de configuration' };
      }

      // Vérifier mot de passe
      const stored = await EncryptionService.decrypt(encrypted, encKey);
      if (stored !== password) {
        return { success: false, error: 'Mot de passe incorrect' };
      }

      // Mettre à jour l'email
      const user = JSON.parse(userStr) as AuthUser;
      user.email = newEmail;
      await secureStorage.setItem(this.USER_KEY, JSON.stringify(user));

      // Mettre à jour la session
      const session = { email: newEmail, createdAt: new Date().toISOString() };
      await secureStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

      return { success: true };
    } catch (error) {
      console.error('Update email error:', error);
      return { success: false, error: 'Erreur lors de la mise à jour de l\'email' };
    }
  }

  static async resetPassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!newPassword) {
        return { success: false, error: 'Le nouveau mot de passe est requis' };
      }
      if (newPassword.length < 6) {
        return { success: false, error: 'Le mot de passe doit contenir au moins 6 caractères' };
      }

      const encKey = await secureStorage.getItem(this.ENC_KEY);
      if (!encKey) {
        return { success: false, error: 'Erreur de configuration' };
      }

      // Chiffrer et sauvegarder nouveau mot de passe
      const newEncrypted = await EncryptionService.encrypt(newPassword, encKey);
      await secureStorage.setItem(this.PASSWORD_KEY, newEncrypted);

      // Créer une nouvelle session
      const userStr = await secureStorage.getItem(this.USER_KEY);
      if (userStr) {
        const user = JSON.parse(userStr) as AuthUser;
        const session = { email: user.email, createdAt: new Date().toISOString() };
        await secureStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      }

      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: 'Erreur lors de la réinitialisation du mot de passe' };
    }
  }
}
