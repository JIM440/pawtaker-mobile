export interface SignUpCredentials {
  email: string;
  password: string;
}

export interface SignUpProfile {
  firstName: string;
  lastName: string;
  city: string;
  bio?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export type KYCDocumentType = 'passport' | 'drivers_license' | 'national_id';

export interface KYCSubmission {
  documentType: KYCDocumentType;
  frontUri: string;
  backUri?: string;
  selfieUri?: string;
}
