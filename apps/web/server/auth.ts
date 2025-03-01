import { Passport } from '@linen/auth/server';
import UsersService from 'services/users';
import SignInMailer from 'mailers/SignInMailer';

const { githubSignIn, loginPassport, magicLink, passport, magicLinkStrategy } =
  Passport({
    authorize: UsersService.authorize,
    getOrCreateUserWithEmail: UsersService.getOrCreateUserWithEmail,
    sendEmail: SignInMailer.send,
    authServerUrl: process.env.NEXTAUTH_URL!,
    githubClientID: process.env.AUTH_GITHUB_ID!,
    githubClientSecret: process.env.AUTH_GITHUB_SECRET!,
    secret: process.env.NEXTAUTH_SECRET!,
  });

export { githubSignIn, loginPassport, magicLink, passport, magicLinkStrategy };
