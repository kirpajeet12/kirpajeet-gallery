import { defineAuth } from '@aws-amplify/backend';

/**
 * Email login. Only signed-in users (you) can upload.
 * Guests/visitors can view the gallery without logging in.
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
});
