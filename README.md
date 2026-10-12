# B Design

Act as an expert full-stack developer and UX/UI designer. I want to build a web application called "BrandAdapt AI." This is a "one-click" AI creative generation system for marketing agencies and multi-brand managers. 

The core value proposition: A user sets up a Brand Profile once. Later, they upload a reference image, select the brand, and click "Generate." The system (via backend APIs) analyzes the reference, strictly enforces the brand's visual identity, and outputs a final, brand-aligned creative. The user experience must be a seamless, absolute "black box" with zero manual prompt tweaking or background removal required by the end user.

Please build this using React, Vite, Tailwind CSS, Shadcn UI components, and Lucide icons. Prepare the data models assuming we will use Supabase for the backend.

### 1. App Structure & Navigation

Create a clean, modern dashboard layout with a persistent sidebar. The vibe should be professional, agency-focused, and minimalist.

* **Dashboard:** High-level overview of recent generations.

* **Brand Hub:** Where users manage multiple brands.

* **The Studio:** The one-click generation interface.

### 2. Core Feature: Brand Hub (Database & UI)

Create an interface to Add/Edit brands. A Brand profile must contain the following fields (please build the corresponding mock database schema):

* **Brand Name & Logo:** File upload for the high-res PNG logo.

* **Visual Guardrails:** Color pickers for Exact Primary/Secondary Hex codes. (e.g., A school franchise where the primary branding color is strictly blue, not red or a combination).

* **Brand Voice & Subject Rules:** Text areas for strict demographic rules (e.g., "Subjects must strictly be 3-4 year old toddlers, not older kids" or "Mascot must be placed exactly as uploaded, maintaining exact proportions").

* **The 'Never' List (Negative Prompting):** Text area for strict exclusions (e.g., "Never use the color green for real estate ads," "No location pin symbols," "Remove all background clutter," "No hallucinated text or watermarks").

### 3. Core Feature: The Studio (The One-Click UI)

This is the main generation page. It needs a split-screen or step-by-step card layout that feels instant.

* **Input Section:** * A dropdown to select a pre-saved Brand.

    * A drag-and-drop zone to upload a 'Reference Image'.

    * A single, prominent "Generate Creative" button.

* **The 'Black Box' Loading State (Crucial UX):** When "Generate" is clicked, show a highly engaging loading state. Since the backend will be running a multi-agent loop (Vision Analysis -> Prompt Generation -> Structural Image Gen -> Automated QA -> Final Compositing), use dynamic loading text to show this process is happening (e.g., "Analyzing reference structure...", "Enforcing brand guardrails...", "Running automated quality QA...", "Compositing final assets..."). This should take about 15-20 seconds.

* **Output Section:** Display the final generated image. Include options to "Download" or "Regenerate". Do not show any AI prompts to the user.

### 4. Technical Architecture & API Preparation

Since Lovable cannot run the AI models directly, please create a dedicated utility file (e.g., `lib/ai-pipeline.ts`) with a simulated async function called `generateBrandCreative(referenceImage, brandId)`. 

* This function should simulate a 15-second delay.

* It should return a placeholder generated image URL.

* Structure the code cleanly so that later, I can easily replace this mock function with real API calls to an external ComfyUI server and a VLM (like OpenAI Vision). 

Please ensure the UI is fully responsive and include subtle micro-interactions (hover states, smooth transitions) to make the app feel premium. Start by scaffolding the main dashboard and the Brand Hub.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://autodesigner.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9cb7efa8-2848-458d-8660-75b51f45a8cc).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
