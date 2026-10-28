// Storage, Ingestion, Quota Limits and Voice Safety Configuration

export const STORAGE_LIMITS = {
  // 25 MB max file size
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
    // Maximum turns in conversational script
    MAX_SCRIPT_TURNS: 40,
    // Maximum characters per turn
    MAX_CHARS_PER_TURN: 600,
    // Maximum total audio duration per notebook (in minutes)
    MAX_AUDIO_MINUTES_PER_NOTEBOOK: 60,
    // Rate limit for voice generation: max 5 requests per 10 minutes
    MAX_GENERATIONS_PER_WINDOW: 5,
    WINDOW_SECONDS: 600,
  },
} as const;

