<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/19443060-333a-4a6d-a855-a18a2f94440b

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploying to Production

You can deploy the web app to Firebase Hosting and sync assets to Google Cloud Storage by running:

```bash
npm run deploy-all
```

**Note**: By default, `scripts/sync-assets.sh` runs a dry run (`-n`) for syncing. To actually sync assets, you may need to modify the deploy command or script, or pass the `--force` flag.
