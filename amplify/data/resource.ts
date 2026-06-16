import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Memory: a
    .model({
      caption: a.string(),
      imageKey: a.string().required(),
      musicKey: a.string(),
      musicTitle: a.string(),
      order: a.integer().default(0),
    })
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated('identityPool').to(['create', 'read', 'update', 'delete']),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'identityPool',
  },
});
