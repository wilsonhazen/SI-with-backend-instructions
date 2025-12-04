# AI Features Integration Guide

Complete guide for integrating AI capabilities throughout the Source Impact app.

---

## Table of Contents

1. [Overview](#overview)
2. [Available AI APIs](#available-ai-apis)
3. [Quick Start Examples](#quick-start-examples)
4. [Integration Patterns](#integration-patterns)
5. [Advanced Use Cases](#advanced-use-cases)
6. [Best Practices](#best-practices)

---

## Overview

Source Impact has built-in AI capabilities through `@rork-ai/toolkit-sdk` and utility helpers in `utils/ai-helpers.ts`.

### AI Models Used

| Feature | Model | Provider |
|---------|-------|----------|
| Text Generation | GPT-4 class | Rork Toolkit |
| Structured Data | GPT-4 class | Rork Toolkit |
| Image Generation | DALL-E 3 | OpenAI |
| Image Editing | Gemini 2.5 Flash Image | Google |
| Speech-to-Text | Whisper | OpenAI |
| Chat Agent | GPT-4 class | Rork Toolkit |

**Note**: Grok API is NOT available. Use the models above instead.

---

## Available AI APIs

### 1. Text Generation
Simple prompts → Text responses

```typescript
import { generateSimpleText } from '@/utils/ai-helpers';

const caption = await generateSimpleText(
  "Write an Instagram caption for a fitness post"
);
```

### 2. Structured Data Generation
Prompts + Zod schema → Typed data

```typescript
import { generateStructuredData } from '@/utils/ai-helpers';
import { z } from 'zod';

const analysis = await generateStructuredData({
  prompt: "Analyze this profile...",
  schema: z.object({
    score: z.number().min(0).max(100),
    feedback: z.array(z.string()),
    improvements: z.array(z.string())
  })
});
```

### 3. Image Analysis
Image + prompt → Text or structured insights

```typescript
import { analyzeImage } from '@/utils/ai-helpers';
import { z } from 'zod';

const result = await analyzeImage({
  imageUri: 'data:image/jpeg;base64,...',
  prompt: "Analyze this Instagram post quality",
  schema: z.object({
    subject: z.string(),
    mood: z.enum(['happy', 'calm', 'energetic', 'professional']),
    quality: z.number().min(1).max(10),
    suggestions: z.array(z.string())
  })
});
```

### 4. Image Generation
Text prompt → Generated image (DALL-E 3)

```typescript
import { generateImage } from '@/utils/ai-helpers';

const result = await generateImage({
  prompt: "Modern Instagram post template for fitness",
  size: "1024x1024"
});

// Use the generated image
<Image 
  source={{ uri: `data:${result.mimeType};base64,${result.base64Data}` }}
  style={{ width: 300, height: 300 }}
/>
```

**Available sizes**: `1024x1024`, `1024x1536`, `1536x1024`, `1024x1792`, `1792x1024`

### 5. Image Editing
Image + instructions → Modified image (Gemini 2.5 Flash Image)

```typescript
import { editImage } from '@/utils/ai-helpers';

const edited = await editImage({
  prompt: "Make the background more vibrant",
  images: [{ 
    type: 'image', 
    image: 'data:image/jpeg;base64,...' 
  }],
  aspectRatio: "16:9"
});
```

**Aspect ratios**: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`

### 6. Speech-to-Text
Audio file → Transcribed text (Whisper)

```typescript
import { transcribeAudio } from '@/utils/ai-helpers';

const formData = new FormData();
formData.append('audio', {
  uri: recordingUri,
  name: 'recording.m4a',
  type: 'audio/m4a'
} as any);

const result = await transcribeAudio(formData);
console.log(result.text); // Transcribed text
console.log(result.language); // Detected language
```

**Supported formats**: mp3, mp4, mpeg, mpga, m4a, wav, webm

### 7. Conversational AI (Agent)
Multi-turn conversations with tool calling

```typescript
import { useRorkAgent, createRorkTool } from '@/utils/ai-helpers';
import { z } from 'zod';

const { messages, sendMessage } = useRorkAgent({
  tools: {
    createGig: createRorkTool({
      description: "Create a new gig when user wants to post opportunity",
      zodSchema: z.object({
        title: z.string(),
        budget: z.number(),
        category: z.string()
      }),
      execute(input) {
        console.log('Creating gig:', input);
        return "Gig created successfully!";
      },
    }),
  },
});
```

---

## Quick Start Examples

### Example 1: Analyze Influencer Profile

```typescript
import { analyzeInfluencerProfile } from '@/utils/ai-helpers';

const analysis = await analyzeInfluencerProfile({
  bio: "Fitness enthusiast sharing healthy recipes",
  categories: ["Fitness", "Food"],
  followers: 50000,
  engagementRate: 5.2,
  ratePerPost: 500
});

console.log(analysis.score); // 85
console.log(analysis.bioSuggestions); 
console.log(analysis.pricingSuggestion.recommended); // 650
```

### Example 2: Generate Content Ideas

```typescript
import { generateContentIdeas } from '@/utils/ai-helpers';

const ideas = await generateContentIdeas({
  category: "Fitness",
  platform: "Instagram",
  audience: "Young adults aged 18-35",
  brand: "Nike"
});

ideas.ideas.forEach(idea => {
  console.log(idea.title);
  console.log(idea.description);
  console.log(idea.estimatedEngagement);
});
```

### Example 3: Predict Deal Success

```typescript
import { predictDealSuccess } from '@/utils/ai-helpers';

const prediction = await predictDealSuccess({
  gigTitle: "Fitness Campaign",
  budget: 5000,
  influencerFollowers: 50000,
  influencerEngagement: 5.2,
  category: "Fitness"
});

console.log(prediction.successScore); // 85
console.log(prediction.likelihood); // "high"
console.log(prediction.strengths); // Array of strengths
console.log(prediction.risks); // Array of risks
```

### Example 4: Generate Contract Terms

```typescript
import { generateContractTerms } from '@/utils/ai-helpers';

const terms = await generateContractTerms({
  dealType: "Instagram Campaign",
  budget: 5000,
  deliverables: ["3 posts", "2 stories"],
  timeline: "2 weeks"
});

console.log(terms.paymentTerms);
console.log(terms.deliverySchedule);
console.log(terms.contentRights);
console.log(terms.cancellationPolicy);
```

---

## Integration Patterns

### Pattern 1: Smart Form Assistance

```typescript
// In gig creation form
const handleAIAssist = async () => {
  const suggestion = await generateSimpleText(
    `Suggest a compelling gig title for: ${category}, budget $${budget}`
  );
  setTitle(suggestion);
};
```

### Pattern 2: Content Quality Scoring

```typescript
const scoreGig = async (title: string, description: string) => {
  return await generateStructuredData({
    prompt: `Score this gig listing. Title: "${title}". Description: "${description}"`,
    schema: z.object({
      score: z.number().min(0).max(100),
      feedback: z.array(z.string()),
      improvements: z.array(z.string())
    })
  });
};

// Use in form
const [score, setScore] = useState<number | null>(null);

useEffect(() => {
  if (title && description) {
    scoreGig(title, description).then(result => {
      setScore(result.score);
    });
  }
}, [title, description]);
```

### Pattern 3: Smart Matching Enhancement

```typescript
const getAIMatchScore = async (influencer: any, gig: any) => {
  return await generateStructuredData({
    prompt: `Analyze match quality between:
    Influencer: ${influencer.categories.join(', ')}, ${influencer.followers} followers
    Gig: ${gig.title}, $${gig.price}`,
    schema: z.object({
      score: z.number().min(0).max(100),
      reasoning: z.string(),
      suggestions: z.array(z.string())
    })
  });
};

// Combine with existing algorithm
const finalScore = (algorithmScore * 0.7) + (aiScore * 0.3);
```

### Pattern 4: Predictive Analytics

```typescript
const analyzeDealBeforeApplying = async () => {
  const prediction = await predictDealSuccess({
    gigTitle: gig.title,
    budget: gig.price,
    influencerFollowers: user.followers,
    influencerEngagement: user.engagementRate,
    category: gig.categories[0]
  });

  if (prediction.successScore > 80) {
    showBanner("This is a great match! High success probability.");
  }
};
```

---

## Advanced Use Cases

### Use Case 1: AI-Powered Search

```typescript
async function searchWithNLP(query: string, allGigs: Gig[]) {
  const searchIntent = await generateStructuredData({
    prompt: `Parse this search query: "${query}". Extract filters.`,
    schema: z.object({
      categories: z.array(z.string()),
      budgetMin: z.number().optional(),
      budgetMax: z.number().optional(),
      location: z.string().optional(),
      keywords: z.array(z.string())
    })
  });

  return allGigs.filter(gig => {
    if (searchIntent.categories.length > 0) {
      if (!searchIntent.categories.some(cat => 
        gig.categories.includes(cat)
      )) return false;
    }
    return true;
  });
}
```

### Use Case 2: Content Moderation

```typescript
async function moderateContent(text: string) {
  const moderation = await generateStructuredData({
    prompt: `Moderate this content: "${text}"`,
    schema: z.object({
      safe: z.boolean(),
      issues: z.array(z.string()),
      severity: z.enum(['none', 'low', 'medium', 'high']),
      recommendation: z.enum(['approve', 'flag', 'reject'])
    })
  });

  if (moderation.recommendation === 'reject') {
    throw new Error('Content violates guidelines');
  }

  return moderation.recommendation === 'approve';
}
```

### Use Case 3: Dynamic Pricing

```typescript
async function suggestPrice(params: {
  category: string;
  followers: number;
  engagement: number;
  marketData: any[];
}) {
  return await generateStructuredData({
    prompt: `Suggest pricing for influencer:
    Category: ${params.category}
    Followers: ${params.followers}
    Engagement: ${params.engagement}%`,
    schema: z.object({
      suggested: z.number(),
      min: z.number(),
      max: z.number(),
      reasoning: z.string(),
      marketPosition: z.enum(['budget', 'competitive', 'premium'])
    })
  });
}
```

---

## Best Practices

### 1. Error Handling

Always wrap AI calls in try-catch:

```typescript
try {
  const result = await generateSimpleText(prompt);
} catch (error) {
  console.error('AI failed:', error);
  Alert.alert('AI Unavailable', 'Please try again later');
}
```

### 2. Loading States

Show loading indicators:

```typescript
const [isGenerating, setIsGenerating] = useState(false);

const handleGenerate = async () => {
  setIsGenerating(true);
  try {
    const result = await generateSimpleText(prompt);
    setContent(result);
  } finally {
    setIsGenerating(false);
  }
};
```

### 3. Caching

Cache AI results:

```typescript
import { useQuery } from '@tanstack/react-query';

const { data: analysis } = useQuery({
  queryKey: ['profile-analysis', userId],
  queryFn: () => analyzeInfluencerProfile(profile),
  staleTime: 1000 * 60 * 60, // 1 hour
});
```

### 4. Rate Limiting

Debounce real-time AI features:

```typescript
import { useMemo } from 'react';
import debounce from 'lodash/debounce';

const debouncedAnalyze = useMemo(
  () => debounce(async (text: string) => {
    const result = await analyzeText(text);
    setAnalysis(result);
  }, 500),
  []
);

<TextInput onChangeText={debouncedAnalyze} />
```

### 5. Type Safety

Always use Zod schemas:

```typescript
const responseSchema = z.object({
  title: z.string().min(1).max(100),
  score: z.number().min(0).max(100),
  tags: z.array(z.string()).max(5)
});

type Response = z.infer<typeof responseSchema>;

const result = await generateStructuredData({
  prompt: "...",
  schema: responseSchema
});

// result is fully typed!
console.log(result.title); // TypeScript knows this is a string
```

---

## Performance Tips

1. **Batch Requests**: Make multiple AI calls in parallel
   ```typescript
   const [analysis, ideas, price] = await Promise.all([
     analyzeProfile(profile),
     generateContentIdeas(params),
     suggestPrice(params)
   ]);
   ```

2. **Background Processing**: Use mutations for non-blocking AI
   ```typescript
   const mutation = useMutation({
     mutationFn: (profile) => analyzeInfluencerProfile(profile),
     onSuccess: (data) => {
       // Handle result
     }
   });
   ```

3. **Fallbacks**: Always have fallback data
   ```typescript
   let insights;
   try {
     insights = await generateMarketInsights(data);
   } catch {
     insights = DEFAULT_INSIGHTS;
   }
   ```

---

## Where to Add AI Features

1. **Search** - Natural language search
2. **Profile** - Auto-complete bio
3. **Gigs** - Quality scoring
4. **Applications** - Success prediction
5. **Content** - Idea generation
6. **Contracts** - Auto-generation
7. **Images** - Analysis/editing
8. **Voice** - Transcription
9. **Chat** - AI assistant

---

## Testing AI Features

### Mock AI Responses

```typescript
// utils/__mocks__/ai-helpers.ts
export async function generateSimpleText(prompt: string) {
  return "Mocked response for: " + prompt;
}

export async function analyzeInfluencerProfile(params: any) {
  return {
    score: 85,
    bioSuggestions: ["Mock suggestion 1"],
  };
}
```

---

## Quick Reference

### Import
```typescript
import { 
  generateSimpleText,
  generateStructuredData,
  analyzeImage,
  generateImage,
  editImage,
  transcribeAudio,
  useRorkAgent,
  analyzeInfluencerProfile,
  generateContentIdeas,
  predictDealSuccess,
  generateContractTerms
} from '@/utils/ai-helpers';

import { z } from 'zod';
```

### Common Zod Patterns
```typescript
z.string()
z.number()
z.boolean()
z.array(z.string())
z.enum(['option1', 'option2'])
z.object({ name: z.string(), age: z.number() })
z.string().min(1).max(100)
z.number().min(0).max(100)
z.string().optional()
z.string().describe("Helpful description for AI")
```

---

## Resources

- **Rork AI Toolkit**: Built-in SDK
- **OpenAI DALL-E**: https://platform.openai.com/docs/guides/images
- **Google Gemini**: https://ai.google.dev/gemini-api/docs
- **Whisper**: https://platform.openai.com/docs/guides/speech-to-text

---

**Important Notes:**

✅ All APIs are production-ready  
✅ TypeScript types included  
✅ Error handling required  
✅ Loading states recommended  
✅ Caching improves UX  

🚫 Don't use Grok API (not available)  
🚫 Don't skip error handling  
🚫 Don't make synchronous calls  

---

**Last Updated**: 2025-12-04  
**Version**: 2.0 (Consolidated)
