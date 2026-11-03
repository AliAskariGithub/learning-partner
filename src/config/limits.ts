// Storage, Ingestion, Quota Limits, Voice, Image and Shared Memory Configuration

export const STORAGE_LIMITS = {
  // 25 MB max file size for documents
  MAX_FILE_SIZE_BYTES: 25 * 1024 * 1024,
  MAX_FILE_SIZE_MB: 25,

  // Maximum number of sources per study notebook
  MAX_SOURCES_PER_NOTEBOOK: 50,

  // Maximum number of saved notes per notebook
  MAX_NOTES_PER_NOTEBOOK: 100,

  // Maximum number of generated studio outputs per notebook
  MAX_OUTPUTS_PER_NOTEBOOK: 100,

  // Maximum number of notebooks per user
  MAX_NOTEBOOKS_PER_USER: 30,

  // Allowed file extensions
  ALLOWED_FILE_EXTENSIONS: ['.pdf', '.docx', '.txt', '.md'],

  // Allowed MIME types
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
  ],

  // Chunking limits
  CHUNK_TARGET_TOKENS: 800,
  CHUNK_OVERLAP_TOKENS: 100,

  // Voice & Studio Safety limits
  VOICE_LIMITS: {
    MAX_SCRIPT_TURNS: 40,
    MAX_CHARS_PER_TURN: 600,
    MAX_AUDIO_MINUTES_PER_NOTEBOOK: 60,
    MAX_GENERATIONS_PER_WINDOW: 5,
    WINDOW_SECONDS: 600,
  },

  // Phase 6: Image Upload Limits
  IMAGE_LIMITS: {
    MAX_IMAGES_PER_MESSAGE: 5,
    MAX_IMAGE_SIZE_BYTES: 10 * 1024 * 1024, // 10 MB
    MAX_IMAGE_SIZE_MB: 10,
    MAX_DIMENSION_PX: 4096,
    ALLOWED_MIME_TYPES: ['image/png', 'image/jpeg', 'image/webp'] as const,
    ALLOWED_EXTENSIONS: ['.png', '.jpg', '.jpeg', '.webp'] as const,
    DISALLOWED_TYPES: ['image/svg+xml'] as const,
  },

  // Phase 6: Shared Notebook Memory Limits
  MEMORY_LIMITS: {
    MAX_SUMMARY_TOKENS: 1500,
    MAX_ITEMS_PER_NOTEBOOK: 250,
    CONSOLIDATION_DEBOUNCE_MS: 3000,
  },

  // Phase 6: Quiz Mode Limits
  QUIZ_LIMITS: {
    ALLOWED_QUESTION_COUNTS: [5, 10, 15, 20] as const,
    MAX_ATTEMPTS_PER_DAY_PER_USER: 100,
  },
} as const;
