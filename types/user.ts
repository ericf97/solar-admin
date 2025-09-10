export interface AuthProviderDto {
  uid: string;
}

export interface User {
  id: string;
  email: string;
  providers: AuthProviderDto;
  hasAcceptedTerms: boolean;
  acceptedTermsAt: Date;
}
