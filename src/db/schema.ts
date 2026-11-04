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
    lastMode: text('last_mode', {
      enum: ['chat', 'learn', 'quiz'],
    })
      .default('chat')
      .notNull(),
    useMemory: boolean('use_memory').default(true).notNull(),
    learningModeGrounding: text('learning_mode_grounding', {
      enum: ['sources_only', 'sources_first'],
    })
      .default('sources_first')
      .notNull(),
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

// Connections table (Phase 5 Unified AI Connection Architecture)
export const connections = pgTable(
  'connections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    provider: text('provider', {
      enum: ['gemini', 'chatgpt', 'anthropic', 'openai', 'openrouter', 'groq', 'omniroute', 'custom'],
    }).notNull(),
    method: text('method', {
      enum: ['api_key', 'oauth_plan', 'oauth_key', 'custom_endpoint'],
    }).notNull(),
    callMode: text('call_mode', {
      enum: ['server', 'browser'],
    })
      .default('server')
      .notNull(),
    baseUrl: text('base_url'),
    status: text('status', {
      enum: ['connected', 'capped_or_exhausted', 'not_eligible', 'expired', 'revoked', 'error'],
    })
      .default('connected')
      .notNull(),
    encryptedAccessToken: text('encrypted_access_token'),
    encryptedRefreshToken: text('encrypted_refresh_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    grantedScopes: jsonb('granted_scopes').$type<string[]>(),
    accountLabel: text('account_label'),
    modelCapabilityOverrides: jsonb('model_capability_overrides').$type<Record<string, Record<string, boolean>>>(),
    lastError: text('last_error'),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    isDefault: boolean('is_default').default(false).notNull(),
    autoFallback: boolean('auto_fallback').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('connections_user_id_idx').on(table.userId),
    index('connections_provider_idx').on(table.provider),
    index('connections_status_idx').on(table.status),
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
export interface ChatImageAttachment {
  id: string;
  url: string;
  storageKey?: string;
  mimeType: string;
  fileName?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
}

export interface ThoughtTimelineStep {
  phase: string;
  detail?: string;
  elapsedMs?: number;
  timestamp?: number;
}

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
    images: jsonb('images').$type<ChatImageAttachment[]>(),
    thoughtTimeline: jsonb('thought_timeline').$type<ThoughtTimelineStep[]>(),
    reasoningSummary: text('reasoning_summary'),
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

// Phase 6: Shared Notebook Memory Table (One Context per Notebook)
export const notebookMemory = pgTable(
  'notebook_memory',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    notebookId: uuid('notebook_id')
      .notNull()
      .unique()
      .references(() => notebooks.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    summary: text('summary').default('').notNull(),
    version: integer('version').default(1).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('notebook_memory_notebook_id_idx').on(table.notebookId),
    index('notebook_memory_user_id_idx').on(table.userId),
  ]
);

// Phase 6: Durable Memory Items Table
export const memoryItemTypeEnum = [
  'goal',
  'preference',
  'knowledge_level',
  'misconception',
  'weak_topic',
  'strong_topic',
  'decision',
  'fact',
] as const;

export type MemoryItemType = typeof memoryItemTypeEnum[number];

export const memoryItems = pgTable(
  'memory_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    notebookId: uuid('notebook_id')
      .notNull()
      .references(() => notebooks.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    type: text('type', {
      enum: memoryItemTypeEnum,
    }).notNull(),
    text: text('text').notNull(),
    sourceConversationId: uuid('source_conversation_id')
      .references(() => conversations.id, { onDelete: 'set null' }),
    sourceMode: text('source_mode', {
      enum: ['chat', 'learn', 'quiz'],
    }),
    confidence: integer('confidence').default(85).notNull(),
    pinned: boolean('pinned').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('memory_items_notebook_id_idx').on(table.notebookId),
    index('memory_items_user_id_idx').on(table.userId),
    index('memory_items_type_idx').on(table.type),
    index('memory_items_pinned_idx').on(table.pinned),
  ]
);

// Phase 6: Cross-Conversation Message Chunks for Hybrid Retrieval
export const messageChunks = pgTable(
  'message_chunks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    messageId: uuid('message_id')
      .references(() => messages.id, { onDelete: 'cascade' }),
    notebookId: uuid('notebook_id')
      .notNull()
      .references(() => notebooks.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    chunkIndex: integer('chunk_index').default(0).notNull(),
    content: text('content').notNull(),
    searchVector: tsvector('search_vector'),
    embedding: vector('embedding', { dimensions: 1536 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('message_chunks_notebook_id_idx').on(table.notebookId),
    index('message_chunks_conversation_id_idx').on(table.conversationId),
    index('message_chunks_user_id_idx').on(table.userId),
    index('message_chunks_search_vector_idx').using('gin', table.searchVector),
  ]
);

// Phase 6: Quiz Attempts with Live Scoring and Topic Tags
export interface QuizPerQuestionResult {
  questionId: string;
  question: string;
  options: string[];
  selectedAnswer: number | string | number[];
  correctAnswer: number | string | number[];
  isCorrect: boolean;
  explanation?: string;
  topicTags?: string[];
  citationSnippet?: string;
}

export const quizAttempts = pgTable(
  'quiz_attempts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    quizId: text('quiz_id').notNull(),
    userId: text('user_id').notNull(),
    notebookId: uuid('notebook_id')
      .notNull()
      .references(() => notebooks.id, { onDelete: 'cascade' }),
    answers: jsonb('answers').notNull(),
    score: integer('score').notNull(),
    totalQuestions: integer('total_questions').notNull(),
    durationSeconds: integer('duration_seconds').default(0),
    perQuestionResults: jsonb('per_question_results').$type<QuizPerQuestionResult[]>(),
    completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('quiz_attempts_notebook_id_idx').on(table.notebookId),
    index('quiz_attempts_user_id_idx').on(table.userId),
    index('quiz_attempts_quiz_id_idx').on(table.quizId),
    index('quiz_attempts_completed_at_idx').on(table.completedAt),
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

export type Connection = typeof connections.$inferSelect;
export type NewConnection = typeof connections.$inferInsert;

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type StudioOutput = typeof outputs.$inferSelect;
export type NewStudioOutput = typeof outputs.$inferInsert;

export type NotebookMemory = typeof notebookMemory.$inferSelect;
export type NewNotebookMemory = typeof notebookMemory.$inferInsert;

export type MemoryItem = typeof memoryItems.$inferSelect;
export type NewMemoryItem = typeof memoryItems.$inferInsert;

export type MessageChunk = typeof messageChunks.$inferSelect;
export type NewMessageChunk = typeof messageChunks.$inferInsert;

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type NewQuizAttempt = typeof quizAttempts.$inferInsert;

// Phase 7: Public Inquiries & Support Messaging
export const contactMessages = pgTable(
  'contact_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id'),
    name: text('name').notNull(),
    email: text('email').notNull(),
    topic: text('topic', {
      enum: ['general', 'support', 'partnership', 'other'],
    }).notNull(),
    message: text('message').notNull(),
    status: text('status', {
      enum: ['new', 'read', 'replied', 'archived'],
    })
      .default('new')
      .notNull(),
    ipHash: text('ip_hash').notNull(),
    userAgent: text('user_agent'),
    emailStatus: text('email_status', {
      enum: ['sent', 'failed', 'skipped'],
    })
      .default('skipped')
      .notNull(),
    adminNote: text('admin_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('contact_messages_user_id_idx').on(table.userId),
    index('contact_messages_status_idx').on(table.status),
    index('contact_messages_created_at_idx').on(table.createdAt),
  ]
);

export type ContactMessage = typeof contactMessages.$inferSelect;
export type NewContactMessage = typeof contactMessages.$inferInsert;

// Phase 7: Bug Reports & User Feedback
export const feedbackReports = pgTable(
  'feedback_reports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id'),
    type: text('type', {
      enum: ['bug', 'idea', 'other'],
    }).notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    stepsToReproduce: text('steps_to_reproduce'),
    expectedResult: text('expected_result'),
    actualResult: text('actual_result'),
    severity: text('severity', {
      enum: ['low', 'medium', 'high'],
    })
      .default('medium')
      .notNull(),
    screenshotUrl: text('screenshot_url'),
    contextUrl: text('context_url'),
    browserInfo: text('browser_info'),
    osInfo: text('os_info'),
    appVersion: text('app_version'),
    status: text('status', {
      enum: ['new', 'triaged', 'in_progress', 'done', 'wontfix'],
    })
      .default('new')
      .notNull(),
    emailStatus: text('email_status', {
      enum: ['sent', 'failed', 'skipped'],
    })
      .default('skipped')
      .notNull(),
    adminNote: text('admin_note'),
    ipHash: text('ip_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('feedback_reports_user_id_idx').on(table.userId),
    index('feedback_reports_type_idx').on(table.type),
    index('feedback_reports_status_idx').on(table.status),
    index('feedback_reports_created_at_idx').on(table.createdAt),
  ]
);

export type FeedbackReport = typeof feedbackReports.$inferSelect;
export type NewFeedbackReport = typeof feedbackReports.$inferInsert;

// Persistent Storage Files table (Fallback storage for serverless deployments like Vercel)
export const storageFiles = pgTable(
  'storage_files',
  {
    key: text('key').primaryKey(),
    mimeType: text('mime_type').notNull(),
    data: text('data').notNull(), // base64 payload
    size: integer('size').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  }
);

export type StorageFile = typeof storageFiles.$inferSelect;
export type NewStorageFile = typeof storageFiles.$inferInsert;



