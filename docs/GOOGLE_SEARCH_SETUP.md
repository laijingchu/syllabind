# Google Custom Search Engine Setup

## Overview

The AI Syllabind generation feature requires Google Custom Search API to find educational resources. This guide will walk you through setting up your search engine and getting the required credentials.

## Prerequisites

- Google account
- Google Cloud project with Custom Search API enabled
- `GOOGLE_SEARCH_API_KEY` already configured in Replit Secrets ✅

## Step-by-Step Setup

### 1. Create a Custom Search Engine

1. Go to https://programmablesearchengine.google.com/
2. Click **"Add"** or **"Create a new search engine"**
3. Configure the search engine:
   - **Sites to search**: Select **"Search the entire web"**
   - **Name**: "Syllabind Curriculum Search" (or any name you prefer)
   - **Language**: English
4. Click **"Create"**

### 2. Get Your Search Engine ID

1. After creation, you'll see your search engine listed
2. Click on the search engine name to open settings
3. In the **"Basics"** section, find **"Search engine ID"**
4. It will look like: `xxxxxxxxxxxxxxxxx:xxxxxxxxxx`
5. **Copy this ID**

### 3. Configure Search Settings (Optional but Recommended)

1. In the search engine settings, go to **"Setup"** tab
2. Ensure **"Search the entire web"** is enabled
3. Under **"Advanced"** → **"SafeSearch"**, set to **Moderate** or **Strict**
4. Save changes

### 4. Add to Replit Secrets

1. In your Replit project, open the **Secrets** (Tools → Secrets)
2. Click **"Add new secret"**
3. Key: `GOOGLE_SEARCH_ENGINE_ID`
4. Value: Paste the Search Engine ID you copied (e.g., `01234567890abcdef:ghijk`)
5. Click **"Add secret"**

### 5. Verify Setup

Restart your development server and check that the environment variable is loaded:

```bash
# In Replit shell
echo $GOOGLE_SEARCH_ENGINE_ID
```

You should see your search engine ID printed.

## Testing the Integration

Once configured, test the search functionality:

1. Navigate to `/creator/syllabind/new`
2. Fill in:
   - Title: "Test Curriculum"
   - Description: "Testing AI generation"
   - Audience: Beginner
   - Duration: 2 weeks
3. Click **"Autogenerate Syllabind with AI"**
4. Monitor the progress - you should see search queries being executed
5. After completion, verify that generated steps have valid URLs

## Troubleshooting

### Error: "Google Search API not configured"

**Cause**: The `GOOGLE_SEARCH_ENGINE_ID` environment variable is missing or incorrect.

**Solution**:
1. Verify the secret exists in Replit Secrets
2. Check that the value matches your search engine ID exactly
3. Restart the server after adding the secret

### Error: "Search API error: 403"

**Cause**: API key doesn't have permission to use the Custom Search API.

**Solution**:
1. Go to https://console.cloud.google.com/apis/library
2. Search for "Custom Search API"
3. Click **"Enable"** if not already enabled
4. Verify your `GOOGLE_SEARCH_API_KEY` is from the correct project

### Error: "Search API error: 429"

**Cause**: You've exceeded the free tier quota (100 queries/day).

**Solution**:
1. Wait until tomorrow (quota resets daily)
2. Or enable billing to increase quota to 10,000 queries/day

### Poor search results

**Cause**: The default search engine may not be optimized for educational content.

**Solution**:
1. Go to your search engine settings
2. Under **"Sites to search"**, add specific domains to boost:
   - `*.edu`
   - `coursera.org`
   - `youtube.com`
   - `medium.com`
   - `arxiv.org`
3. Set weights to prioritize educational sources

## API Quotas and Pricing

### Free Tier
- **100 queries per day** at no charge
- Resets at midnight Pacific Time
- Sufficient for ~8-12 Syllabind generations per day

### Paid Tier
- $5 per 1,000 queries
- Up to 10,000 queries per day
- Requires billing enabled on Google Cloud project

### Estimated Usage
- **Per 4-week Syllabind**: 8-12 search queries
- **Per chat interaction**: 1-3 search queries
- **Daily capacity (free tier)**: ~8-10 Syllabind generations

## Security Best Practices

1. **Never commit secrets to version control**
   - The search engine ID is not highly sensitive, but keep it in Replit Secrets
   - Never commit `GOOGLE_SEARCH_API_KEY` to git

2. **Monitor usage**
   - Check Google Cloud Console for query counts
   - Set up billing alerts if using paid tier

3. **Restrict API key**
   - In Google Cloud Console, restrict API key to:
     - Custom Search API only
     - Your Replit project's IP (if possible)
     - HTTP referrer restrictions

## Alternative Search Providers

If you prefer not to use Google Custom Search, you can modify `/home/runner/workspace/server/utils/webSearch.ts` to use alternatives:

### Bing Custom Search
- Similar pricing and quota
- Register at https://www.microsoft.com/en-us/bing/apis/bing-custom-search-api

### DuckDuckGo API
- Free but limited
- No official API key required
- Lower quality results for educational content

### Brave Search API
- 2,000 free queries/month
- Register at https://brave.com/search/api/

## Support

If you encounter issues:

1. Check the [Google Custom Search documentation](https://developers.google.com/custom-search/v1/overview)
2. Review server logs for detailed error messages
3. Verify both `GOOGLE_SEARCH_API_KEY` and `GOOGLE_SEARCH_ENGINE_ID` are set
4. Test the API directly using the [API Explorer](https://developers.google.com/custom-search/v1/reference/rest/v1/cse/list)

---

**Status**: Setup required before AI Syllabind generation will work.

**Next step**: Add `GOOGLE_SEARCH_ENGINE_ID` to Replit Secrets following steps 1-4 above.
