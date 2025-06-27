import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";
import db from "../utils/db.js";
import { PassportUser } from "../types/index.js";

export default function configurePassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: "/api/auth/google/callback",
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: VerifyCallback
      ) => {
        try {
          const email = profile.emails?.[0]?.value;
          const isEmailVerified = profile.emails?.[0]?.verified;
          const profileUrl = profile.photos?.[0]?.value;

          if (!email) {
            done(new Error("No email in Google profile"));
            return;
          }

          let user = await db.user.findUnique({
            where: {
              email: email,
            },
          });

          if (!user) {
            user = await db.user.create({
              data: {
                email: email,
                name: profile.displayName,
                password: null,
                googleId: profile.id,
                isVerified: isEmailVerified || false,
                profileUrl: profileUrl,
                agreeToPrivacyPolicy: true,
                agreeToTerms: true,
                lastLogin: new Date(),
              },
            });
          } else if (!user.googleId) {
            user = await db.user.update({
              where: { id: user.id },
              data: {
                googleId: profile.id,
                isVerified: isEmailVerified || user.isVerified,
                lastLogin: new Date(),
              },
            });
          }

          const passportUser: PassportUser = { id: user.id };

          done(null, passportUser);
        } catch (err) {
          done(err);
        }
      }
    )
  );
}
