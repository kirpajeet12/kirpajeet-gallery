import { defineStorage } from '@aws-amplify/backend';

/**
 * S3 bucket. Two folders:
 *   photos/  -> gallery images
 *   music/   -> audio tracks attached to photos
 * Visitors can read (view/listen). Only you can upload/delete.
 */
export const storage = defineStorage({
  name: 'kirpajeetMedia',
  access: (allow) => ({
    'photos/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
    'music/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
  }),
});
