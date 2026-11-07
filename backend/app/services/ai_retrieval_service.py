import re
import math
from typing import List, Dict, Any, Optional, Set
from uuid import UUID
from dataclasses import dataclass, field
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.course import Course, CourseConcept
from app.models.curriculum import Lesson, Module
from app.models.enrollment import Enrollment, LessonProgress
from app.models.assessment import Assessment, AssessmentAttempt
from app.models.assignment import Assignment, AssignmentSubmission
from app.models.adaptive import LearningRecommendation


@dataclass
class CurriculumChunk:
    chunk_id: str
    course_id: str
    course_title: str
    source_type: str  # 'lesson' | 'concept' | 'course' | 'assignment'
    title: str
    text: str
    module_id: Optional[str] = None
    module_title: Optional[str] = None
    lesson_id: Optional[str] = None
    citation_ref: str = ""
    relevance_score: float = 0.0

    def __post_init__(self):
        if not self.citation_ref:
            if self.source_type == "lesson":
                self.citation_ref = f"[Course: {self.course_title} -> Lesson: {self.title}]"
            elif self.source_type == "concept":
                self.citation_ref = f"[Course: {self.course_title} -> Concept: {self.title}]"
            elif self.source_type == "assignment":
                self.citation_ref = f"[Course: {self.course_title} -> Assignment: {self.title}]"
            else:
                self.citation_ref = f"[Course: {self.course_title}]"


