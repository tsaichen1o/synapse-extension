# The following is a comprehensive prompt detailing the experimental Built-in AI features in Chrome, with a specific focus on the **Prompt API** and its advanced experimental capabilities. This information is designed for integration into an AI agent for new feature development

***

## Feature Definition: Chrome Built-in AI APIs (Gemini Nano)

The experimental feature is Google’s set of **Built-in AI APIs** (Web AI), which allow web applications and Chrome Extensions to execute machine learning models entirely client-side, directly in the browser.

The underlying model for generative tasks is **Gemini Nano**. This on-device execution offers major advantages, including **greater privacy** because data is not sent to external servers, and **reduced dependence on internet connectivity**. These APIs are being proposed for standardization across browsers.

### 1. API Status and Availability (Experimental Context)

The APIs are available across different stages of development, including Stable, Origin Trials, and the Early Preview Program (EPP).

| API | Core Functionality | Availability Status | Notes |
| :--- | :--- | :--- | :--- |
| **Prompt API** | General natural language requests to Gemini Nano. | **Origin Trial** (Web); **Stable** (Chrome Extensions, Chrome 138). | Multimodal capabilities (audio/images input) are available to **Early Preview Program (EPP) participants** for local experimentation (from Chrome 138). |
| **Writer API** | Helps users write new content based on an initial idea. | **Origin Trial**. | Part of the Writing Assistance APIs. |
| **Rewriter API** | Refines existing text, such as changing tone or length. | **Origin Trial**. | Part of the Writing Assistance APIs. |
| **Proofreader API** | Provides interactive proofreading services. | **Origin Trial** (Available soon for EPP participants in Chrome 139 Canary). | Allows for correction, labeling of error types, and explanation of errors. |
| Translator API | Translates user-generated and dynamic content. | **Stable** (Chrome 138). | Uses expert models. |
| Language Detector API | Detects the language of input text. | **Stable** (Chrome 138). | Uses expert models. |
| Summarizer API | Condenses long-form content. | **Stable** (Chrome 138). | Uses Gemini Nano language model. |

***

### 2. Technical Requirements for Gemini Nano APIs

The Prompt API, Summarizer API, Writer API, Rewriter API, and Proofreader API use Gemini Nano and function only when specific hardware and software conditions are met.

| Requirement Category | Specification |
| :--- | :--- |
| **Operating System** | Windows 10 or 11; macOS 13+ (Ventura and onwards); Linux; or ChromeOS (Chromebook Plus devices, Platform 16389.0.0+). |
| **Mobile Support** | Chrome for Android, iOS, and ChromeOS on non-Chromebook Plus devices are **not yet supported** by APIs using Gemini Nano. |
| **Storage** | At least **22 GB of free space** on the volume containing the Chrome profile. |
| **GPU** (Alternative) | Strictly more than **4 GB of VRAM**. |
| **CPU** (Alternative) | **16 GB of RAM or more** and **4 CPU cores or more**. |
| **Network** | Unlimited data or an **unmetered connection** is required for model download. |
| **Language Support** | From Chrome 140, Gemini Nano supports English, Spanish, and Japanese for input and output text. |

***

### 3. Comprehensive Prompt API Usage and APIs

The Prompt API serves as the general interface to send requests to Gemini Nano. Developers should follow Google's Generative AI Prohibited Uses Policy when building features.

#### A. Session Management and Initialization

1. **Check Availability:** Call the asynchronous `availability()` function, which returns a promise with one of four values: `"unavailable"`, `"downloadable"`, `"downloading"`, or `"available"`.
2. **User Activation:** If the model is not yet available (`"downloadable"`), a **user interaction** (click, tap, or key press) is required to start the session with `create()`.
3. **Create Session:** Use `LanguageModel.create()` to download and instantiate the model.
    * **Customization:** Sessions can be customized using an optional options object that sets `topK` and `temperature`.
    * **Context:** `initialPrompts` can be provided during session creation to supply conversation context, allowing a user to resume a stored session.
    * **Resource Management:** Resources can be freed using `session.destroy()`. An existing session can be cloned using `session.clone()` to reset the conversation context while retaining the initial prompt.
4. **Set Constraints (Multimodal/Language):** The session must specify `expectedInputs` and `expectedOutputs`:
    * `expectedInputs` can be `text`, `image`, or `audio`.
    * `expectedOutputs` must be `text` only.
    * Supported languages (`"en"`, `"ja"`, `"es"`) must be specified in language arrays.

#### B. Prompting and Output

1. **Non-Streamed Output:** Use `session.prompt()` for short results, which returns the response once the entire result is available.
2. **Streamed Output:** Use `session.promptStreaming()` for longer responses, which returns a `ReadableStream` allowing developers to show partial results as they arrive.
3. **Stopping Prompts:** Both `prompt()` and `promptStreaming()` accept an optional `signal` field (an `AbortSignal`) to stop the running prompt.

