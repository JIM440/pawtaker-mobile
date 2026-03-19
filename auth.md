🐾  PawTaker
Authentication Implementation Guide
For the Junior Developer  •  Version 1.0  •  March 2026

Tech Stack
React Native + Expo Router	Backend
Supabase (Auth + PostgreSQL)	State
Zustand

0.  Purpose & Scope of This Document
This document is the complete implementation guide for the PawTaker authentication system. It covers every action that must be taken — both inside the Supabase dashboard and inside the React Native codebase — to deliver a fully working auth flow, from sign-up through email OTP verification, profile creation, and onboarding navigation.
Follow the steps in the exact order they appear. Each section is self-contained and tells you where to do something (Supabase dashboard vs code), what to write, and why.

Scope item	Included?
Email + password sign-up	✅  Yes
OTP email verification	✅  Yes
Google & Apple OAuth	✅  Yes (noted where it differs)
Zustand store for signup state	✅  Yes
Supabase database trigger	✅  Yes — full SQL provided
onAuthStateChange navigation	✅  Yes
KYC submit + pending screens	✅  Referenced — not wired to Supabase yet
Points, reviews, feed	❌  Out of scope for this document


1.  Architecture Overview
Before writing any code, understand how the two Supabase tables relate to each other and where your app fits.

1.1  The Two-Table Model
Table	Purpose
auth.users	Managed entirely by Supabase. Stores credentials, tokens, email verification state. You never write to this directly.
public.users	Your application table. Stores all profile data: name, location, KYC status, points, preferences etc. You read and write this freely.

✅  NOTE  These two tables share the same UUID as their primary key. auth.users.id === public.users.id. This is how you link them.

1.2  How They Stay in Sync — The Database Trigger
When a user signs up, Supabase creates the auth.users row automatically. You need the public.users row to be created at the same moment. The cleanest way to do this is a PostgreSQL trigger that fires on every INSERT into auth.users and automatically creates the matching public.users row.
This approach is chosen over doing the insert in React Native code because:
•	It fires server-side — network drops and app crashes cannot prevent it.
•	It works for all auth methods (email, Google, Apple) from a single piece of code.
•	Your React Native sign-up code stays clean — one call, no manual inserts.

1.3  Full Auth Flow at a Glance
User fills Step 1 — Credentials screen
        ↓
supabase.auth.signUp() called from React Native
        ↓
  ┌─────────────────────────────────┐
  │ Supabase creates auth.users row  │
  │ Trigger fires → public.users row │
  │ OTP email sent automatically     │
  └─────────────────────────────────┘
        ↓
User navigates to OTP verification screen (new Step 2)
        ↓
User enters 6-digit code from email
        ↓
supabase.auth.verifyOtp() called
        ↓
Trigger fires → is_email_verified = true in public.users
        ↓
User fills Step 3 — Profile Information
        ↓
public.users updated (bio, city, display name)
        ↓
User completes Step 4 — Declaration
        ↓
User submits Step 5 — KYC document
        ↓
User lands on Step 6 — KYC Pending screen
        ↓
User enters the main app (/(private)/(tabs))


2.  How Authentication Works Under the Hood
Before writing a single line of code, you must understand what actually happens when a user signs up or signs in. This section explains what Supabase returns, where tokens go, how they are managed, and how the navigation logic uses all of this.

2.1  What Supabase Returns After Auth
When supabase.auth.signUp() or supabase.auth.signInWithPassword() is called, Supabase returns a session object. This is the core of everything — it proves who the user is and keeps them logged in.

// What comes back from signUp() or signInWithPassword()
{
  data: {
    session: {
      access_token:  'eyJhbGc...',   // JWT — proves who the user is
      refresh_token: 'xKj8...',       // used to silently get a new access_token
      expires_at:    1711234567,       // unix timestamp when access_token expires
      expires_in:    3600,             // seconds until expiry (1 hour)
      token_type:    'bearer',
      user: {
        id:                   'uuid-here',
        email:                'john@example.com',
        email_confirmed_at:   null,    // null until OTP verified
        user_metadata: {
          full_name:    'John Doe',
          has_had_pet:  true
        }
      }
    },
    user: { ... }   // same user object as above
  },
  error: null
}

✅  NOTE  email_confirmed_at is null until the user verifies their email via OTP. This is what Supabase uses internally to know if the email is verified.

2.2  Where Do Tokens Go — expo-secure-store
You never manually handle or store tokens. The Supabase client does this entirely on your behalf. But it needs to know WHERE to store them on the device. For React Native / Expo, the answer is expo-secure-store — a secure, encrypted key-value store on the device.

