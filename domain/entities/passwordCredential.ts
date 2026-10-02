export interface PasswordCredential {
  userId: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}
