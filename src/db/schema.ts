import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  vector,
  customType,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';

// Custom tsvector type for full-text search
export const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

export interface Citation {
  citationNumber: number;
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  pageNumber: number | null;
  snippet: string;
}

export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  authUserId: text('auth_user_id').notNull().unique(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  customInstructions: text('custom_instructions'),
  preferredLanguage: text('preferred_language').default('en'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Notebooks table
export const notebooks = pgTable(
  'notebooks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    instructions: text('instructions'),
    pinned: boolean('pinned').default(false).notNull(),
    lastModel: text('last_model'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('notebooks_user_id_idx').on(table.userId),
    index('notebooks_pinned_idx').on(table.pinned),
  ]
);

// Sources table
export const sources = pgTable(
  'sources',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    notebookId: uuid('notebook_id')
      .notNull()
      .references(() => notebooks.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    type: text('type', {
      enum: ['pdf', 'docx', 'txt', 'md', 'url', 'text'],
    }).notNull(),
    title: text('title').notNull(),
    originalUrl: text('original_url'),
    storageKey: text('storage_key'),
    extractedText: text('extracted_text'),
    wordCount: integer('word_count').default(0).notNull(),
    status: text('status', {
      enum: ['pending', 'processing', 'ready', 'failed'],
    })
      .default('pending')
      .notNull(),
    errorMessage: text('error_message'),
    enabled: boolean('enabled').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('sources_notebook_id_idx').on(table.notebookId),
    index('sources_user_id_idx').on(table.userId),
    index('sources_status_idx').on(table.status),
  ]
);

// Source chunks table with tsvector & vector(1536)
export const sourceChunks = pgTable(
  'source_chunks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sourceId: uuid('source_id')
      .notNull()
      .references(() => sources.id, { onDelete: 'cascade' }),
    notebookId: uuid('notebook_id')
      .notNull()
      .references(() => notebooks.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    chunkIndex: integer('chunk_index').notNull(),
    content: text('content').notNull(),
    pageNumber: integer('page_number'),
    tokenCount: integer('token_count').default(0).notNull(),
    searchVector: tsvector('search_vector'),
    embedding: vector('embedding', { dimensions: 1536 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('source_chunks_source_id_idx').on(table.sourceId),
    index('source_chunks_notebook_id_idx').on(table.notebookId),
    index('source_chunks_user_id_idx').on(table.userId),
    index('source_chunks_search_vector_idx').using('gin', table.searchVector),
  ]
);

// Notes table (Saved notes / Project Memory)
export const notes = pgTable(
  'notes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    notebookId: uuid('notebook_id')
      .notNull()
      .references(() => notebooks.id, { onDelete: 'cascade' }),
    conversationId: uuid('conversation_id')
      .references(() => conversations.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('notes_notebook_id_idx').on(table.notebookId),
    index('notes_conversation_id_idx').on(table.conversationId),
    index('notes_user_id_idx').on(table.userId),
  ]
);

// API Keys table (Bring Your Own Key - encrypted with AES-256-GCM)
export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    provider: text('provider', {
      enum: ['openai', 'anthropic', 'google', 'openrouter', 'groq', 'custom'],
    }).notNull(),
    label: text('label').notNull(),
    encryptedKey: text('encrypted_key').notNull(),
    keyLast4: text('key_last_4').notNull(),
    customBaseUrl: text('custom_base_url'),
    status: text('status', {
      enum: ['active', 'invalid', 'rate_limited'],
    })
      .default('active')
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  },
  (table) => [
    index('api_keys_user_id_idx').on(table.userId),
    index('api_keys_provider_idx').on(table.provider),
  ]
);

// Conversations table
export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    notebookId: uuid('notebook_id')
      .notNull()
      .references(() => notebooks.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    title: text('title').default('New Conversation').notNull(),
    mode: text('mode', {
      enum: ['chat', 'learn', 'quiz'],
    })
      .default('chat')
      .notNull(),
    model: text('model').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('conversations_notebook_id_idx').on(table.notebookId),
    index('conversations_user_id_idx').on(table.userId),
  ]
);

// Messages table
export const messages = pgTable(
  'messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    role: text('role', {
      enum: ['user', 'assistant', 'system'],
    }).notNull(),
    content: text('content').notNull(),
    citations: jsonb('citations').$type<Citation[]>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('messages_conversation_id_idx').on(table.conversationId),
  ]
);

// Studio Outputs table (Phase 4)
export const outputs = pgTable(
  'outputs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    notebookId: uuid('notebook_id')
      .notNull()
      .references(() => notebooks.id, { onDelete: 'cascade' }),
    conversationId: uuid('conversation_id')
      .references(() => conversations.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    type: text('type', {
      enum: ['quiz', 'flashcards', 'study_guide', 'summary', 'mind_map', 'report', 'voice'],
    }).notNull(),
    title: text('title').notNull(),
    content: text('content'),
    sourceIds: jsonb('source_ids').$type<string[]>(),
    model: text('model').notNull(),
    status: text('status', {
      enum: ['generating', 'ready', 'failed'],
    })
      .default('generating')
      .notNull(),
    errorMessage: text('error_message'),
    script: jsonb('script').$type<{ speaker: string; text: string }[]>(),
    audioKeys: jsonb('audio_keys').$type<string[]>(),
    durationSeconds: integer('duration_seconds'),
    voiceConfig: jsonb('voice_config'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('outputs_notebook_id_idx').on(table.notebookId),
    index('outputs_conversation_id_idx').on(table.conversationId),
    index('outputs_user_id_idx').on(table.userId),
    index('outputs_type_idx').on(table.type),
    index('outputs_status_idx').on(table.status),
  ]
);

// Infer Types
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type Notebook = typeof notebooks.$inferSelect;
export type NewNotebook = typeof notebooks.$inferInsert;

export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;

export type SourceChunk = typeof sourceChunks.$inferSelect;
export type NewSourceChunk = typeof sourceChunks.$inferInsert;

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type StudioOutput = typeof outputs.$inferSelect;
export type NewStudioOutput = typeof outputs.$inferInsert;