This is configured once in your Supabase client file. Make sure your src/lib/supabase/client.ts looks exactly like this:

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Adapter that tells Supabase to use expo-secure-store
const ExpoSecureStoreAdapter = {
  getItem:    (key: string) => SecureStore.getItemAsync(key),
  setItem:    (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage:          ExpoSecureStoreAdapter, // store tokens securely on device
      autoRefreshToken: true,                   // auto-refresh when access_token expires
      persistSession:   true,                   // session survives app restarts
      detectSessionInUrl: false,                // must be false for React Native
    }
  }
);

⚠️  NOTE  If expo-secure-store is not installed, run: npx expo install expo-secure-store

Once this is configured, here is what happens automatically every time:

Action	What Supabase does automatically
User signs up or signs in	Saves access_token + refresh_token to expo-secure-store
User makes any Supabase query	Attaches access_token to the request header automatically
access_token expires (after 1 hour)	Uses refresh_token to silently get a new access_token
User closes and reopens the app	Reads saved tokens from expo-secure-store — user stays logged in
User signs out	Deletes tokens from expo-secure-store — user is logged out

✅  NOTE  You never read or write tokens manually anywhere in your code. The Supabase client handles all of this silently in the background.

2.3  How onAuthStateChange Works
onAuthStateChange is a listener that fires every time the user's auth state changes. It is set up once in the root layout and runs for the entire lifetime of the app. It is what keeps your Zustand session state in sync with Supabase.

// Already in your _layout.tsx — this is what it does:
supabase.auth.onAuthStateChange((_event, session) => {
  setSession(session);   // updates Zustand auth store
});

Here is every event it can fire and exactly when:

Event	When it fires	What to do
INITIAL_SESSION	App boots — Supabase reads saved tokens from SecureStore	setSession() — already handled
SIGNED_IN	User signs in OR OTP is verified successfully	setSession() — navigation useEffect handles routing
USER_UPDATED	User verifies email or changes password	setSession() — profile re-fetch handles the rest
TOKEN_REFRESHED	access_token silently refreshed in background	setSession() with new token — no action needed
SIGNED_OUT	User manually signs out	setSession(null) — navigation sends to welcome screen
PASSWORD_RECOVERY	User clicks password reset link	Navigate to password reset screen

2.4  How the Conditional Navigation Works
This is the most critical part to understand. The navigation does NOT happen inside individual screens. It all happens in one place — the useEffect in _layout.tsx that watches the session. Here is the complete logic:

Step 1 — onAuthStateChange fires and updates session in Zustand:

supabase.auth.onAuthStateChange((_event, session) => {
  setSession(session);   // session changes → useEffect re-runs
});

Step 2 — useEffect watches session and decides where to navigate:

useEffect(() => {
  if (!ready) return;                    // wait for fonts + auth to load

  if (!session) {
    router.replace('/(auth)/welcome');   // no session = not logged in → welcome
    return;
  }

  // session exists — but we need the profile to know WHERE to send the user
  fetchProfile(session.user.id).then(() => {
    const profile = useAuthStore.getState().profile;

    if (!profile.is_email_verified) {
      router.replace('/(auth)/signup/verify');      // email not verified yet
    } else if (!profile.city) {
      router.replace('/(auth)/signup/profile');     // profile not complete
    } else if (profile.kyc_status === 'not_submitted') {
      router.replace('/(auth)/kyc/submit');         // KYC not started
    } else if (profile.kyc_status === 'pending') {
      router.replace('/(auth)/kyc/pending');        // KYC waiting for admin
    } else {
      router.replace('/(private)/(tabs)');          // fully onboarded → home
    }
  });

}, [ready, session]);   // re-runs when either changes

Why [ready, session] as the dependency array:

Dependency	Why it is needed
ready	Prevents navigation before fonts are loaded and auth state is known. Without this, the app would try to navigate before Supabase has finished reading tokens from SecureStore.
session	Re-runs the navigation logic every time auth state changes. This is what makes sign-in and sign-out automatically redirect the user without any manual router.push() calls in individual screens.

2.5  The Complete Token & Navigation Flow
APP OPENS
    ↓
Supabase reads expo-secure-store for saved tokens
    ↓
    ┌──────────────────────┬────────────────────────┐
    │                      │                        │
No tokens found     Tokens found             Tokens found
                    (still valid)             (expired)
    │                      │                        │
    ↓                      ↓                        ↓
session = null      INITIAL_SESSION          Supabase uses
    │                fires                   refresh_token
    ↓                      │                silently
Welcome screen      setSession(session)            │
                           │                        ↓
                           ↓               TOKEN_REFRESHED
                    useEffect fires                 │
                           │                setSession(new)
                           ↓                        │
                    fetchProfile()                  ↓
                           │               same as tokens
                           ↓               found valid
                    Check conditions
                           │
           ┌───────────────┼───────────────────┐
           ↓               ↓                   ↓
    email not       profile not          kyc_status
    verified        complete             navigation
           ↓               ↓                   ↓
    /signup/verify  /signup/profile      /kyc/submit
                                         /kyc/pending
                                         /(private)/(tabs)


