from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import List, Dict, Optional
import logging

from services.google_docs_service import get_google_docs_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix='/api/docs', tags=['docs'])


class DefinitionItem(BaseModel):
    term: str
    definition: str
    type: Optional[str] = None


class DeepResearchItem(BaseModel):
    query: str
    synthesis: str


class ExportSummaryRequest(BaseModel):
    title: str
    summary: str
    definitions: List[DefinitionItem] = []
    takeaways: List[str] = []
    deepResearch: List[DeepResearchItem] = []


@router.post('/export')
async def export_to_google_docs(request: ExportSummaryRequest):
    """Export lecture summary to Google Docs.
    
    Creates a new Google Doc with formatted content including:
    - Lecture title and summary
    - Key takeaways
    - Key concepts with definitions
    - Research insights
    
    Returns:
        Dict with doc_id, doc_url, and web_view_link
    """
    try:
        logger.info(f'[Docs Router] Export request received. Title: {request.title}')
        
        service = get_google_docs_service()
        
        if not service.docs_service or not service.drive_service:
            logger.error('[Docs Router] Google Docs service not initialized')
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail='Google Docs service not configured. Please set up Google Cloud credentials.'
            )
        
        # Convert Pydantic models to dicts
        definitions = [
            {
                'term': d.term,
                'definition': d.definition,
                'type': d.type
            }
            for d in request.definitions
        ]
        
        deep_research = [
            {
                'query': r.query,
                'synthesis': r.synthesis
            }
            for r in request.deepResearch
        ]
        
        # Create the document
        result = service.create_lecture_summary_doc(
            title=request.title,
            summary=request.summary,
            definitions=definitions,
            takeaways=request.takeaways,
            deep_research=deep_research
        )
        
        logger.info(f'[Docs Router] Document created successfully: {result["doc_id"]}')
        
        return {
            'success': True,
            'doc_id': result['doc_id'],
            'doc_url': result['doc_url'],
            'web_view_link': result['web_view_link'],
            'title': result['title']
        }
    
    except Exception as e:
        logger.error(f'[Docs Router] Error exporting to Google Docs: {e}', exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Failed to export to Google Docs: {str(e)}'
        )
