export interface AuthProvider {
  uid: string;
}

export interface AuthProviders {
  firebase: AuthProvider;
}

export interface AuthClaims {
  admin?: boolean;
  game_developer?: boolean;
  game_designer?: boolean;
  partners_manager?: boolean;
}

export interface User {
  id: string;
  email: string;
  providers: AuthProviders;
  createdAt: Date;
  hasAcceptedTerms: boolean;
  acceptedTermsAt?: Date;
}
