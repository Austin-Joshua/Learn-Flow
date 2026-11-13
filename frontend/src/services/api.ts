import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  User,
  Course,
  Module,
  Lesson,
  Assessment,
  Question,
  AssessmentAttempt,
  Assignment,
  AssignmentSubmission,
  Certificate,
  PublicVerificationResponse,
  DocumentVerificationResponse,
  LearningRecommendation,
  AuditLog,
  SystemOverview,
  CohortAnalytics,
  HODDepartmentOverview,
  DraftAnswer,
  NotificationItem,
  LearnerJourneyResponse,
  CourseAssessmentListItem,
  PresignedUploadResponse,
  LearningResource,
  CompletionCriteria,
  CompletionStatus,
  CourseAtRiskResponse,
  CourseFeedback,
  CourseFeedbackCreate,
  CourseFeedbackSummary,
  InstructorQuizAttemptItem,
} from '../types';

export function normalizeApiBaseUrl(rawUrl?: string): string {
  if (!rawUrl || !rawUrl.trim()) {
    return '/api/v1';
  }
  const raw = rawUrl.trim();
  if (raw.startsWith('http') && !raw.includes('/api/v1')) {
    return raw.replace(/\/+$/, '') + '/api/v1';
  }
  return raw.replace(/\/+$/, '');
}

export const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL
);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let memoryToken: string | null = null;
let tokenSyncListeners: Array<(token: string | null) => void> = [];

export const setMemoryToken = (token: string | null) => {
  memoryToken = token;
};

export const getMemoryToken = () => memoryToken;

export const subscribeAuthSync = (listener: (token: string | null) => void) => {
  tokenSyncListeners.push(listener);
  return () => {
    tokenSyncListeners = tokenSyncListeners.filter((l) => l !== listener);
  };
};

apiClient.interceptors.request.use((config) => {
  if (memoryToken && config.headers) {
    config.headers.Authorization = `Bearer ${memoryToken}`;
  }
  return config;
});

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

// Cross-tab synchronization via BroadcastChannel when supported
const authChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('learnflow_auth_sync')
  : null;

let userSyncListeners: Array<(user: User) => void> = [];

export const subscribeUserSync = (listener: (user: User) => void) => {
  userSyncListeners.push(listener);
  return () => {
    userSyncListeners = userSyncListeners.filter((l) => l !== listener);
  };
};

export const broadcastUserSync = (user: User) => {
  if (authChannel) {
    try {
      authChannel.postMessage({ type: 'USER_UPDATED', user });
    } catch {
      // ignore
    }
  }
};