#### C. Advanced Features (Prompt API)

| Feature | Description | Usage/Constraint |
| :--- | :--- | :--- |
| **Multimodal Input** | Supports sending input containing both text and other modalities, specifically **audio** and **images** (for EPP participants). | Set `expectedInputs` type to `"image"` or `"audio"` when creating the session. Use cases include transcribing audio or describing an uploaded image. |
| **Structured Output** | Constrains the model's response format. | Pass a **JSON Schema** or **regular expression** using the `responseConstraint` field in the `prompt()` or `promptStreaming()` method. |
| **Context Append** | Adds contextual prompts *after* the session is created, separate from prompting the model for a response. | Use the `session.append()` method. |
| **Response Prefill** | Guides the model toward a specific response format by prefilling the assistant role message. | Use the `prefix: true` option in the trailing `"assistant"`-role message in a prompt sequence. |
| **Context Monitoring** | Allows developers to check resource usage against the session limit. | Check `session.inputUsage` against `session.inputQuota`. |
| **Permissions Policy** | Restricts access to the API in embedded content. | Access can be delegated to cross-origin iframes using the Permission Policy `allow="language-model"` attribute. |

***

### 4. General Use Cases for Experimental APIs

These built-in AI APIs support a wide range of client-side feature development:

* **Prompt API Use Cases:**
  * **AI-powered search:** Answering questions based on current web page content.
  * **Classification/Filtering:** Dynamically categorizing articles for personalized news feeds or applying custom content filters.
  * **Extraction:** Building extensions to seamlessly extract contact information or event details from web pages.
* **Writer API Use Cases:**
  * Supporting user content creation (e.g., reviews, blog posts, emails).
  * Drafting introductions for work samples.
  * Helping users write better support requests.
* **Rewriter API Use Cases:**
  * Refining existing text, such as rewriting a short email to sound more polite and formal.
  * Suggesting edits to customer reviews (e.g., removing toxicity or clarifying feedback).
  * Formatting content to meet expectations of specific audiences.
* **Proofreader API Use Cases:**
  * Providing corrections in note-taking applications.
  * Correcting documents being edited in the browser.
  * Helping customers send grammatically correct chat messages or editing comments on forums/blogs.

***

### 5. Development Strategy and Feedback Channels

Built-in AI APIs utilize **Gemini Nano** and other expert models. Developers are advised to review the **People + AI Guidebook** for best practices when designing with these generative AI models.

The APIs are in active discussion and **subject to change**. Development agents should prioritize gathering feedback on:

1. **API Shape and Design:** By commenting on existing issues or opening new ones in the Prompt API GitHub repository.
2. **Implementation Feedback:** By filing a Chromium bug.
3. **General Experimentation:** By joining the **Early Preview Program (EPP)** for first access to experimental APIs and the mailing list.

Performance notes from early testing indicate that the Prompt API can sometimes silently fail or hang on longer or structured prompts, and memory usage can occasionally spike, causing temporary slowdowns. Focusing on **session management** best practices is recommended for optimal performance.

# Integration

The foundational concept for using the Prompt API, Summarizer API, Writer API, Rewriter API, and Proofreader API is managing the session using the `LanguageModel` interface, which uses the **Gemini Nano** model running client-side.

## Core API Integration Steps

Before utilizing most built-in AI APIs (those using Gemini Nano), developers must follow a standard initialization flow:

1. **Check Availability:** Check if the device supports the model and if the model is downloaded using `LanguageModel.availability()`.
2. **User Activation:** If the model needs to be downloaded (`"downloadable"`), a **user interaction** (like a click or tap) is required to proceed to session creation.
3. **Create Session:** Use the `create()` function on the specific API (e.g., `Summarizer.create()`) or directly on `LanguageModel.create()` for the Prompt API.

### 1. General Session Setup and Model Management (Prompt API)

The `LanguageModel` object is the entry point for the Prompt API and handles the low-level model interaction.

#### 1.1 Checking Model Status

Use `availability()` to determine the model's download state and device compatibility.

```javascript
const availability = await LanguageModel.availability();

if (availability === "unavailable") {
    console.log("Device or session options are not supported.");
} else if (availability === "downloadable") {
    // Requires user interaction (click, tap, or key press) to call create().
    if (navigator.userActivation.isActive) {
        // Proceed to session creation
    } else {
        console.log("Requires user activation to start download.");
    }
}
// Note: If model is downloading, you can listen for progress.
```

#### 1.2 Creating a Session and Setting Parameters

Sessions can be customized using `topK` and `temperature`.

