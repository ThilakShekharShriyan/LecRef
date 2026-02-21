"""
Convex service for real-time database synchronization.

Provides optional real-time sync of lecture data through Convex.
Falls back gracefully if Convex is disabled via config.
"""

import logging
from typing import Optional, Any, Dict
from dataclasses import dataclass

try:
    from convex import ConvexClient
    CONVEX_AVAILABLE = True
except ImportError:
    CONVEX_AVAILABLE = False
    ConvexClient = None

from config import get_settings

logger = logging.getLogger(__name__)


@dataclass
class ConvexTranscriptData:
    """Real-time transcript data to sync with Convex."""
    lecture_id: str
    text: str
    timestamp: float
    speaker: str = "participant"


@dataclass
class ConvexTakeaway:
    """Takeaway to sync with Convex."""
    lecture_id: str
    content: str
    timestamp: float
    emphasis_level: float = 0.5


@dataclass
class ConvexDefinition:
    """Definition to sync with Convex."""
    lecture_id: str
    term: str
    definition: str
    definition_type: str  # 'concept', 'person', 'event'
    timestamp: float


class ConvexService:
    """Service for managing Convex real-time database operations."""
    
    def __init__(self):
        """Initialize Convex service."""
        settings = get_settings()
        self.enabled = settings.enable_convex and CONVEX_AVAILABLE
        self.client = None
        
        if self.enabled:
            try:
                if not settings.convex_url:
                    logger.warning('[Convex] CONVEX_URL not set. Convex disabled.')
                    self.enabled = False
                else:
                    self.client = ConvexClient(settings.convex_url)
                    logger.info(f'[Convex] Service initialized with URL: {settings.convex_url}')
            except Exception as e:
                logger.error(f'[Convex] Failed to initialize: {e}')
                self.enabled = False
        else:
            logger.info('[Convex] Disabled via configuration or package not installed')
    
    async def sync_transcript(self, data: ConvexTranscriptData) -> bool:
        """
        Sync transcript update to Convex.
        
        Args:
            data: Transcript data to sync
            
        Returns:
            True if successful, False if Convex disabled or error
        """
        if not self.enabled or not self.client:
            return False
        
        try:
            result = self.client.mutation(
                "transcript:add",
                {
                    "lecture_id": data.lecture_id,
                    "text": data.text,
                    "timestamp": data.timestamp,
                    "speaker": data.speaker
                }
            )
            logger.debug(f'[Convex] Transcript synced: {data.lecture_id}')
            return True
        except Exception as e:
            logger.error(f'[Convex] Transcript sync error: {e}')
            return False
    
    async def sync_takeaway(self, data: ConvexTakeaway) -> bool:
        """
        Sync takeaway to Convex.
        
        Args:
            data: Takeaway data to sync
            
        Returns:
            True if successful, False if Convex disabled or error
        """
        if not self.enabled or not self.client:
            return False
        
        try:
            result = self.client.mutation(
                "takeaway:add",
                {
                    "lecture_id": data.lecture_id,
                    "content": data.content,
                    "timestamp": data.timestamp,
                    "emphasis_level": data.emphasis_level
                }
            )
            logger.debug(f'[Convex] Takeaway synced for lecture: {data.lecture_id}')
            return True
        except Exception as e:
            logger.error(f'[Convex] Takeaway sync error: {e}')
            return False
    
    async def sync_definition(self, data: ConvexDefinition) -> bool:
        """
        Sync definition to Convex.
        
        Args:
            data: Definition data to sync
            
        Returns:
            True if successful, False if Convex disabled or error
        """
        if not self.enabled or not self.client:
            return False
        
        try:
            result = self.client.mutation(
                "definition:add",
                {
                    "lecture_id": data.lecture_id,
                    "term": data.term,
                    "definition": data.definition,
                    "definition_type": data.definition_type,
                    "timestamp": data.timestamp
                }
            )
            logger.debug(f'[Convex] Definition synced: {data.term}')
            return True
        except Exception as e:
            logger.error(f'[Convex] Definition sync error: {e}')
            return False
    
    async def get_lecture_transcript(self, lecture_id: str) -> Optional[list]:
        """
        Retrieve full transcript for a lecture from Convex.
        
        Args:
            lecture_id: Lecture identifier
            
        Returns:
            List of transcript entries or None if Convex disabled
        """
        if not self.enabled or not self.client:
            return None
        
        try:
            result = self.client.query(
                "transcript:get_by_lecture",
                {"lecture_id": lecture_id}
            )
            logger.debug(f'[Convex] Retrieved transcript for lecture: {lecture_id}')
            return result
        except Exception as e:
            logger.error(f'[Convex] Transcript retrieval error: {e}')
            return None
    
    async def get_lecture_takeaways(self, lecture_id: str) -> Optional[list]:
        """
        Retrieve takeaways for a lecture from Convex.
        
        Args:
            lecture_id: Lecture identifier
            
        Returns:
            List of takeaways or None if Convex disabled
        """
        if not self.enabled or not self.client:
            return None
        
        try:
            result = self.client.query(
                "takeaway:get_by_lecture",
                {"lecture_id": lecture_id}
            )
            logger.debug(f'[Convex] Retrieved takeaways for lecture: {lecture_id}')
            return result
        except Exception as e:
            logger.error(f'[Convex] Takeaway retrieval error: {e}')
            return None
    
    async def get_lecture_definitions(self, lecture_id: str) -> Optional[list]:
        """
        Retrieve definitions for a lecture from Convex.
        
        Args:
            lecture_id: Lecture identifier
            
        Returns:
            List of definitions or None if Convex disabled
        """
        if not self.enabled or not self.client:
            return None
        
        try:
            result = self.client.query(
                "definition:get_by_lecture",
                {"lecture_id": lecture_id}
            )
            logger.debug(f'[Convex] Retrieved definitions for lecture: {lecture_id}')
            return result
        except Exception as e:
            logger.error(f'[Convex] Definition retrieval error: {e}')
            return None
    
    def is_enabled(self) -> bool:
        """Check if Convex service is enabled."""
        return self.enabled


# Global instance
_convex_service: Optional[ConvexService] = None


def get_convex_service() -> ConvexService:
    """Get or create Convex service instance."""
    global _convex_service
    if _convex_service is None:
        _convex_service = ConvexService()
    return _convex_service
