
import NextAuth, {type DefaultSession } from "next-auth"
 import { UserRole } from "@prisma/client";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { db } from "./lib/db";
import authConfig from "@/auth.config";
import { log } from "console";
import { getUserById } from "@/data/user";
import { getTwoFactorConfirmationByUserId } from "@/data/two-factor-confirmation";
import { TbArrowAutofitRight } from "react-icons/tb";
import { getAccountByUserId } from "./data/account";

 
export const { 
    handlers: { GET, POST },
    auth,
    signIn,
    signOut,
} = NextAuth({
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
   events: {
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() }
      });
    },
   },

    callbacks: {
      async signIn({ user, account }) {
       //Allow OAuth without email verification
       if(account?.provider !== "credentials") return true;

       if (!user?.id) return false;

      // const existingUser = await getUserById(user.id);

      const existingUser = await getUserById(user.id);


       // Prevent sign in without email verification
       if (!existingUser?.emailVerified) return false;

       if (existingUser.isTwoFactorEnabled) {
        const twoFactorConfirmation = await
        getTwoFactorConfirmationByUserId(existingUser.id);
        
        if(!twoFactorConfirmation) return false;

        //delet two factorconfirmation for next slign in
        await db.twoFactorConfirmation.delete({
          where: { id: twoFactorConfirmation.id }
        });
       }

       return true;  
      },
       async session({ token, session }) {
        if (token.sub && session.user) {
          session.user.id = token.sub;
        }

        if(token.role && session.user) {
         // session.user.role = token.role as "ADMIN" | "USER";
         session.user.role = token.role as "ADMIN";
        }

        if(session.user) {
          session.user.isTwoFactorEnabled = token.isTwoFactorEnabled as boolean;
          session.user.name = token.name;
          session.user.name = token.email;
          session.user.isOAuth = token.isOAuth as boolean;
        }


        return session;
       },
       async jwt({ token }) {
        console.log("I AM BEING CALLED AGAIN!")
        if(!token.sub) return token;

        const exisitngUser = await getUserById(token.sub);

        if(!exisitngUser) return token;

        const existingAccount = await getAccountByUserId(
          exisitngUser.id
        );
        
        token.isOAuth = !!existingAccount;
        token.name = exisitngUser.name;
        token.email = exisitngUser.email;
        token.role = exisitngUser.role;
        token.isTwofactorEnabled = exisitngUser.isTwoFactorEnabled;

        return token;
       },
    }, 
    adapter: PrismaAdapter(db),
    session: { strategy: "jwt" },
    ...authConfig,
}); 