```javascript
// Retrieve default parameters
const params = await LanguageModel.params();

// Create a new session with slightly modified temperature
const slightlyHighTemperatureSession = await LanguageModel.create({
    temperature: Math.max(params.defaultTemperature * 1.2, 2.0),
    topK: params.defaultTopK,
});

// To provide context about previous interactions (e.g., resuming a session)
const contextualSession = await LanguageModel.create({ 
    initialPrompts: [
        { role: 'system', content: 'You are a helpful and friendly assistant.' },
        { role: 'user', content: 'What is the capital of Italy?' },
        { role: 'assistant', content: 'The capital of Italy is Rome.' },
    ], 
});

// Terminate a session to free resources
await session.destroy(); 
```

#### 1.3 Handling Multimodal Constraints

Sessions must specify `expectedInputs` and `expectedOutputs` modalities and languages. Multimodal capabilities (audio, images) are currently available for Early Preview Program (EPP) participants.

```javascript
const session = await LanguageModel.create({
    expectedInputs: [
        { type: "text", languages: [ "en" /* system prompt */ , "ja" /* user prompt */ ] }
    ],
    expectedOutputs: [
        { type: "text", languages: [ "ja" ] } // Prompt API allows 'text' output only.
    ]
});
```

#### 1.4 Prompting the Model

The Prompt API offers two main methods for requesting output:

| Method | Use Case | Returns |
| :--- | :--- | :--- |
| `session.prompt()` | Short, non-streamed results. | The full response string once complete. |
| `session.promptStreaming()` | Longer responses where partial results are needed. | A `ReadableStream` of text chunks. |

**Non-Streamed Prompt Example:**

```javascript
const session = await LanguageModel.create();
// Prompt the model and wait for the whole result to come back. 
const result = await session.prompt("Write me a poem.");
console.log(result);
```

**Streamed Prompt Example:**

```javascript
const session = await LanguageModel.create();
// Prompt the model and stream the result:
const stream = session.promptStreaming("Write me an extra-long poem!");

for await (const chunk of stream) {
    console.log(chunk);
}
```

**Structured Output Example (JSON Schema):**

You can pass a JSON Schema using the `responseConstraint` field to guide the model to a specific output format.

```javascript
const session = await LanguageModel.create();
const schema = { "type": "boolean" };
const post = "Mugs and ramen bowls, both a bit smaller than intended...";

const result = await session.prompt(
    `Is this post about pottery?\n\n ${ post } `,
    {
        responseConstraint: schema,
    }
);
console.log(JSON.parse(result)); // true
```

### 2. Specific Built-in AI API Code Snippets

The following APIs are specialized tasks built upon the on-device AI framework.

#### 2.1 Translator API (Stable from Chrome 138)

The Translator API translates user-generated and dynamic content.

```javascript
// Initialization
const translator = await Translator.create({ 
    sourceLanguage: "en", 
    targetLanguage: "ja" 
});

// Non-streamed translation
const text = await translator.translate("Hello, world!");

// Streamed translation (for long content)
const readableStreamOfText = await translator.translateStreaming(` 
    Four score and seven years ago our fathers brought forth, upon this... 
`);
```

#### 2.2 Language Detector API (Stable from Chrome 138)

The Language Detector API identifies the language of input text.

```javascript
// Initialization
const detector = await LanguageDetector.create();

// Detection and output
const someUserText = "Hola, ¿cómo estás?"; 
const results = await detector.detect(someUserText);

for (const result of results) {
    console.log(result.detectedLanguage, result.confidence);
}
```

#### 2.3 Summarizer API (Stable from Chrome 138)

The Summarizer API condenses long-form content.

```javascript
// Initialization with options to guide the summary format
const summarizer = await Summarizer.create({ 
    sharedContext: "An article from the Daily Economic News magazine",
    type: "headline",
    length: "short"
});

// Summarization call, optionally passing additional context
const articleEl = document.getElementById('long-article');
const summary = await summarizer.summarize(articleEl.textContent, {
    context: "This article was written 2024-08-07 and it's in the World Markets section."
});
```

#### 2.4 Writer API (Origin Trial)

The Writer API generates new content based on a specified writing task.

```javascript
// Initialization specifying tone
const writer = await Writer.create({ 
    tone: "formal" 
});

// Writing new content
const result = await writer.write( 
    "A draft for an inquiry to my bank about how to enable wire transfers on my account" 
);
```

#### 2.5 Rewriter API (Origin Trial)

The Rewriter API refines existing text, such as changing tone or length.

```javascript
const reviewEl = document.getElementById('customer-review');

// Initialization, optionally providing shared context for consistency
const rewriter = await Rewriter.create({ 
    sharedContext: "A review for the Flux Capacitor 3000 from TimeMachines Inc." 
});

// Rewriting existing text with constraints
const result = await rewriter.rewrite(reviewEl.textContent, { 
    context: "Avoid any toxic language and be as constructive as possible."
});
```