3.  Supabase Dashboard Configuration
These steps must be completed before writing any code. They only need to be done once.

3.1	Edit the Confirm Sign Up Email Template (Enable OTP)

By default Supabase sends a magic link for email verification. We want a 6-digit OTP code instead. This is achieved by editing the email template — there is no separate toggle to enable.

Navigation path in the Supabase dashboard:
Authentication  →  Notifications  →  Email  →  Templates tab  →  Confirm sign up

Replace the entire template content with the following:

<h2>Confirm your PawTaker account</h2>
<p>Thank you for joining PawTaker.</p>
<p>Enter the code below in the app to verify your email address:</p>
<h1 style="letter-spacing: 8px;">{{ .Token }}</h1>
<p>This code expires in <strong>1 hour</strong>.</p>
<p>If you did not create a PawTaker account, you can safely ignore this email.</p>

✅  NOTE  The key change is {{ .Token }} — this tells Supabase to insert a 6-digit code instead of {{ .ConfirmationURL }} which sends a link.

Click Save when done.

3.2	Set OTP Expiration Time

Navigation path:
Authentication  →  Configuration  →  Sign In / Providers  →  Email  →  Email OTP Expiration

Set the value to 3600 (this is 1 hour in seconds). Click Save.

3.3	Confirm Email Provider Is Enabled

Navigation path:
Authentication  →  Configuration  →  Sign In / Providers  →  Email

Make sure the Email provider toggle is ON. Leave all other settings at their defaults for now.

3.4	Run the Database Trigger in SQL Editor

Navigation path:
SQL Editor  →  New query

Run the following SQL. This creates two triggers: one that creates the public.users row on signup, and one that sets is_email_verified = true when the user verifies their email.

QUERY 1 — Create the new user handler function:

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    auth_type,
    has_had_pet,
    kyc_status,
    is_verified,
    is_email_verified,
    care_given_count,
    care_received_count,
    points_balance,
    points_alltime_high,
    language_pref,
    theme_pref,
    is_deactivated
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    CASE
      WHEN NEW.app_metadata->>'provider' = 'google' THEN 'google'
      WHEN NEW.app_metadata->>'provider' = 'apple'  THEN 'apple'
      ELSE 'email'
    END,
    COALESCE((NEW.raw_user_meta_data->>'has_had_pet')::boolean, false),
    'not_submitted',
    false,
    false,
    0, 0, 0, 0,
    'en',
    'system',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

QUERY 2 — Create the email verified handler function:

CREATE OR REPLACE FUNCTION public.handle_email_verified()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.users
    SET is_email_verified = true
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users
CREATE OR REPLACE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_email_verified();

✅  NOTE  Run each query separately. After running, verify by going to Database → Functions and checking that handle_new_user and handle_email_verified appear in the list.


4.  Zustand Store Setup
Two stores are needed for authentication: one for the Supabase session (already partially exists based on the layout file), and one specifically for holding signup form data across the multi-step flow.

4.1  Auth Store  —  src/lib/store/auth.store.ts
This store holds the Supabase session and the public.users profile. It is already referenced in the root layout. Extend it as follows:

import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';

type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  display_name?: string;
  bio?: string;
  city?: string;
  country?: string;
  profile_photo_url?: string;
  kyc_status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  is_verified: boolean;
  is_email_verified: boolean;
  language_pref: string;
  theme_pref: string;
};

type AuthStore = {
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  fetchProfile: (userId: string) => Promise<void>;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  profile: null,
  isLoading: true,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),

  fetchProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error && data) set({ profile: data });
  },

  clearAuth: () => set({ session: null, profile: null }),
}));

4.2  Signup Store  —  src/lib/store/signup.store.ts
This store holds form data as the user moves through the multi-step signup flow. It is cleared once signup is complete.

import { create } from 'zustand';

type SignupStore = {
  // Step 1 — Credentials
  fullName: string;
  email: string;
  password: string;

  // Step 3 — Profile
  displayName: string;
  location: string;
  bio: string;

  // Step 4 — Declaration
  declarationAccepted: boolean;
  hasHadPet: boolean;

  // Setters
  setCredentials: (fullName: string, email: string, password: string) => void;
  setProfile: (displayName: string, location: string, bio: string) => void;
  setDeclaration: (accepted: boolean, hasHadPet: boolean) => void;
  clearSignup: () => void;
};

export const useSignupStore = create<SignupStore>((set) => ({
  fullName: '',
  email: '',
  password: '',
  displayName: '',
  location: '',
  bio: '',
  declarationAccepted: false,
  hasHadPet: false,

  setCredentials: (fullName, email, password) =>
    set({ fullName, email, password }),

  setProfile: (displayName, location, bio) =>
    set({ displayName, location, bio }),

  setDeclaration: (declarationAccepted, hasHadPet) =>
    set({ declarationAccepted, hasHadPet }),

  clearSignup: () => set({
    fullName: '', email: '', password: '',
    displayName: '', location: '', bio: '',
    declarationAccepted: false, hasHadPet: false,
  }),
}));


