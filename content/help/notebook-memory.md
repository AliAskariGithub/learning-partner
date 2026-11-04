---
title: "Notebook Memory and Consolidation"
summary: "How Learning Partner extracts and maintains long-term study context, conceptual mastery, and topic weaknesses across sessions."
category: "Workspace Memory"
order: 6
lastUpdated: "November 4, 2026"
relatedArticles: ["getting-started", "modes", "account-and-data"]
---

## What is Notebook Memory?

Standard AI chatbots suffer from session amnesia: as soon as you close your browser tab or start a new conversation, the AI forgets what concepts you already mastered, what questions confused you, and what study style you prefer.

Learning Partner solves this with **Shared Notebook Memory**. 

---

## How Consolidation Works

1. **Background Extraction**: During conversations in Chat, Learning, or Quiz modes, our consolidation worker analyzes dialogue turns.
2. **Key Insight Extraction**: The worker identifies:
   - Concepts you understand thoroughly.
   - Topics where you experienced difficulty or answered incorrectly on quizzes.
   - Specific analogies, terminology, or frameworks that helped you learn.
3. **Structured Storage**: These items are stored as concise memory notes linked to your specific notebook ID.
4. **Context Injection**: On future prompts within the same notebook, these memory items are seamlessly provided to the AI model so explanations can reference prior discussions without you having to re-explain.

---

## Reviewing and Editing Memory

You maintain complete oversight of what your study partner remembers:

1. Open your notebook and click the **Memory** icon in the header bar.
2. View all active memory items organized by category.
3. You can edit any memory note or click the trash icon to delete specific observations.
4. To wipe all memory for a notebook, click **Clear All Notebook Memory**.

---

## Disabling Memory

If you prefer completely stateless sessions:
- In the notebook settings menu, toggle **Use Shared Memory** to `OFF`.
- When disabled, no background consolidation runs, and previous memory notes are excluded from prompt generation.

