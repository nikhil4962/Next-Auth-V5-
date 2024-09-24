/*"use server";

import * as z from "zod";


import { signIn } from "@/auth";
import { LoginSchema } from "@/schemas";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { AuthError, CredentialsSignin } from "next-auth";

export const login = async (values: z.infer<typeof LoginSchema>) => {
    const validatedFields = LoginSchema.safeParse(values);

    if(!validatedFields.success){
        return {error: "Invalid fields!"};
    }

    const { email, password} = validatedFields.data;

    try{
       const result = await signIn("credentials", {
        redirect: false,
            email,
            password,
            callbackUrl: DEFAULT_LOGIN_REDIRECT,
        });

        /*if (result.error) {
            // Handle error
            console.error("Login error:", result.error);
          } else {
            // Handle successful login
            console.log("Login successful:", result);
          } 
    }
     catch (error) {
         if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Invalid credentials!" }
                default:
                    return { error: "Something went wrong!" } 
            }
         }

         throw error;
    }
}; */

/*"use server";
import * as z from "zod";
import { signIn } from 'next-auth/react';
import { LoginSchema } from "@/schemas";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { AuthError } from "next-auth";


export const login = async (values: z.infer<typeof LoginSchema>) => {
    const validatedFields = LoginSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Invalid fields!" };
    }

   /* const { email, password } = validatedFields.data;

    try {
        const result = await signIn("credentials", {
            redirect: false,
            email,
            password,
            callbackUrl: DEFAULT_LOGIN_REDIRECT,
        });

        console.log("SignIn result:", result); // Debugging line


        if (result && result.error) {
            console.error("Login error:", result.error);
    
            let errorMessage = "Something went wrong!";
            if (result.error === "CredentialsSignin") {
                errorMessage = "Invalid credentials!";
            }
    
            return { error: errorMessage };
        }

        return { success: "Login successful!" };
    } catch (error) {
           
       

        console.error("Unexpected error during login:", error);
        return { error: "Invalid credentials!" };
    }
};*/

"use server";

import * as z from "zod";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { signIn } from "@/auth";
import { LoginSchema } from "@/schemas";
//import { error } from "console";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { generateVerificationToken, generateTwoFactorToken } from "@/lib/tokens";
import { getUserByEmail } from "@/data/user";
import { getTwoFactorTokenByEmail } from "@/data/two-factor-token";
import { sendVerificationEmail, sendTwoFactorTokenEmail} from "@/lib/mail";
import { getTwoFactorConfirmationByUserId } from "@/data/two-factor-confirmation";


export const login = async (values: z.infer<typeof LoginSchema>,
    callbackUrl?: string | null,
) => {
    const validatedFields = LoginSchema.safeParse(values);

    if(!validatedFields.success) {
        return { error: "Invalid fields!" };
    }

    const { email, password, code } = validatedFields.data;

    const existingUser = await getUserByEmail(email);

    if (!existingUser || !existingUser.email || !existingUser.password) {
        return { error: "Email does not exist!" }
    }

    if (!existingUser.emailVerified) {
      const verificationToken = await generateVerificationToken(
          existingUser.email,
        );

        await sendVerificationEmail(
            verificationToken.email,
            verificationToken.token
        );

        return  {success: "Confirmation email sent!" };
    }  
    
    //ADDED later  
    const passwordMatch = await bcrypt.compare(password, existingUser.password);

    if (!passwordMatch) {
      return { error: "Invalid Credentials!" };
    }

      if (existingUser.isTwoFactorEnabled && existingUser.email){
        if(code) {
            const twoFactorToken = await getTwoFactorTokenByEmail(
                existingUser.email);

            if(!twoFactorToken) {
                return { error: "Invalid Code!" };
            }

            if(twoFactorToken.token !== code) {
                return { error: "Invalid code!" };
            }

            const hasExpired = new Date(twoFactorToken.expires) < new Date();

            if(hasExpired) {
                return { error: "Code expired!" };
            }

            await db.twoFactorToken.delete({
               where: { id: twoFactorToken.id },
            });

            const existingConfirmation = await getTwoFactorConfirmationByUserId
            ( 
                existingUser.id
            );
            
            if(existingConfirmation) {
                await db.twoFactorConfirmation.delete({
                    where: { id: existingConfirmation.id }
                });
            }

                await db.twoFactorConfirmation.create({
                    data: {
                        userId: existingUser.id,
                    },
                });
            
        } else {     
        const twoFactorToken = await generateTwoFactorToken(existingUser.email) 
        await sendTwoFactorTokenEmail(
            twoFactorToken.email,
            twoFactorToken.token
        );

        return { twoFactor: true };
        }
      }

     try{
       await signIn("credentials", {
        email,
        password,
        redirectTo: callbackUrl ||  DEFAULT_LOGIN_REDIRECT,
       });

    } catch (error) {
        // TODO
        if(error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Invalid credentials!" };
                default:
                    return { error: "Something went wong!" };
            }
        }
        throw error;
    }
};





