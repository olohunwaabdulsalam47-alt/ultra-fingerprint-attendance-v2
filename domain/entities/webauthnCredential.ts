export interface WebAuthnCredential {
  credentialId: string;
  userId: string;
  publicKey?: string;
  createdAt: string;
  updatedAt: string;
}
