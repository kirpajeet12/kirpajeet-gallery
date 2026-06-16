import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/**
 * Each "Memory" = one photo, optionally paired with a music track,
 * a caption, and an order index for the story sequence.
 * Visitors can READ. Only signed-in users can create/edit/delete.
 */
const schema = a.schema({
  Memory: a
    .model({
      caption: a.string(),
      imageKey: a.string().required(), // S3 key for the photo
      musicKey: a.string(),            // S3 key for the audio (optional)
      order: a.integer().default(0),   // controls story sequence
    })
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    // identityPool lets guests read; user pool covers your writes
    defaultAuthorizationMode: 'identityPool',
  },
});