5.  Root Layout Update  —  app/_layout.tsx
The root layout already handles session bootstrapping. It needs two updates: fetch the user profile when a session is detected, and use the profile data to decide where to navigate the user (this handles abandoned signups per REQ1.2).

⚠️  NOTE  The current layout navigates all users to /(private)/(tabs) regardless of auth state. This must be replaced with the conditional navigation logic below.

// Replace the navigation useEffect in app/_layout.tsx with this:

useEffect(() => {
  if (!ready) return;
  if (Platform.OS !== 'web') SplashScreen.hideAsync();

  if (!session) {
    router.replace('/(auth)/welcome');
    return;
  }

  // Session exists — fetch the profile to determine where to send the user
  fetchProfile(session.user.id).then(() => {
    const profile = useAuthStore.getState().profile;

    if (!profile || !profile.is_email_verified) {
      // Auth row exists but email not yet verified — go back to OTP screen
      router.replace('/(auth)/signup/verify');
    } else if (!profile.city) {
      // Email verified but profile not complete
      router.replace('/(auth)/signup/profile');
    } else if (profile.kyc_status === 'not_submitted') {
      // Profile done but KYC not started
      router.replace('/(auth)/kyc/submit');
    } else if (profile.kyc_status === 'pending') {
      // KYC submitted, waiting for admin
      router.replace('/(auth)/kyc/pending');
    } else {
      // Fully onboarded
      router.replace('/(private)/(tabs)');
    }
  });
}, [ready, session]);

// Also update the store destructure at the top to include fetchProfile:
const { session, isLoading, setSession, setLoading, fetchProfile } = useAuthStore();


6.  Auth Layout File  —  app/(auth)/_layout.tsx
This layout wraps all auth screens. Update the route order to include the new OTP verify screen as Step 2:

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup/credentials" />   {/* Step 1 */}
      <Stack.Screen name="signup/verify" />        {/* Step 2 — NEW */}
      <Stack.Screen name="signup/profile" />       {/* Step 3 */}
      <Stack.Screen name="signup/declaration" />   {/* Step 4 */}
      <Stack.Screen name="kyc/submit" />           {/* Step 5 */}
      <Stack.Screen name="kyc/pending" />          {/* Step 6 */}
    </Stack>
  );
}


7.  Screen Implementations

7.1  Step 1 — Credentials Screen  (already exists, wire it up)
File: app/(auth)/signup/credentials.tsx
This screen already has the UI. Wire the state and the Supabase call as follows:

import { useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../../src/lib/supabase/client';
import { useSignupStore } from '../../../src/lib/store/signup.store';

export default function CredentialsScreen() {
  const router = useRouter();
  const { setCredentials } = useSignupStore();

  const [fullName, setFullName]       = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPwd, setConfirmPwd]   = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const handleSignUp = async () => {
    setError(null);

    // Basic validation
    if (!fullName || !email || !password) {
      setError('All fields are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPwd) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          has_had_pet: false, // updated in declaration step
        }
      }
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // Save credentials in Zustand for use in later steps
    setCredentials(fullName, email, password);

    // Navigate to OTP verification
    router.push('/(auth)/signup/verify');
  };

  // ... rest of your JSX, wiring fullName/email/password/confirmPwd
  // to your TextField components and handleSignUp to your submit button
}

7.2  Step 2 — OTP Verify Screen  (NEW FILE — create this)
File: app/(auth)/signup/verify.tsx
This is a new file that needs to be created. It shows a 6-digit code input and a resend button.

import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../src/lib/supabase/client';
import { useSignupStore } from '../../../src/lib/store/signup.store';

export default function VerifyScreen() {
  const router  = useRouter();
  const { email } = useSignupStore();

  const [otp, setOtp]           = useState('');
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    setLoading(true);
    setError(null);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',   // use 'email' — 'signup' is deprecated
    });

    setLoading(false);

    if (verifyError) {
      setError('Invalid or expired code. Please try again.');
      return;
    }

    // Success — trigger fires to set is_email_verified = true
    // Navigate to profile step
    router.push('/(auth)/signup/profile');
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    setSuccess(null);

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    setResending(false);

    if (resendError) {
      setError('Could not resend code. Please try again.');
    } else {
      setSuccess('A new code has been sent to ' + email);
    }
  };

  return (
    <View>
      <Text>Check your email</Text>
      <Text>We sent a 6-digit code to {email}</Text>

      <TextInput
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="Enter 6-digit code"
      />

      {error  && <Text style={{ color: 'red' }}>{error}</Text>}
      {success && <Text style={{ color: 'green' }}>{success}</Text>}

      <TouchableOpacity onPress={handleVerify} disabled={loading}>
        <Text>{loading ? 'Verifying...' : 'Verify Email'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResend} disabled={resending}>
        <Text>{resending ? 'Sending...' : 'Resend code'}</Text>
      </TouchableOpacity>
    </View>
  );
}

