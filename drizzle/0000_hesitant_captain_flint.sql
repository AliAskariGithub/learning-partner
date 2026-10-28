CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" text NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"custom_instructions" text,
	"preferred_language" text DEFAULT 'en',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_auth_user_id_unique" UNIQUE("auth_user_id")
);