if (authChannel) {
  authChannel.onmessage = (event) => {
    if (event.data?.type === 'TOKEN_REFRESHED' && event.data.token) {
      memoryToken = event.data.token;
      tokenSyncListeners.forEach((fn) => fn(event.data.token));
    } else if (event.data?.type === 'AUTH_REVOKED') {
      memoryToken = null;
      localStorage.removeItem('learnflow_user');
      tokenSyncListeners.forEach((fn) => fn(null));
    } else if (event.data?.type === 'USER_UPDATED' && event.data.user) {
      userSyncListeners.forEach((fn) => fn(event.data.user));
    }
  };
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const url = originalRequest.url || '';
      if (!url.includes('/auth/login') && !url.includes('/auth/register') && !url.includes('/auth/refresh')) {
        originalRequest._retry = true;

        // 1. Cross-Tab Check: Did another browser tab already refresh the access token?
        const currentHeader = originalRequest.headers?.Authorization as string | undefined;
        const failedToken = currentHeader?.startsWith('Bearer ') ? currentHeader.slice(7) : null;
        const currentToken = memoryToken;

        if (currentToken && failedToken && currentToken !== failedToken) {
          // Another tab already completed a refresh; replay original request with updated in-memory token
          originalRequest.headers.Authorization = `Bearer ${currentToken}`;
          return apiClient(originalRequest);
        }

        // 2. Single-Flight Execution within this tab (authoritative server-side rotation)
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = apiClient.post<{ access_token: string }>('/auth/refresh')
            .then((res) => {
              const newToken = res.data.access_token;
              memoryToken = newToken;
              if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem('learnflow_session_token', newToken);
              }
              tokenSyncListeners.forEach((fn) => fn(newToken));
              if (authChannel) {
                authChannel.postMessage({ type: 'TOKEN_REFRESHED', token: newToken });
              }
              return newToken;
            })
            .catch((refreshErr) => {
              memoryToken = null;
              localStorage.removeItem('learnflow_user');
              if (typeof sessionStorage !== 'undefined') {
                sessionStorage.removeItem('learnflow_session_token');
              }
              tokenSyncListeners.forEach((fn) => fn(null));
              if (authChannel) {
                authChannel.postMessage({ type: 'AUTH_REVOKED' });
              }
              window.location.href = '/login?expired=1';
              throw refreshErr;
            })
            .finally(() => {
              isRefreshing = false;
              refreshPromise = null;
            });
        }

        try {
          const newToken = await refreshPromise;
          if (newToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          }
        } catch (e) {
          return Promise.reject(e);
        }
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  auth: {
    register: (data: { email: string; password: string; first_name: string; last_name: string }) =>
      apiClient.post<{ access_token: string; user: User }>('/auth/register', data),
    login: (data: { email: string; password: string }) =>
      apiClient.post<{ access_token: string; user: User }>('/auth/login', data),
    me: () => apiClient.get<User>('/auth/me'),
    updateProfile: (data: {
      first_name?: string;
      last_name?: string;
      avatar_gender?: string;
      avatar_config?: any;
      bio?: string;
    }) =>
      apiClient.patch<User>('/auth/me', data),
    refresh: () => apiClient.post<{ access_token: string }>('/auth/refresh'),
    logout: () => apiClient.post<{ message: string }>('/auth/logout'),
    changePassword: (data: { current_password: string; new_password: string }) =>
      apiClient.post<{ message: string }>('/auth/password/change', data),
  },

  // Courses
  courses: {
    list: (params?: { difficulty?: string; search?: string }) =>
      apiClient.get<Course[]>('/courses', { params }),
    getDetail: (id: string) => apiClient.get<Course>(`/courses/${id}`),
    listManaged: () => apiClient.get<Course[]>('/courses/managed'),
    create: (data: Partial<Course>) => apiClient.post<Course>('/courses', data),
    update: (id: string, data: Partial<Course>) => apiClient.put<Course>(`/courses/${id}`, data),
    addConcept: (courseId: string, data: { name: string; description?: string; order_index: number }) =>
      apiClient.post(`/courses/${courseId}/concepts`, data),
    addModule: (courseId: string, data: { title: string; order_index: number }) =>
      apiClient.post<Module>(`/courses/${courseId}/modules`, data),
    setPrerequisites: (courseId: string, prerequisite_course_ids: string[]) =>
      apiClient.post(`/courses/${courseId}/prerequisites`, { prerequisite_course_ids }),
    getAssessments: (courseId: string) => apiClient.get<CourseAssessmentListItem[]>(`/courses/${courseId}/assessments`),
    getFeedback: (courseId: string) =>
      apiClient.get<CourseFeedbackSummary>(`/courses/${courseId}/feedback`),
    submitFeedback: (courseId: string, data: CourseFeedbackCreate) =>
      apiClient.post<CourseFeedback>(`/courses/${courseId}/feedback`, data),
  },

  // Curriculum
  curriculum: {
    createLesson: (moduleId: string, data: Partial<Lesson>) =>
      apiClient.post<Lesson>(`/modules/${moduleId}/lessons`, data),
    updateLesson: (lessonId: string, data: Partial<Lesson>) =>
      apiClient.patch<Lesson>(`/lessons/${lessonId}`, data),
    deleteLesson: (lessonId: string) => apiClient.delete(`/lessons/${lessonId}`),
    updateModule: (moduleId: string, data: { title?: string; order_index?: number }) =>
      apiClient.patch<Module>(`/modules/${moduleId}`, data),
    deleteModule: (moduleId: string) => apiClient.delete(`/modules/${moduleId}`),
    getLesson: (lessonId: string) => apiClient.get<Lesson>(`/lessons/${lessonId}`),
    markComplete: (lessonId: string) => apiClient.post<{ course_progress_percentage: number; course_completed: boolean }>(`/lessons/${lessonId}/complete`),
    getResourceUploadUrl: (lessonId: string, data: { filename: string; mime_type: string; file_size_bytes: number }) =>
      apiClient.post<PresignedUploadResponse>(`/lessons/${lessonId}/resources/upload-url`, data),
    registerResource: (lessonId: string, data: { file_id: string; title: string }) =>
      apiClient.post<LearningResource>(`/lessons/${lessonId}/resources`, data),
    listResources: (lessonId: string) =>
      apiClient.get<LearningResource[]>(`/lessons/${lessonId}/resources`),
    getDownloadUrl: (resourceId: string) =>
      apiClient.get<{ download_url: string; expires_in_seconds: number }>(`/resources/${resourceId}/download-url`),
    exportNotesPdf: (lessonId: string, data: { lesson_title: string; course_title?: string; notes: unknown[] }) =>
      apiClient.post(`/lessons/${lessonId}/notes/export-pdf`, data, { responseType: 'blob' }),
    deleteResource: (resourceId: string) =>
      apiClient.delete(`/resources/${resourceId}`),
  },

  // Enrollments
  enrollments: {
    enroll: (courseId: string) => apiClient.post(`/enrollments/courses/${courseId}/enroll`),
    myCourses: () => apiClient.get<Course[]>('/enrollments/my-courses'),
  },

  // Learners (Journey & Progression)
  learners: {
    getJourney: () => apiClient.get<LearnerJourneyResponse>('/learners/me/journey'),
  },

  // Assessments
  assessments: {
    create: (courseId: string, data: Partial<Assessment>) => apiClient.post<Assessment>(`/courses/${courseId}/assessments`, data),
    update: (assessmentId: string, data: Partial<Assessment>) => apiClient.patch<Assessment>(`/assessments/${assessmentId}`, data),
    delete: (assessmentId: string) => apiClient.delete(`/assessments/${assessmentId}`),
    getDetail: (id: string) => apiClient.get<Assessment>(`/assessments/${id}`),
    addQuestion: (assessmentId: string, data: Record<string, unknown>) => apiClient.post<Question>(`/assessments/${assessmentId}/questions`, data),
    updateQuestion: (questionId: string, data: Record<string, unknown>) => apiClient.patch<Question>(`/questions/${questionId}`, data),
    deleteQuestion: (questionId: string) => apiClient.delete(`/questions/${questionId}`),
    startAttempt: (assessmentId: string) => apiClient.post<AssessmentAttempt>(`/assessments/${assessmentId}/attempts/start`),
    saveDraft: (attemptId: string, answers: DraftAnswer[]) => apiClient.put(`/attempts/${attemptId}/draft`, { answers }),
    submitAttempt: (attemptId: string, answers: DraftAnswer[], idempotencyKey?: string) =>
      apiClient.post<AssessmentAttempt>(`/attempts/${attemptId}/submit`, { answers }, {
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}
      }),
    getAttemptResult: (attemptId: string) => apiClient.get<AssessmentAttempt>(`/attempts/${attemptId}/result`),
    getInstructorQueue: () => apiClient.get<InstructorQuizAttemptItem[]>('/assessments/instructor-queue'),
    submitFeedback: (attemptId: string, data: { instructor_feedback: string; score_override?: number }) =>
      apiClient.post<AssessmentAttempt>(`/attempts/${attemptId}/feedback`, data),
  },

  // Assignments
  assignments: {
    create: (courseId: string, data: Partial<Assignment>) => apiClient.post<Assignment>(`/courses/${courseId}/assignments`, data),
    update: (assignmentId: string, data: Partial<Assignment>) => apiClient.patch<Assignment>(`/assignments/${assignmentId}`, data),
    delete: (assignmentId: string) => apiClient.delete(`/assignments/${assignmentId}`),
    listForCourse: (courseId: string) => apiClient.get<Assignment[]>(`/courses/${courseId}/assignments`),
    getUploadUrl: (assignmentId: string, data: { filename: string; file_size_bytes: number; mime_type: string }) =>
      apiClient.post<PresignedUploadResponse>(`/assignments/${assignmentId}/upload-url`, data),
    submitUpload: (assignmentId: string, data: { file_id: string; notes?: string }) =>
      apiClient.post<AssignmentSubmission>(`/assignments/${assignmentId}/submit`, data),
    uploadSubmission: async (
      assignmentId: string,
      file: File,
      allowedExtensions?: string,
      notes?: string,
      onProgressStatus?: (msg: string) => void
    ) => {
      // Client-side validations
      const MAX_SIZE = 15 * 1024 * 1024; // 15MB
      if (file.size > MAX_SIZE) {
        throw new Error('File exceeds maximum allowable size limit of 15MB.');
      }
      if (file.size === 0) {
        throw new Error('Uploaded file is empty.');
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (allowedExtensions) {
        const allowed = allowedExtensions.split(',').map((e) => e.trim().toLowerCase().replace(/^\./, ''));
        if (!allowed.includes(ext)) {
          throw new Error(`File extension .${ext} is not allowed. Permitted formats: ${allowedExtensions}`);
        }
      }

      // Step 1: Request presigned upload URL from backend
      onProgressStatus?.('Generating secure quarantine upload token...');
      const mime = file.type || 'application/octet-stream';
      const ticketRes = await apiClient.post<PresignedUploadResponse>(`/assignments/${assignmentId}/upload-url`, {
        filename: file.name,
        file_size_bytes: file.size,
        mime_type: mime,
      });

      const { file_id, upload_url } = ticketRes.data;

      // Step 2: Upload raw file payload directly to storage presigned URL
      onProgressStatus?.('Uploading file bytes to quarantine storage bucket...');
      const uploadRes = await fetch(upload_url, {
        method: 'PUT',
        headers: {
          'Content-Type': mime,
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(`Storage upload failed with HTTP status ${uploadRes.status}`);
      }

      // Step 3: Trigger quarantine security verification and submit
      onProgressStatus?.('Executing quarantine virus scan & magic-byte integrity inspection...');
      const submitRes = await apiClient.post<AssignmentSubmission>(`/assignments/${assignmentId}/submit`, {
        file_id,
        notes: notes || undefined,
      });

      onProgressStatus?.('Security scan passed. Submission registered.');
      return submitRes;
    },
    getInstructorQueue: () => apiClient.get<AssignmentSubmission[]>('/assignments/instructor/queue'),
    gradeSubmission: (submissionId: string, data: { score: number; comments: string }) =>
      apiClient.post(`/assignments/submissions/${submissionId}/feedback`, data),
  },

  // Certificates & Completion Criteria
  certificates: {
    claim: (courseId: string) => apiClient.post<Certificate>(`/courses/${courseId}/certificates/generate`),
    myCertificates: () => apiClient.get<Certificate[]>('/certificates/my'),
    verifyPublic: (code: string) => apiClient.get<PublicVerificationResponse>(`/certificates/verify/${code}`),
    verifyDocument: (file: File, code?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      if (code) {
        formData.append('code', code);
        formData.append('manual_code', code);
      }
      return apiClient.post<DocumentVerificationResponse>('/public/certificates/verify-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    downloadPdfUrl: (certId: string) => `/api/v1/certificates/${certId}/download`,
    downloadImageUrl: (certId: string) => `/api/v1/certificates/${certId}/download-image`,
    getCompletionCriteria: (courseId: string) =>
      apiClient.get<CompletionCriteria>(`/courses/${courseId}/completion-criteria`),
    updateCompletionCriteria: (courseId: string, data: Partial<CompletionCriteria>) =>
      apiClient.put<CompletionCriteria>(`/courses/${courseId}/completion-criteria`, data),
    getCompletionStatus: (courseId: string) =>
      apiClient.get<CompletionStatus>(`/courses/${courseId}/completion-status`),
  },

  // Adaptive Learning (USP)
  adaptive: {
    getMyPath: () => apiClient.get<LearningRecommendation[]>('/adaptive/my-path'),
    resolveRecommendation: (id: string) => apiClient.post(`/adaptive/recommendations/${id}/resolve`),
  },

  // Analytics & Admin
  analytics: {
    getOverview: () => apiClient.get<SystemOverview>('/analytics/overview'),
    getCourseAnalytics: (courseId: string) => apiClient.get<CohortAnalytics>(`/analytics/instructor/courses/${courseId}`),
    getHodDepartmentOverview: () => apiClient.get<HODDepartmentOverview>('/analytics/hod/department-overview'),
    getCourseAtRisk: (courseId: string) => apiClient.get<CourseAtRiskResponse>(`/analytics/courses/${courseId}/at-risk`),
  },

  // System & Users
  users: {
    list: () => apiClient.get<User[]>('/users'),
    toggleActive: (userId: string, is_active: boolean) => apiClient.patch(`/users/${userId}/status`, { is_active }),
    assignRole: (userId: string, roleName: string) => apiClient.post(`/users/${userId}/roles`, { role_name: roleName }),
    getMyAvatar: () => apiClient.get<import('../types/avatar').AvatarConfig>('/users/me/avatar'),
    updateMyAvatar: (avatarConfig: Partial<import('../types/avatar').AvatarConfig>) =>
      apiClient.put<import('../types/avatar').AvatarConfig>('/users/me/avatar', { avatar_config: avatarConfig }),
    getUserAvatar: (userId: string) => apiClient.get<import('../types/avatar').AvatarConfig>(`/users/${userId}/avatar`),
  },

  system: {
    getAuditLogs: (params?: { entity_type?: string; limit?: number }) => apiClient.get<AuditLog[]>('/system/audit-logs', { params }),
    getNotifications: () => apiClient.get<NotificationItem[]>('/notifications'),
    markNotificationRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
    markAllNotificationsRead: () => apiClient.post('/notifications/mark-all-read'),
    triggerReminders: () => apiClient.post('/notifications/trigger-reminders'),
  }
};
