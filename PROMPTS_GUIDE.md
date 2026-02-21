# Prompts Guide - Condensed & Readable

## Overview

All prompts have been rewritten to be:
- ✅ **Concise** - Readable in < 1 minute
- ✅ **Clear** - Bullet points where possible
- ✅ **Action-oriented** - Tell the model exactly what to do
- ✅ **Web search ready** - Deep research now uses real internet data with citations

---

## 1. Definition Prompt (auto_define)

**What it does:** Creates quick definition cards for terms mentioned in lectures

**Prompt:**
```
Define this term in 1-3 sentences using the lecture context.

Term: {term}
Context: {context}

Brief definition only - no citations needed.
```

**Example Output:**
```
Photosynthesis: The process by which plants convert light energy into chemical 
energy stored in glucose, using water and carbon dioxide.
```

---

## 2. Deep Research Prompt (with Web Search)

**What it does:** Creates comprehensive research cards using real-time web data

**Prompt:**
```
Explain this topic thoroughly for a student:

Topic: {term}
Lecture Context: {context}

Structure your answer:
• **What it is** - Core definition
• **Why it matters** - Real-world relevance  
• **Key examples** - 2-3 concrete cases
• **How it connects** - Relationship to the lecture topic

Use web search results to provide current information and examples.
```

**Example Output:**
```
**What it is:**
Machine learning is a subset of artificial intelligence that enables systems
to learn and improve from experience without being explicitly programmed.

**Why it matters:**
ML powers recommendation systems (Netflix), autonomous vehicles, medical diagnosis,
and natural language processing applications we use daily.

**Key examples:**
1. Netflix recommendations - learns from your watch history
2. Spam filters - learns to identify unwanted emails
3. Voice assistants - learns your speech patterns

**How it connects:**
In our lecture on AI fundamentals, this shows how systems move from rule-based
programming to learning-based systems that adapt over time.

**Sources:**
• Machine Learning Basics - https://example.com/ml-basics
• AI Applications 2025 - https://example.com/ai-apps
```

---

## 3. Web Search Integration

**Model Used:** `groq/compound`
- Built-in web search powered by **Tavily**
- Automatic real-time data retrieval
- No additional API keys needed

**Search Filtering:**
```python
search_settings = {
    "exclude_domains": [
        "twitter.com",     # Skip social media noise
        "x.com",
        "instagram.com"
    ]
}
```

**Citation Format:**
```json
{
  "citations": [
    {
      "title": "Article Title",
      "url": "https://example.com/article",
      "domain": "example.com"
    }
  ],
  "sources": [
    {
      "url": "https://example.com/article",
      "title": "Article Title",
      "snippet": "Preview text from the article...",
      "relevance": 0.92  // 0-1 score
    }
  ]
}
```

---

## 4. Key Improvements

| Feature | Before | After |
|---------|--------|-------|
| Definitions | Generic LLM response | Fast LLM definition |
| Deep Research | LLM only (no sources) | **Web search + Citations** |
| Research Quality | Outdated/limited | **Current + Verified** |
| Citations | None | **Top 5 sources with URLs** |
| Relevance Scores | N/A | **0-1 relevance ranking** |
| Speed | Slower | **Faster with streaming** |

---

## 5. Flow Diagram

```
Lecture → Key Term Detected
           ↓
     Auto-Define
     (Quick definition)
           ↓
     Deep Research Request
     (20-30 sec throttle)
           ↓
     groq/compound Model
     (With Web Search)
           ↓
     Extract Search Results
     (URLs, titles, snippets)
           ↓
     Format Citations
     (Top 5 sources)
           ↓
     Send to Frontend
     (Card with references)
```

---

## 6. Response Structure

**Auto-Define Card:**
```json
{
  "type": "auto_define",
  "term": "Photosynthesis",
  "content": "The process by which...",
  "citations": [],
  "sources": [],
  "badge_type": "concept"
}
```

**Deep Research Card (with Sources):**
```json
{
  "type": "deep_research",
  "term": "Machine Learning",
  "content": "Explain this topic thoroughly...",
  "citations": [
    {"title": "ML Guide", "url": "https://...", "domain": "example.com"},
    {"title": "AI Trends", "url": "https://...", "domain": "example.com"}
  ],
  "sources": [
    {"url": "https://...", "title": "ML Guide", "snippet": "...", "relevance": 0.92}
  ],
  "badge_type": "research"
}
```

---

## 7. Troubleshooting

**If definitions aren't showing:**
1. Check `MIN_PIPELINE_INTERVAL = 20s` waiting period
2. Verify Groq API key is set
3. Check logs for `✅ Analysis complete`

**If deep research has no citations:**
1. Confirm `groq/compound` model is used
2. Check for `executed_tools` in response
3. Verify web search is enabled

**If sources are empty:**
1. Check `search_settings` filtering
2. Verify Tavily is working
3. Look for `[Groq]` logging with source count

---

## Summary

✅ **Prompts are now clear & concise**
✅ **Deep research uses real web data**  
✅ **Citations included automatically**
✅ **Sources ranked by relevance**
✅ **No extra API keys needed**