✅  NOTE  Style the TextInput and buttons using your existing design system components (TextField etc). The logic above is what matters — replace the raw View/Text/TextInput with your custom components.

7.3  Step 3 — Profile Screen  (already exists, wire it up)
File: app/(auth)/signup/profile.tsx
This screen collects display name, location, and bio. Save them to Zustand — do NOT call Supabase yet. The Supabase update happens after the declaration step.

import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useSignupStore } from '../../../src/lib/store/signup.store';

export default function ProfileScreen() {
  const router = useRouter();
  const { setProfile } = useSignupStore();

  const [displayName, setDisplayName] = useState('');
  const [location, setLocation]       = useState('');
  const [bio, setBio]                 = useState('');

  const handleNext = () => {
    if (!displayName || !location) {
      // show validation error
      return;
    }
    // Save to Zustand — no Supabase call here
    setProfile(displayName, location, bio);
    router.push('/(auth)/signup/declaration');
  };

  // ... JSX wiring displayName/location/bio to your TextField components
}

7.4  Step 4 — Declaration Screen  (already exists, wire it up)
File: app/(auth)/signup/declaration.tsx
This screen collects the community agreement acceptance and the has_had_pet declaration. On submit, it calls Supabase to update the public.users profile with all the data collected so far.

import { useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../../src/lib/supabase/client';
import { useSignupStore } from '../../../src/lib/store/signup.store';
import { useAuthStore } from '../../../src/lib/store/auth.store';

export default function DeclarationScreen() {
  const router = useRouter();
  const { displayName, location, bio, setDeclaration, clearSignup } = useSignupStore();
  const { session, fetchProfile } = useAuthStore();

  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(false);
  const [checked3, setChecked3] = useState(false);
  const [hasHadPet, setHasHadPet] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const allChecked = checked1 && checked2 && checked3;

  const handleSubmit = async () => {
    if (!allChecked) {
      setError('Please accept all community standards to continue.');
      return;
    }
    if (!session?.user?.id) return;

    setLoading(true);
    setDeclaration(true, hasHadPet);

    // NOW we update public.users with all collected data
    const { error: updateError } = await supabase
      .from('users')
      .update({
        full_name: displayName,   // use display name as full_name
        bio,
        city: location,
        has_had_pet: hasHadPet,
      })
      .eq('id', session.user.id);

    setLoading(false);

    if (updateError) {
      setError('Something went wrong. Please try again.');
      return;
    }

    // Refresh profile in auth store
    await fetchProfile(session.user.id);

    // Clear signup store — no longer needed
    clearSignup();

    // Navigate to KYC
    router.push('/(auth)/kyc/submit');
  };

  // ... JSX wiring checkboxes and handleSubmit
}


8.  onAuthStateChange — Quick Reference
Section 2.3 explains onAuthStateChange in full detail. This is a quick reference of every event and what is already handled automatically by the root layout.

Event	When it fires	What to do
SIGNED_IN	User signs in or OTP is verified	Fetch profile → navigate based on kyc_status
USER_UPDATED	User verifies email or changes password	Refresh profile in Zustand
SIGNED_OUT	User manually logs out	Call clearAuth() → navigate to welcome screen
TOKEN_REFRESHED	Session token auto-refreshed	Update session in Zustand (setSession already handles this)
INITIAL_SESSION	App boots with existing session	Same as SIGNED_IN

The existing onAuthStateChange in _layout.tsx already calls setSession on every event. That is sufficient — the navigation logic in the useEffect handles the routing.


9.  Sign In Screen
File: app/(auth)/login.tsx  (create if it does not exist)
Sign in is straightforward — one Supabase call. The onAuthStateChange listener (Section 2.3) and the navigation useEffect in _layout.tsx (Section 5) handle where the user goes after signing in. You do not need any router.push() here.

import { useState } from 'react';
import { supabase } from '../../src/lib/supabase/client';

export default function LoginScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError('Invalid email or password.');
    }
    // No navigation here — onAuthStateChange fires SIGNED_IN
    // and the root layout useEffect handles navigation
  };

  // ... JSX
}


9.  Cloudinary — KYC Document Upload
KYC documents (ID images and selfie) must be uploaded to Cloudinary before the URLs are saved to Supabase. This section covers creating and configuring the Cloudinary account, setting up the upload preset, what environment variables are needed, and the full upload code for the KYC screen.

9.1  Create a Cloudinary Account
If the account does not exist yet, follow these steps:

1.	Go to https://cloudinary.com and click Sign Up Free.
2.	Fill in your name, email, and password. Choose a Cloud Name — this is permanent and will appear in all your asset URLs. For PawTaker use something like pawtaker or pawtaker-app.
3.	Verify your email address.
4.	You will land on the Cloudinary Dashboard. This is where all your credentials live.

