import { Platform } from "react-native";
import { supabase } from "./client";

type GoogleSigninModule = typeof import("@react-native-google-signin/google-signin");

const getGoogleModule = (): GoogleSigninModule | null => {
  try {
    // Load native Google Sign-In only when available in the current binary.
    return require("@react-native-google-signin/google-signin") as GoogleSigninModule;
  } catch {
    return null;
  }
};

export const configureGoogleSignIn = () => {
  const googleModule = getGoogleModule();
  if (!googleModule) return;

  googleModule.GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });
};

export const signInWithGoogleNative = async () => {
  const googleModule = getGoogleModule();
  if (!googleModule) {
    return {
      error:
        Platform.OS === "web"
          ? "Google sign-in is not available on web in this build."
          : "Google sign-in requires a development build with native Google module support.",
    };
  }

  const { GoogleSignin, isErrorWithCode, statusCodes } = googleModule;

  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    let idToken = null;

    // Handle different versions of the google-signin library safely
    if (userInfo.data?.idToken) {
      idToken = userInfo.data.idToken;
    } else if ((userInfo as any).idToken) {
      idToken = (userInfo as any).idToken;
    }

    if (!idToken) {
      throw new Error("No ID token present from Google.");
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
    });

    if (error) {
      return { error: error.message };
    }

    return { data, error: null };
  } catch (error: any) {
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          // User closed the module silently — don't show an error
          return { error: null, cancelled: true };
        case statusCodes.IN_PROGRESS:
          return { error: "Google sign-in is already in progress." };
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          return {
            error:
              "Google Play Services are not available or outdated on this device.",
          };
        default:
          return { error: error.message };
      }
    } else {
      return {
        error: error.message || "An unknown error occurred during Google Sign-in.",
      };
    }
  }
};
