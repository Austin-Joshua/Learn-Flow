export interface Role {
  id: number;
  name: string;
  description?: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_active: boolean;
  roles: Role[];
}

export interface CourseConcept {
  id: string;
  course_id: string;
  name: string;
  description?: string;
  order_index: number;
}

export interface Lesson {
  id: string;
  course_id: string;
  module_id: string;
  concept_id?: string;
  title: string;
  content_type: 'text' | 'video' | 'quiz' | 'external';
  content_body?: string;
  duration_minutes: number;
  order_index: number;
  is_completed?: boolean;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  lessons: Lesson[];
  is_locked?: boolean;
  completed_lessons?: number;
  total_lessons?: number;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: 'draft' | 'published' | 'archived';
  thumbnail_url?: string;
  instructor_id: string;
  enrolled_count?: number;
  progress_percentage?: number;
  sequential_modules?: boolean;
  modules?: Module[];
  concepts?: CourseConcept[];
  prerequisite_course_ids?: string[];
}

export interface AnswerOption {
  id: string;
  question_id?: string;
  option_text: string;
  is_correct?: boolean;
  order_index: number;
}

export interface QuestionOptionInput {
  id?: string;
  question_id?: string;
  option_text: string;
  is_correct?: boolean;
  order_index: number;
}

export interface Question {
  id: string;
  course_id: string;
  assessment_id: string;
  concept_id?: string;
  question_type: 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer';
  prompt: string;
  points: number;
  case_sensitive?: boolean;
  allow_manual_appeal?: boolean;
  accepted_answers?: string[];
  order_index: number;
  options: AnswerOption[];
}

export interface Assessment {
  id: string;
  course_id: string;
  title: string;
  time_limit_minutes: number;
  passing_score_percentage: number;
  max_attempts: number;
  created_at?: string;
  questions?: Question[];
}

export interface CourseAssessmentListItem {
  id: string;
  course_id: string;
  title: string;
  time_limit_minutes: number;
  passing_score_percentage: number;
  max_attempts: number;
  attempts_used: number;
  best_score: number | null;
  status: 'not_started' | 'in_progress' | 'passed' | 'failed' | 'attempts_remaining';
  is_locked: boolean;
  locked_reason: string | null;
  questions_count: number;
}

export interface AttemptAnswer {
  id: string;
  question_id: string;
  selected_option_ids?: string[];
  text_response?: string;
  score_awarded: number;
  is_correct?: boolean;
  is_manual_review_needed?: boolean;
}

export interface AssessmentAttempt {
  id: string;
  assessment_id: string;
  user_id: string;
  attempt_number: number;
  started_at: string;
  expires_at: string;
  submitted_at?: string;
  status: 'in_progress' | 'submitted' | 'graded' | 'expired';
  total_score?: number;
  score_percentage?: number;
  is_passed?: boolean;
  answers?: AttemptAnswer[];
}

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description: string;
  max_score?: number;
  max_points?: number;
  due_date?: string;
  allowed_extensions?: string;
  submission_status?: string;
  grade_points?: number;
  feedback_text?: string;
  created_at?: string;
}

export interface PresignedUploadResponse {
  file_id: string;
  upload_url: string;
  storage_key: string;
  expires_in_seconds: number;
}

export interface InstructorFeedback {
  id: string;
  submission_id: string;
  instructor_id: string;
  score: number;
  comments?: string;
  created_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  user_id: string;
  file_name: string;
  status: 'quarantined' | 'scanning' | 'clean' | 'rejected' | 'graded';
  submitted_at: string;
  score?: number;
  student_name?: string;
  student_email?: string;
  assignment_title?: string;
  feedback?: InstructorFeedback;
}

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  course_title?: string;
  recipient_name?: string;
  verification_code: string;
  status: 'valid' | 'revoked' | 'expired';
  issued_at: string;
  pdf_download_url?: string;
}

export interface PublicVerificationResponse {
  valid: boolean;
  status: string;
  verification_code?: string;
  recipient_name?: string;
  course_title?: string;
  instructor_name?: string;
  issued_at?: string;
  revoked_at?: string;
  revocation_reason?: string;
  pdf_download_url?: string;
  message?: string;
}

export interface LearningRecommendation {
  id: string;
  user_id: string;
  source_attempt_id: string;
  target_lesson_id: string;
  rationale: string;
  priority: number;
  status: string;
  created_at: string;
  target_lesson_title?: string;
  target_course_id?: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  ip_address?: string;
  metadata_payload?: Record<string, unknown>;
  created_at: string;
}

export interface SystemOverview {
  total_users: number;
  total_courses: number;
  total_enrollments: number;
  total_certificates_issued?: number;
  active_learners_today: number;
  recent_audit_logs: AuditLog[];
}

export interface FunnelItem {
  lesson_title?: string;
  completed_count?: number;
  stage?: string;
  count?: number;
  drop_rate?: number;
}

export interface ConceptMasteryItem {
  concept_name: string;
  mastery_percentage?: number;
  mastery_rate?: number;
}

export interface CohortAnalytics {
  course_id: string;
  total_enrolled: number;
  completion_rate: number;
  completed_count?: number;
  drop_off_funnel: FunnelItem[];
  concept_mastery: ConceptMasteryItem[];
}

export interface FacultyWorkloadItem {
  instructor_id: string;
  instructor_name: string;
  courses_count: number;
  active_students: number;
}

export interface HODDepartmentOverview {
  department_id: string;
  department_name: string;
  total_courses: number;
  total_students: number;
  faculty_workload: FacultyWorkloadItem[];
}

export interface DraftAnswer {
  question_id: string;
  selected_option_ids?: string[];
  text_response?: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface JourneyAssessmentSummary {
  assessment_id: string;
  title: string;
  passed: boolean;
  score_percentage: number | null;
  attempt_count: number;
}

export interface JourneyLessonItem {
  id: string;
  lesson_id?: string;
  module_id: string;
  title: string;
  order_index: number;
  duration_minutes: number;
  content_type: 'text' | 'video' | 'quiz' | 'external';
  status: 'completed' | 'current' | 'locked';
  completed_at: string | null;
}

export interface JourneyModuleItem {
  id: string;
  module_id?: string;
  title: string;
  order_index: number;
  is_locked: boolean;
  completed_lessons: number;
  total_lessons: number;
  lessons: JourneyLessonItem[];
  assessment?: JourneyAssessmentSummary | null;
}

export interface JourneyCourseItem {
  course_id: string;
  title?: string;
  course_title?: string;
  slug: string;
  difficulty: string;
  progress_percentage: number;
  modules: JourneyModuleItem[];
}

export interface LearnerJourneyResponse {
  courses: JourneyCourseItem[];
}


