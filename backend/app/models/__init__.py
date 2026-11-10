from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin
from app.models.user import User, Role, UserRole, Department, RefreshToken, PasswordResetToken
from app.models.course import Course, CoursePrerequisite, CourseConcept, CourseFeedback
from app.models.curriculum import Module, Lesson, LessonPrerequisite, LearningResource
from app.models.enrollment import Enrollment, LessonProgress
from app.models.assessment import Assessment, Question, AnswerOption, AssessmentAttempt, AttemptAnswer
from app.models.assignment import Assignment, AssignmentSubmission, InstructorFeedback
from app.models.certificate import CompletionCriteria, CriteriaAssessment, CriteriaAssignment, Certificate, CertificateVerification
from app.models.adaptive import LearningRecommendation
from app.models.system import StoredFile, IdempotencyKey, AuditLog, Notification

__all__ = [
    "Base",
    "UUIDMixin",
    "TimestampMixin",
    "User",
    "Role",
    "UserRole",
    "Department",
    "RefreshToken",
    "PasswordResetToken",
    "Course",
    "CoursePrerequisite",
    "CourseConcept",
    "CourseFeedback",
    "Module",
    "Lesson",
    "LessonPrerequisite",
    "LearningResource",
    "Enrollment",
    "LessonProgress",
    "Assessment",
    "Question",
    "AnswerOption",
    "AssessmentAttempt",
    "AttemptAnswer",
    "Assignment",
    "AssignmentSubmission",
    "InstructorFeedback",
    "CompletionCriteria",
    "CriteriaAssessment",
    "CriteriaAssignment",
    "Certificate",
    "CertificateVerification",
    "LearningRecommendation",
    "StoredFile",
    "IdempotencyKey",
    "AuditLog",
    "Notification"
]

