import os
import logging
from typing import Optional, Dict, Any, List
from google.auth.transport.requests import Request
from google.oauth2.service_account import Credentials
from google.api_core import exceptions
from googleapiclient.discovery import build
from datetime import datetime
from config import get_settings

logger = logging.getLogger(__name__)

class GoogleDocsService:
    """Service for creating and managing Google Docs documents."""
    
    SCOPES = [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/drive'
    ]
    
    def __init__(self, credentials_file: Optional[str] = None):
        """Initialize Google Docs service.
        
        Args:
            credentials_file: Path to Google service account JSON file.
                            If None, uses GOOGLE_DOCS_CREDENTIALS env var or config setting.
        """
        if not credentials_file:
            # Try config setting first, then env var
            settings = get_settings()
            credentials_file = settings.google_docs_credentials or os.getenv('GOOGLE_DOCS_CREDENTIALS')
        
        self.credentials_file = credentials_file
        self.docs_service = None
        self.drive_service = None
        
        if self.credentials_file and os.path.exists(self.credentials_file):
            self._initialize_services()
        else:
            logger.warning('[GoogleDocs] No credentials file found. Google Docs export will not work.')
    
    def _initialize_services(self):
        """Initialize Google Docs and Drive services using service account credentials."""
        try:
            credentials = Credentials.from_service_account_file(
                self.credentials_file,
                scopes=self.SCOPES
            )
            self.docs_service = build('docs', 'v1', credentials=credentials)
            self.drive_service = build('drive', 'v3', credentials=credentials)
            logger.info('[GoogleDocs] Services initialized successfully')
        except Exception as e:
            logger.error(f'[GoogleDocs] Failed to initialize services: {e}')
            raise
    
    def create_lecture_summary_doc(
        self,
        title: str,
        summary: str,
        definitions: List[Dict[str, str]],
        takeaways: List[str],
        deep_research: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """Create a Google Doc with lecture summary, definitions, and research.
        
        Args:
            title: Document title
            summary: Main lecture summary
            definitions: List of dicts with 'term', 'definition', 'type'
            takeaways: List of key takeaway strings
            deep_research: List of dicts with 'query', 'synthesis'
        
        Returns:
            Dict with 'doc_id', 'doc_url', and 'web_view_link'
        """
        if not self.docs_service or not self.drive_service:
            raise RuntimeError('Google Docs service not initialized. Missing credentials.')
        
        try:
            # Create document
            doc_title = f"{title} - {datetime.now().strftime('%B %d, %Y at %I:%M %p')}"
            body = {'title': doc_title}
            doc = self.docs_service.documents().create(body=body).execute()
            doc_id = doc['documentId']
            logger.info(f'[GoogleDocs] Created document: {doc_id}')
            
            # Prepare content for insertion
            requests = self._build_requests(doc_id, title, summary, definitions, takeaways, deep_research)
            
            # Apply formatting
            if requests:
                self.docs_service.documents().batchUpdate(
                    documentId=doc_id,
                    body={'requests': requests}
                ).execute()
                logger.info(f'[GoogleDocs] Formatted document: {doc_id}')
            
            # Get shareable link
            drive_file = self.drive_service.files().get(
                fileId=doc_id,
                fields='webViewLink'
            ).execute()
            
            web_view_link = drive_file.get('webViewLink', '')
            logger.info(f'[GoogleDocs] Document ready: {web_view_link}')
            
            return {
                'doc_id': doc_id,
                'doc_url': web_view_link,
                'web_view_link': web_view_link,
                'title': doc_title
            }
        except exceptions.GoogleAPIError as e:
            logger.error(f'[GoogleDocs] API error: {e}')
            raise
        except Exception as e:
            logger.error(f'[GoogleDocs] Unexpected error: {e}')
            raise
    
    def _build_requests(
        self,
        doc_id: str,
        title: str,
        summary: str,
        definitions: List[Dict[str, str]],
        takeaways: List[str],
        deep_research: List[Dict[str, str]]
    ) -> List[Dict[str, Any]]:
        """Build batch update requests for formatting the document."""
        requests = []
        
        # Main content to insert
        content_parts = [f"{title}\n\n"]
        
        # Add summary
        content_parts.append("LECTURE SUMMARY\n")
        content_parts.append(f"{summary}\n\n")
        
        # Add key takeaways if available
        if takeaways:
            content_parts.append("KEY TAKEAWAYS\n")
            for takeaway in takeaways:
                content_parts.append(f"• {takeaway}\n")
            content_parts.append("\n")
        
        # Add definitions if available
        if definitions:
            content_parts.append("KEY CONCEPTS\n")
            for defn in definitions:
                content_parts.append(f"\n{defn.get('term', 'Unknown')}")
                if defn.get('type'):
                    content_parts.append(f" ({defn['type']})")
                content_parts.append("\n")
                content_parts.append(f"{defn.get('definition', 'No definition available')}\n")
            content_parts.append("\n")
        
        # Add deep research if available
        if deep_research:
            content_parts.append("RESEARCH INSIGHTS\n")
            for research in deep_research:
                if research.get('query'):
                    content_parts.append(f"\nResearch: {research['query']}\n")
                if research.get('synthesis'):
                    content_parts.append(f"{research['synthesis']}\n")
            content_parts.append("\n")
        
        # Add timestamp
        content_parts.append(f"\nGenerated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}")
        
        full_content = ''.join(content_parts)
        
        # Insert text at the end of the document
        requests.append({
            'insertText': {
                'location': {'index': 1},
                'text': full_content
            }
        })
        
        # Format title (first paragraph)
        title_end_index = len(title) + 2
        requests.append({
            'updateTextStyle': {
                'range': {'startIndex': 1, 'endIndex': title_end_index},
                'textStyle': {
                    'fontSize': {'magnitude': 24, 'unit': 'pt'},
                    'bold': True
                },
                'fields': 'fontSize,bold'
            }
        })
        
        # Format section headers
        current_index = title_end_index
        sections = ['LECTURE SUMMARY', 'KEY TAKEAWAYS', 'KEY CONCEPTS', 'RESEARCH INSIGHTS']
        
        for section in sections:
            idx = full_content.find(section, current_index - title_end_index)
            if idx != -1:
                actual_idx = idx + title_end_index
                section_end = actual_idx + len(section)
                requests.append({
                    'updateTextStyle': {
                        'range': {'startIndex': actual_idx, 'endIndex': section_end},
                        'textStyle': {
                            'fontSize': {'magnitude': 14, 'unit': 'pt'},
                            'bold': True
                        },
                        'fields': 'fontSize,bold'
                    }
                })
        
        return requests


# Global instance
_google_docs_service: Optional[GoogleDocsService] = None


def get_google_docs_service() -> GoogleDocsService:
    """Get or create the Google Docs service instance."""
    global _google_docs_service
    if _google_docs_service is None:
        _google_docs_service = GoogleDocsService()
    return _google_docs_service