class AIRetrievalService:
    """
    Authorization-aware Curriculum & Progress Retrieval Engine.
    Enforces strict pre-retrieval role filtering so users can ONLY retrieve
    documents and learning records they are explicitly authorized to access.
    """

    RELEVANCE_THRESHOLD = 0.15

    @classmethod
    def get_authorized_course_ids(cls, db: Session, user: Optional[User]) -> Set[UUID]:
        """
        Determines the exact set of course IDs the user is authorized to search.
        Enforces strict role-based data partitioning:
        - Unauthenticated / Guest: None (cannot retrieve protected curriculum).
        - Learner: Active or completed enrollments ONLY.
        - Instructor: Assigned/taught courses ONLY.
        - HOD: Courses belonging to assigned department (user.department_id) ONLY.
        - Admin: All institutional courses.
        """
        if not user:
            return set()

        roles = [r.name for r in user.roles]

        if "admin" in roles:
            all_courses = db.query(Course.id).all()
            return {c[0] for c in all_courses}

        authorized_ids: Set[UUID] = set()

        if "instructor" in roles:
            managed = db.query(Course.id).filter(Course.instructor_id == user.id).all()
            for m in managed:
                authorized_ids.add(m[0])

        if "hod" in roles and user.department_id:
            dept_courses = db.query(Course.id).filter(Course.department_id == user.department_id).all()
            for d in dept_courses:
                authorized_ids.add(d[0])

        if "learner" in roles:
            enrolled = db.query(Enrollment.course_id).filter(
                Enrollment.user_id == user.id,
                Enrollment.status.in_(["active", "completed"])
            ).all()
            for e in enrolled:
                authorized_ids.add(e[0])

        return authorized_ids

    @classmethod
    def retrieve_authorized_chunks(
        cls,
        query: str,
        db: Session,
        user: Optional[User],
        top_k: int = 4
    ) -> List[CurriculumChunk]:
        """
        Executes pre-retrieval authorization-filtered search across course materials.
        Strictly excludes any sensitive assessment answer keys or other users' records.
        """
        authorized_course_ids = cls.get_authorized_course_ids(db, user)
        if not authorized_course_ids:
            return []

        # 1. Fetch authorized Course descriptions
        courses = db.query(Course).filter(Course.id.in_(authorized_course_ids)).all()
        chunks: List[CurriculumChunk] = []

        for c in courses:
            if c.description:
                chunks.append(CurriculumChunk(
                    chunk_id=f"course-{c.id}",
                    course_id=str(c.id),
                    course_title=c.title,
                    source_type="course",
                    title=c.title,
                    text=f"Course: {c.title}. Difficulty: {c.difficulty}. Overview: {c.description}"
                ))

        # 2. Fetch authorized Lessons & Module hierarchies
        lessons = db.query(Lesson).join(Module, Lesson.module_id == Module.id).filter(
            Lesson.course_id.in_(authorized_course_ids)
        ).all()

        for l in lessons:
            body_text = l.content_body or ""
            module_title = l.module.title if l.module else ""
            course_title = l.module.course.title if l.module and l.module.course else "Course"

            # Break long lesson bodies into logical 250-word chunks if needed
            words = body_text.split()
            if len(words) > 300:
                step = 200
                for i in range(0, len(words), step):
                    chunk_subtext = " ".join(words[i:i + 300])
                    chunks.append(CurriculumChunk(
                        chunk_id=f"lesson-{l.id}-{i}",
                        course_id=str(l.course_id),
                        course_title=course_title,
                        source_type="lesson",
                        title=f"{l.title} (Part {i // step + 1})",
                        text=f"Lesson: {l.title} (Module: {module_title}). Content: {chunk_subtext}",
                        module_id=str(l.module_id),
                        module_title=module_title,
                        lesson_id=str(l.id)
                    ))
            else:
                chunks.append(CurriculumChunk(
                    chunk_id=f"lesson-{l.id}",
                    course_id=str(l.course_id),
                    course_title=course_title,
                    source_type="lesson",
                    title=l.title,
                    text=f"Lesson: {l.title} (Module: {module_title}). Content: {body_text or 'Technical study material.'}",
                    module_id=str(l.module_id),
                    module_title=module_title,
                    lesson_id=str(l.id)
                ))

        # 3. Fetch authorized Concepts
        concepts = db.query(CourseConcept).filter(
            CourseConcept.course_id.in_(authorized_course_ids)
        ).all()
        for cp in concepts:
            c_title = cp.course.title if cp.course else "Course"
            chunks.append(CurriculumChunk(
                chunk_id=f"concept-{cp.id}",
                course_id=str(cp.course_id),
                course_title=c_title,
                source_type="concept",
                title=cp.name,
                text=f"Concept: {cp.name}. Details: {cp.description or 'Evaluated curriculum competency.'}"
            ))

        # 4. Fetch authorized Assignment instructions (never student submissions)
        assignments = db.query(Assignment).filter(
            Assignment.course_id.in_(authorized_course_ids)
        ).all()
        for a in assignments:
            c_title = a.course.title if a.course else "Course"
            chunks.append(CurriculumChunk(
                chunk_id=f"assignment-{a.id}",
                course_id=str(a.course_id),
                course_title=c_title,
                source_type="assignment",
                title=a.title,
                text=f"Assignment: {a.title}. Instructions: {a.description or 'Hands-on project work.'}"
            ))

        if not chunks:
            return []

        # 5. Compute TF-IDF / Term Vector Relevance Scores
        ranked = cls._rank_chunks(query, chunks)

        # Filter by threshold and take top_k
        filtered = [c for c in ranked if c.relevance_score >= cls.RELEVANCE_THRESHOLD]
        return filtered[:top_k]

    STOP_WORDS = {
        "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
        "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
        "can", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing",
        "don't", "down", "during", "each", "explain", "few", "for", "from", "further", "had", "hadn't",
        "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's",
        "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if",
        "in", "into", "is", "isn't", "it", "it's", "its", "itself", "learnflow", "let's", "me", "more", "most",
        "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other",
        "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll",
        "she's", "should", "shouldn't", "so", "some", "such", "tell", "than", "that", "that's", "the", "their",
        "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll",
        "they're", "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was",
        "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when",
        "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with",
        "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself",
        "yourselves"
    }

    @classmethod
    def _rank_chunks(cls, query: str, chunks: List[CurriculumChunk]) -> List[CurriculumChunk]:
        """
        Computes BM25/TF-IDF and character n-gram cosine relevance scores.
        """
        def tokenize(text: str) -> List[str]:
            words = re.findall(r"\b[a-zA-Z0-9_\-\.]{2,}\b", text.lower())
            return [w for w in words if w not in cls.STOP_WORDS]

        q_tokens = tokenize(query)
        if not q_tokens:
            return []

        q_term_set = set(q_tokens)
        N = len(chunks)

        # Document frequencies
        df: Dict[str, int] = {}
        chunk_token_lists = []
        for c in chunks:
            tokens = tokenize(c.text) + tokenize(c.title) * 2  # Boost title match
            chunk_token_lists.append(tokens)
            unique_terms = set(tokens)
            for t in unique_terms:
                df[t] = df.get(t, 0) + 1

        for i, c in enumerate(chunks):
            tokens = chunk_token_lists[i]
            if not tokens:
                c.relevance_score = 0.0
                continue

            score = 0.0
            tf: Dict[str, int] = {}
            for t in tokens:
                tf[t] = tf.get(t, 0) + 1

            doc_len = len(tokens)
            matched_terms = 0
            for qt in q_term_set:
                if qt in tf:
                    matched_terms += 1
                    term_freq = tf[qt]
                    doc_freq = df.get(qt, 1)
                    idf = math.log((N - doc_freq + 0.5) / (doc_freq + 0.5) + 1.0)
                    # Normalized TF
                    norm_tf = (term_freq * 2.2) / (term_freq + 1.2 * (0.25 + 0.75 * (doc_len / 120.0)))
                    score += norm_tf * idf

            # Penalize multi-term queries if fewer than 50% of terms match
            if len(q_term_set) >= 3 and (matched_terms / len(q_term_set)) < 0.5:
                score = 0.0

            # Exact phrase bonus
            q_clean = query.strip().lower()
            if len(q_clean) > 4 and q_clean in c.text.lower():
                score += 1.5
            if len(q_clean) > 4 and q_clean in c.title.lower():
                score += 2.5

            c.relevance_score = round(score, 4)

        chunks.sort(key=lambda x: x.relevance_score, reverse=True)
        return chunks

    @classmethod
    def retrieve_learner_personal_record(
        cls,
        db: Session,
        user: User,
        target_user_id: Optional[UUID] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Strictly retrieves learning telemetry only if requesting user owns the record or is an Admin.
        """
        if target_user_id and target_user_id != user.id:
            roles = [r.name for r in user.roles]
            if "admin" not in roles:
                return None
            subject_user = db.query(User).filter(User.id == target_user_id).first()
            if not subject_user:
                return None
        else:
            subject_user = user

        enrollments = db.query(Enrollment).filter(Enrollment.user_id == subject_user.id).all()
        recs = db.query(LearningRecommendation).filter(
            LearningRecommendation.user_id == subject_user.id,
            LearningRecommendation.status == "active"
        ).order_by(LearningRecommendation.priority.asc()).all()

        enrolled_courses = []
        for e in enrollments:
            enrolled_courses.append({
                "course_id": str(e.course_id),
                "title": e.course.title,
                "progress_percentage": float(e.progress_percentage),
                "status": e.status
            })

        active_recs = []
        for r in recs:
            active_recs.append({
                "rec_id": str(r.id),
                "target_lesson_title": r.target_lesson.title if r.target_lesson else "Foundational Lesson",
                "target_lesson_id": str(r.target_lesson_id),
                "rationale": r.rationale,
                "priority": r.priority
            })

        return {
            "user_id": str(subject_user.id),
            "learner_name": subject_user.full_name,
            "enrolled_courses": enrolled_courses,
            "active_recommendations": active_recs
        }

    @classmethod
    def retrieve_instructor_course_record(cls, db: Session, instructor: User, course_id: UUID) -> Optional[Dict[str, Any]]:
        """
        Strictly verifies that the instructor owns the course before retrieving internal telemetry.
        """
        course = db.query(Course).filter(
            Course.id == course_id,
            Course.instructor_id == instructor.id
        ).first()

        if not course:
            return None

        total_enrolled = db.query(Enrollment).filter(Enrollment.course_id == course_id).count()
        pending_grading = db.query(AssignmentSubmission).join(
            Assignment, AssignmentSubmission.assignment_id == Assignment.id
        ).filter(
            Assignment.course_id == course_id,
            AssignmentSubmission.status.in_(["submitted", "under_review"])
        ).count()

        return {
            "course_id": str(course.id),
            "course_title": course.title,
            "status": course.status,
            "total_enrolled": total_enrolled,
            "pending_grading": pending_grading
        }