✅  NOTE  The free tier gives 25 GB storage and 25 GB bandwidth per month — more than enough for development and early production.

9.2  Find Your Credentials
On the Cloudinary Dashboard homepage you will see your credentials immediately. You need three of them:

Credential	What it is and where to find it
Cloud Name	Your unique Cloudinary identifier. Shown at the top of the Dashboard. Appears in every upload URL.
API Key	Your public API identifier. Shown on the Dashboard under API Keys section.
API Secret	Your private secret. Shown on the Dashboard — click the eye icon to reveal it. NEVER put this in your React Native app code.

🚫  IMPORTANT  The API Secret must NEVER go in your React Native code. It belongs only in server-side code (Supabase Edge Functions). For the KYC upload from the mobile app we use an unsigned upload preset instead — explained in 9.3.

9.3  Create the KYC Upload Preset
An upload preset is a saved set of upload rules. For KYC documents we need a preset that:
•	Stores files in the pawtaker/kyc/ folder
•	Restricts access so the URLs are NOT publicly guessable
•	Only allows image file types
•	Is unsigned — so the mobile app can upload without exposing the API secret

Follow these steps in the Cloudinary Dashboard:

5.	Go to Settings (gear icon, top right)
6.	Click the Upload tab
7.	Scroll down to Upload Presets
8.	Click Add upload preset
9.	Fill in the following fields:

Field	Value to set
Preset name	pawtaker_kyc  (copy this exactly — it goes in your .env file)
Signing mode	Unsigned  ← very important, select this
Folder	pawtaker/kyc
Allowed formats	jpg, jpeg, png, heic  (images only — no PDFs or videos for KYC)
Access mode	Authenticated  ← this makes URLs non-public
Overwrite	Off  (each upload gets a unique ID)

10.	Click Save

✅  NOTE  Setting Access mode to Authenticated means the returned URL will NOT work as a direct public link. Only your admin panel (using the API Key + Secret) can access the image. This is the correct security model for KYC documents per the SRS (Section 4.2).

9.4  Create the Environment Variables
Add these to your .env file in the root of the React Native project. Never commit this file to Git.

# .env

# Supabase (already exists)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Cloudinary
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=pawtaker-app
EXPO_PUBLIC_CLOUDINARY_KYC_PRESET=pawtaker_kyc

# NOTE: API Key and API Secret do NOT go here.
# They are only used server-side in Supabase Edge Functions.

⚠️  NOTE  In Expo, any env variable prefixed with EXPO_PUBLIC_ is accessible in your app code via process.env.EXPO_PUBLIC_... — it is safe for public values like cloud name and preset name. Never prefix your API Secret with EXPO_PUBLIC_.

9.5  Install Required Packages
The KYC screen needs two packages — one for picking images from the device, and one for compressing them before upload:

npx expo install expo-image-picker
npx expo install expo-image-manipulator

No Cloudinary SDK is needed. The upload is done via a direct fetch() call to the Cloudinary REST API — this is the most reliable method for Expo apps and requires no additional dependencies.

9.6  Create the Cloudinary Upload Utility
File: src/lib/cloudinary/upload.ts
Create this utility file. It handles image compression and the upload fetch call. Import it into any screen that needs to upload images.

import * as ImageManipulator from 'expo-image-manipulator';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const KYC_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_KYC_PRESET!;

