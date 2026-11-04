---
title: "Account Management, Data Export, and Deletion"
summary: "Export your complete study archive in structured JSON format or permanently delete your account and all associated records."
category: "Account & Privacy"
order: 7
lastUpdated: "November 4, 2026"
relatedArticles: ["getting-started", "troubleshooting"]
---

## Managing Your Account

You can access account configuration by clicking your avatar in the sidebar footer and selecting **Settings** (or visiting `/settings`).

From the Settings dashboard, you can:
- Update your display name and profile avatar.
- Specify global custom instructions (e.g., preferred response language or field of study).
- Review active AI provider connections and encrypted API keys.
- Manage cookie consent preferences.

---

## Exporting Your Complete Study Data

In accordance with our belief in user data sovereignty and GDPR/CCPA standards, you can download everything you have created in Learning Partner at any time:

1. Navigate to [Settings](/settings).
2. Scroll to the **Data Management & Privacy** section.
3. Click **Export All Workspace Data**.
4. The system generates a clean, structured JSON file containing:
   - Your profile metadata.
   - All notebooks and instructions.
   - Source document records and extracted passage text.
   - Complete chat histories and citation links.
   - Studio outputs, flashcard decks, and quiz scores.
   - Shared notebook memory items.
   - Contact messages and feedback reports submitted under your user ID.

---

## Permanent Account Deletion

If you ever choose to leave Learning Partner, you can permanently delete your account with zero retention:

1. Go to [Settings](/settings) &rarr; **Danger Zone**.
2. Click **Delete Account and Wipe All Data**.
3. Confirm the deletion prompt.
4. The system executes a complete cascade wipe:
   - All notebooks, source files, extracted chunks, and studio outputs are erased from Postgres and object storage.
   - All encrypted API keys and connection tokens are purged.
   - Your authentication record and email are erased from Neon Auth.
   - All active session cookies are invalidated.

*Note: Account deletion is instantaneous and irreversible. We cannot recover deleted notebooks.*

