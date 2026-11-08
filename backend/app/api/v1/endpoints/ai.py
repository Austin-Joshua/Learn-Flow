from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user_optional
from app.models.user import User
from app.services.ai_assistant_service import AIClassification
from app.services.ai_gateway import AIGateway

router = APIRouter()


class ActionItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    label: str
    path: str


class TokenUsage(BaseModel):
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0


class SourceItem(BaseModel):
    title: str
    course_title: Optional[str] = None
    source_type: str
    citation_ref: str
    relevance_score: Optional[float] = None


class AskRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)
    page: Optional[str] = None


class AssistantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    answer: str
    classification: str = AIClassification.PLATFORM_HELP
    suggested_actions: List[ActionItem] = []
    provenance: str = "VERIFIED_CURRICULUM"
    confidence: float = 0.98
    request_id: Optional[str] = None
    cached: bool = False
    tokens_used: Optional[TokenUsage] = None
    latency_ms: Optional[float] = None
    sources: List[SourceItem] = []


@router.get("/briefing", response_model=AssistantResponse)
def get_briefing(
    page: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Context-aware copilot briefing based on current route and authenticated user persona.
    """
    roles = [r.name for r in user.roles] if user else []
    user_name = user.first_name if user else "Learner"

    if "admin" in roles:
        return AssistantResponse(
            answer=f"Welcome back, Administrator {user_name}. Platform security and audit logs are active. What system operations would you like to review?",
            classification=AIClassification.ADMIN_SUPPORT,
            suggested_actions=[
                ActionItem(label="Inspect Audit Ledger", path="/admin"),
                ActionItem(label="Manage Role Delegations", path="/admin"),
                ActionItem(label="Browse Course Catalog", path="/courses")
            ],
            provenance="SYSTEM_KERNEL"
        )
    elif "hod" in roles:
        return AssistantResponse(
            answer=f"Welcome, Department Head {user_name}. Department oversight is active. You can monitor faculty workload, course health, and student progress across curricula.",
            classification=AIClassification.INSTRUCTOR_SUPPORT,
            suggested_actions=[
                ActionItem(label="Academic Oversight Portal", path="/hod"),
                ActionItem(label="Curriculum Audit", path="/hod"),
                ActionItem(label="Browse Courses", path="/courses")
            ],
            provenance="DEPARTMENTAL_GOVERNANCE"
        )
    elif "instructor" in roles:
        return AssistantResponse(
            answer=f"Welcome, Instructor {user_name}. Your authoring studio is ready. You can create course curricula, manage assessment questions, and grade student assignments.",
            classification=AIClassification.INSTRUCTOR_SUPPORT,
            suggested_actions=[
                ActionItem(label="Instructor Studio", path="/instructor/courses"),
                ActionItem(label="Assignment Grading Queue", path="/instructor/grading"),
                ActionItem(label="Browse Courses", path="/courses")
            ],
            provenance="INSTRUCTOR_COUNCIL"
        )
    else:
        # Learner or unauthenticated visitor
        return AssistantResponse(
            answer=f"Hello {user_name}! I am your Learnflow study assistant. I can help explain lesson concepts, guide you through prerequisites, and help you prepare for assessments.",
            classification=AIClassification.PLATFORM_HELP,
            suggested_actions=[
                ActionItem(label="Explore Courses", path="/courses"),
                ActionItem(label="My Learning Dashboard", path="/my-learning" if user else "/login"),
                ActionItem(label="Verify Credentials", path="/verify")
            ],
            provenance="CURATED_CURRICULUM"
        )


@router.post("/ask", response_model=AssistantResponse)
def ask_assistant(
    payload: AskRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Role-aware, domain-restricted educational assistant endpoint.
    Protected by centralized AI Gateway:
    - Pre-retrieval role-scoped authorization filtering
    - Sliding window rate limiting
    - Secret probe and prompt injection defense
    - Output credential/secret sanitization
    - Token budgeting and audit logging
    """
    client_ip = request.client.host if request.client else None
    result = AIGateway.process_query(
        query=payload.query,
        db=db,
        user=user,
        client_ip=client_ip,
        page=payload.page
    )

    actions = [ActionItem(label=a["label"], path=a["path"]) for a in result.get("suggested_actions", [])]
    sources = [
        SourceItem(
            title=s["title"],
            course_title=s.get("course_title"),
            source_type=s["source_type"],
            citation_ref=s["citation_ref"],
            relevance_score=s.get("relevance_score")
        )
        for s in result.get("sources", [])
    ]
    tokens = None
    if "tokens_used" in result and result["tokens_used"]:
        tokens = TokenUsage(**result["tokens_used"])

    return AssistantResponse(
        answer=result["answer"],
        classification=result.get("classification", AIClassification.PLATFORM_HELP),
        suggested_actions=actions,
        provenance=result.get("provenance", "VERIFIED_CURRICULUM"),
        confidence=result.get("confidence", 0.95),
        request_id=result.get("request_id"),
        cached=result.get("cached", False),
        tokens_used=tokens,
        latency_ms=result.get("latency_ms"),
        sources=sources
    )
