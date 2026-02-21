# Google Docs Integration Setup Guide

## Overview
The lecRef application now supports exporting lecture summaries directly to Google Docs. This guide walks you through setting up the required Google Cloud credentials.

## Prerequisites
- Google Cloud account (https://console.cloud.google.com)
- Owner or Editor access to a Google Cloud project

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click the project dropdown at the top
3. Click "NEW PROJECT"
4. Enter a project name (e.g., "lecRef")
5. Click "CREATE"

## Step 2: Enable Required APIs

1. In the GCP Console, go to "APIs & Services" > "Library"
2. Search for and enable these APIs:
   - **Google Docs API**
   - **Google Drive API**
   - **Google Sheets API** (optional, for future spreadsheet exports)

For each API:
- Click on it
- Click "ENABLE"
- Wait for the operation to complete

## Step 3: Create a Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "CREATE CREDENTIALS" > "Service Account"
3. Fill in the service account details:
   - Service account name: `lecref-service`
   - Service account ID: (auto-populated, e.g., `lecref-service@project-id.iam.gserviceaccount.com`)
   - Description: "Service account for lecRef Google Docs exports"
4. Click "CREATE AND CONTINUE"
5. Grant roles (Optional but recommended):
   - Role: "Editor" (allows full read/write to Google Drive and Docs)
   - Or more restrictive: "Google Docs Editor" and "Google Drive File Creator"
6. Click "CONTINUE"
7. Click "DONE"

## Step 4: Create and Download the Service Account Key

1. Go back to "APIs & Services" > "Credentials"
2. Under "Service Accounts", click on the account you just created
3. Go to the "KEYS" tab
4. Click "ADD KEY" > "Create new key"
5. Choose "JSON" format
6. Click "CREATE"
   - A JSON file will automatically download (e.g., `lecref-service-abcd1234.json`)

## Step 5: Configure the Backend

1. Save the downloaded JSON file to your project. We recommend placing it in: 
   ```
   /Users/spartan/Projects/Lectio/backend/credentials/google-docs-credentials.json
   ```

2. Create the credentials directory if it doesn't exist:
   ```bash
   mkdir -p /Users/spartan/Projects/Lectio/backend/credentials
   ```

3. Move/save the JSON file to this location

4. Update your `.env` file in the backend directory:
   ```bash
   GOOGLE_DOCS_CREDENTIALS=/Users/spartan/Projects/Lectio/backend/credentials/google-docs-credentials.json
   ```

   Or (relative path):
   ```bash
   GOOGLE_DOCS_CREDENTIALS=./credentials/google-docs-credentials.json
   ```

5. Ensure `.gitignore` includes the credentials directory:
   ```
   backend/credentials/
   backend/credentials/*.json
   .env
   ```

## Step 6: Install Dependencies

The required Python packages have already been added to `backend/requirements.txt`:
- `google-auth-oauthlib`
- `google-auth-httplib2`
- `google-api-python-client`

Install them:
```bash
cd /Users/spartan/Projects/Lectio/backend
pip install -r requirements.txt
```

## Step 7: Test the Integration

1. Start the backend server:
   ```bash
   cd /Users/spartan/Projects/Lectio/backend
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. Start the frontend:
   ```bash
   cd /Users/spartan/Projects/Lectio
   npm run dev
   ```

3. During a lecture session, click the "Export to Google Docs" button
4. The document should be created in your Google Drive and automatically opened in a new tab

## Troubleshooting

### "Google Docs service not configured" error
- Verify the credentials file path in `.env` is correct
- Check that the file exists and is readable
- Ensure the JSON file contains valid credentials

### "403 Forbidden" or permission errors
- Verify the service account has the "Editor" role in the Google Cloud project
- Check that both Google Docs API and Google Drive API are enabled

### Document not appearing in Google Drive
- The service account is creating documents in its own sandboxed Drive
- To share documents with your personal Google account:
  1. Use the service account email from the JSON credentials
  2. Share documents from that email to your personal account
  3. Or modify the service to generate and provide a shareable link (implemented in code)

### Import errors for google libraries
- Ensure all packages in requirements.txt are installed: `pip install -r requirements.txt`
- Verify Python version (3.8+)

## How It Works

1. **User clicks "Export to Google Docs" in the app**
2. **Frontend sends POST request to `/api/docs/export` with:**
   - Lecture title
   - Summary text
   - List of key concepts/definitions
   - Takeaways
   - Research insights

3. **Backend:**
   - Authenticates using service account credentials
   - Creates a new Google Doc
   - Formats the content with proper styling (headers, text styles)
   - Returns shareable link to frontend

4. **Frontend:**
   - Opens the new document in a new tab

## Security Notes

- ⚠️ **NEVER commit the credentials JSON file to Git**
- The `.gitignore` should include the credentials directory
- The credentials file is only readable on your local machine
- For production, use environment variables or a secure credential manager
- The service account can only access Drive/Docs resources, not other Google services

## Future Enhancements

- Add option to choose Google Drive folder for documents
- Allow users to update existing documents instead of creating new ones
- Support for exporting to PDF or other formats
- Batch document creation for multiple lectures

## Support

For issues:
1. Check the backend logs: Look for `[GoogleDocs]` prefixed messages
2. Verify all APIs are enabled in Google Cloud Console
3. Ensure the service account has proper permissions
4. Check that the credentials file path is correct
