import { integer, pgTable, real, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const songs = pgTable('songs', {
  id: uuid('id').primaryKey(),
  title: text('title').notNull(),
  duration: real('duration').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const scores = pgTable('scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  songId: uuid('song_id')
    .references(() => songs.id, { onDelete: 'cascade' })
    .notNull(),
  value: integer('value').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