const UPLOAD_URL =
  `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

type UploadResult = {
  secure_url: string;       // the CDN URL — save this to Supabase
  public_id:  string;       // the Cloudinary asset ID — save for deletion
};

/**
 * Compresses an image and uploads it to Cloudinary.
 * Returns the secure_url and public_id to store in Supabase.
 *
 * @param localUri  - the local file URI from expo-image-picker
 * @param preset    - the upload preset name (use KYC_PRESET for KYC docs)
 */
export async function uploadToCloudinary(
  localUri: string,
  preset: string = KYC_PRESET
): Promise<UploadResult> {

  // Step 1 — Compress the image before uploading
  // KYC docs don't need to be huge — 1200px wide is plenty
  const compressed = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: 1200 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );

  // Step 2 — Build the FormData payload
  const formData = new FormData();
  formData.append('file', {
    uri:  compressed.uri,
    type: 'image/jpeg',
    name: `kyc_${Date.now()}.jpg`,
  } as any);
  formData.append('upload_preset', preset);

  // Step 3 — POST to Cloudinary REST API
  const response = await fetch(UPLOAD_URL, {
    method: 'POST',
    body:   formData,
  });

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(errorBody?.error?.message || 'Cloudinary upload failed');
  }

  const data = await response.json();

  // Step 4 — Return what needs to be stored in Supabase
  return {
    secure_url: data.secure_url,   // full CDN URL
    public_id:  data.public_id,    // e.g. 'pawtaker/kyc/abc123'
  };
}

9.7  Wire the KYC Submit Screen
File: app/(auth)/kyc/submit.tsx
This screen needs to: (1) let the user pick images, (2) upload each image to Cloudinary, (3) save the URLs and public_ids to Supabase kyc_submissions table, and (4) update public.users.kyc_status to pending.

import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../../src/lib/supabase/client';
import { useAuthStore } from '../../../src/lib/store/auth.store';
import { uploadToCloudinary } from '../../../src/lib/cloudinary/upload';

export default function KYCSubmitScreen() {
  const router = useRouter();
  const { session, fetchProfile } = useAuthStore();

  // Local state for the three images required
  const [idImage1, setIdImage1] = useState<string | null>(null);  // front of ID
  const [idImage2, setIdImage2] = useState<string | null>(null);  // back of ID
  const [selfie,   setSelfie]   = useState<string | null>(null);  // selfie
  const [docType,  setDocType]  = useState('');                   // Passport / ID Card etc.

  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState<string | null>(null);
  const [progress, setProgress] = useState('');  // feedback during upload

  // ── Pick an image from the device camera or gallery ──
  const pickImage = async (
    setter: (uri: string) => void
  ) => {
    // Request permission first
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('Camera roll permission is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,       // we compress in uploadToCloudinary
    });

    if (!result.canceled && result.assets[0]) {
      setter(result.assets[0].uri);
    }
  };

  // ── Or take a photo directly with the camera ──
  const takePhoto = async (setter: (uri: string) => void) => {
    const { status } =
      await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setError('Camera permission is required.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setter(result.assets[0].uri);
    }
  };

  // ── Submit all three images ──
  const handleSubmit = async () => {
    if (!idImage1 || !idImage2 || !selfie || !docType) {
      setError('Please upload both ID images and a selfie.');
      return;
    }
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Upload each image to Cloudinary one by one
      setProgress('Uploading ID front...');
      const img1 = await uploadToCloudinary(idImage1);

      setProgress('Uploading ID back...');
      const img2 = await uploadToCloudinary(idImage2);

      setProgress('Uploading selfie...');
      const img3 = await uploadToCloudinary(selfie);

      setProgress('Saving submission...');

      // Insert into kyc_submissions table
      const { error: insertError } = await supabase
        .from('kyc_submissions')
        .insert({
          user_id:       session.user.id,
          id_image_1_url: img1.secure_url,
          id_image_2_url: img2.secure_url,
          selfie_url:    img3.secure_url,
          // Store public_ids so admin can delete them from Cloudinary if rejected
          cloudinary_public_ids: JSON.stringify([
            img1.public_id,
            img2.public_id,
            img3.public_id,
          ]),
          status: 'pending',
        });

      if (insertError) throw insertError;

      // Update kyc_status on the user's profile
      const { error: updateError } = await supabase
        .from('users')
        .update({ kyc_status: 'pending' })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      // Refresh profile in auth store
      await fetchProfile(session.user.id);

      // Navigate to pending screen
      router.replace('/(auth)/kyc/pending');

    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  // ... JSX: render three image upload areas + document type picker
  // Each area shows a placeholder, the picked image preview,
  // and buttons for Pick from gallery / Take photo
  // Show progress string during upload
  // Submit button calls handleSubmit
}

9.8  What Cloudinary Returns — Full Response Object
When uploadToCloudinary() succeeds, Cloudinary returns a JSON object. Here are the fields you need to know about:

Field	Description and whether to save it
secure_url	✅ SAVE TO SUPABASE — the full HTTPS CDN URL of the uploaded image. This is what goes into id_image_1_url, id_image_2_url, selfie_url columns.
public_id	✅ SAVE TO SUPABASE — the unique asset identifier in Cloudinary (e.g. pawtaker/kyc/abc123). Save in cloudinary_public_ids array. Needed to delete the asset later.
resource_type	Always 'image' for our uploads. No need to save.
format	File format e.g. 'jpg'. No need to save.
width / height	Image dimensions in pixels. No need to save.
bytes	File size in bytes. No need to save.
created_at	Upload timestamp. No need to save — Supabase has its own created_at.
version	Cloudinary version number. No need to save.

9.9  Folder Structure in Cloudinary
Per the database design document, the following folder structure must be maintained in Cloudinary. The KYC preset you created already sets the folder to pawtaker/kyc automatically:

Cloudinary Folder	Used For
pawtaker/kyc/	KYC ID images and selfies — authenticated access only (this section)
pawtaker/profiles/	User profile photos — public read
pawtaker/pets/	Pet photos — public read
pawtaker/checkins/	Check-in photos/videos — authenticated read
pawtaker/messages/	Message attachments — authenticated read

✅  NOTE  For now only pawtaker/kyc is needed. Other folders and their presets will be created in future implementation documents as those features are built.


10.  Implementation Checklist
Use this checklist to track progress. Complete items in order.

Supabase Dashboard
11.	Go to Authentication → Notifications → Email → Templates → Confirm sign up → replace template with {{ .Token }} version → Save
12.	Go to Authentication → Configuration → Sign In / Providers → Email → set OTP Expiration to 3600 → Save
13.	Go to SQL Editor → run handle_new_user function + trigger
14.	Go to SQL Editor → run handle_email_verified function + trigger
15.	Verify both functions appear in Database → Functions

Cloudinary Dashboard
16.	Create Cloudinary account at cloudinary.com if not already done
17.	Note your Cloud Name, API Key from the Dashboard
18.	Go to Settings → Upload → Upload Presets → Add upload preset
19.	Create pawtaker_kyc preset: Unsigned, folder=pawtaker/kyc, access=Authenticated, formats=jpg,jpeg,png,heic → Save

Code — Environment Variables
20.	Add EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME to .env
21.	Add EXPO_PUBLIC_CLOUDINARY_KYC_PRESET to .env
22.	Confirm .env is in .gitignore

Code — Packages
23.	npx expo install expo-image-picker
24.	npx expo install expo-image-manipulator
25.	npx expo install expo-secure-store  (if not already installed)

Code — Supabase Client
26.	Confirm src/lib/supabase/client.ts uses ExpoSecureStoreAdapter with autoRefreshToken: true, persistSession: true, detectSessionInUrl: false (see Section 2.2)

Code — Stores
27.	Update src/lib/store/auth.store.ts to add profile, fetchProfile, and clearAuth
28.	Create src/lib/store/signup.store.ts with all signup step fields

Code — Cloudinary Utility
29.	Create src/lib/cloudinary/upload.ts with uploadToCloudinary function

Code — Screens
30.	Update app/_layout.tsx — replace navigation useEffect with profile-aware version
31.	Update app/(auth)/_layout.tsx — add signup/verify to route list
32.	Wire app/(auth)/signup/credentials.tsx — connect state + supabase.auth.signUp()
33.	Create app/(auth)/signup/verify.tsx — full OTP verification screen
34.	Wire app/(auth)/signup/profile.tsx — connect state to Zustand only (no Supabase call)
35.	Wire app/(auth)/signup/declaration.tsx — connect state + final Supabase update
36.	Wire app/(auth)/kyc/submit.tsx — image picker + Cloudinary upload + Supabase insert
37.	Create or wire app/(auth)/login.tsx — signInWithPassword

Testing
38.	Sign up with a real email — confirm OTP code arrives in inbox
39.	Enter wrong OTP — confirm error message shown
40.	Enter correct OTP — confirm navigation to Profile screen
41.	Complete all steps — confirm public.users row has all fields populated
42.	Kill app mid-signup and reopen — confirm user is resumed at correct step
43.	Submit KYC — confirm images appear in Cloudinary under pawtaker/kyc folder
44.	Confirm kyc_submissions row exists in Supabase with all three URLs
45.	Confirm public.users.kyc_status = pending after KYC submit
46.	Sign out and sign back in — confirm navigation goes straight to /(private)/(tabs)


11.  Common Errors & How to Fix Them

Error	Fix
Email template still sends a link not a code	Check you saved the template after editing. Make sure {{ .Token }} is present with the correct double curly braces.
verifyOtp returns 'Token has expired'	OTP codes expire in 1 hour. User must request a resend. Check expiration is set to 3600 in dashboard.
public.users row not created after signup	The trigger is not running. Check SQL Editor → Database → Functions that handle_new_user exists. Re-run the SQL if needed.
profile is null after sign in	fetchProfile is not being called. Ensure it is called in the navigation useEffect after session is detected.
verifyOtp error 'invalid type'	You are using type: 'signup' which is deprecated. Change to type: 'email'.
User stuck in signup loop	The navigation conditions in _layout.tsx are checking the wrong profile fields. Console.log the profile object to debug.
Email not arriving	Supabase free tier has rate limits on built-in email (3 emails per hour per address during dev). Wait or use a different test email.
Cloudinary: 'Upload preset must be specified'	The upload_preset field is missing from the FormData. Check uploadToCloudinary() is appending preset correctly.
Cloudinary: 'Upload preset not found'	The preset name in .env does not match what was created in the Cloudinary dashboard. They must be identical.
Cloudinary: 'Invalid image file'	The file URI from expo-image-picker is not being passed correctly. Make sure the FormData file object has uri, type, and name fields.
Cloudinary upload succeeds but URL returns 404	This is expected — the access mode is Authenticated, so the URL is not publicly accessible. Only the admin panel can view it using signed URLs.
expo-image-manipulator not found	Run: npx expo install expo-image-manipulator
Permission denied for camera/gallery	Call requestMediaLibraryPermissionsAsync() or requestCameraPermissionsAsync() before launching the picker.


End of Document  •  PawTaker Auth Implementation Guide  •  v1.2  •  March 2026
