import axios, { AxiosError } from 'axios';
import {
  User,
  Course,
  Module,
  Lesson,
  Assessment,
  AssessmentAttempt,
  Assignment,
  AssignmentSubmission,
  Certificate,
  PublicVerificationResponse,
  LearningRecommendation,
  AuditLog
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('learnflow_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear token on 401 only if not during a login/register attempt
      const url = error.config?.url || '';
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        localStorage.removeItem('learnflow_token');
        localStorage.removeItem('learnflow_user');
        window.location.href = '/login?expired=1';
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
    refresh: () => apiClient.post<{ access_token: string }>('/auth/refresh'),
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
  },

  // Curriculum
  curriculum: {
    createLesson: (moduleId: string, data: Partial<Lesson>) =>
      apiClient.post<Lesson>(`/modules/${moduleId}/lessons`, data),
    getLesson: (lessonId: string) => apiClient.get<Lesson>(`/lessons/${lessonId}`),
    markComplete: (lessonId: string) => apiClient.post<{ course_progress_percentage: number; course_completed: boolean }>(`/lessons/${lessonId}/complete`),
  },

  // Enrollments
  enrollments: {
    enroll: (courseId: string) => apiClient.post(`/enrollments/courses/${courseId}/enroll`),
    myCourses: () => apiClient.get<Course[]>('/enrollments/my-courses'),
  },

  // Assessments
  assessments: {
    create: (courseId: string, data: any) => apiClient.post<Assessment>(`/courses/${courseId}/assessments`, data),
    getDetail: (id: string) => apiClient.get<Assessment>(`/assessments/${id}`),
    addQuestion: (assessmentId: string, data: any) => apiClient.post(`/assessments/${assessmentId}/questions`, data),
    startAttempt: (assessmentId: string) => apiClient.post<AssessmentAttempt>(`/assessments/${assessmentId}/attempts/start`),
    saveDraft: (attemptId: string, answers: any[]) => apiClient.put(`/attempts/${attemptId}/draft`, { answers }),
    submitAttempt: (attemptId: string, answers: any[], idempotencyKey?: string) =>
      apiClient.post<AssessmentAttempt>(`/attempts/${attemptId}/submit`, { answers }, {
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}
      }),
    getAttemptResult: (attemptId: string) => apiClient.get<AssessmentAttempt>(`/attempts/${attemptId}/result`),
  },

  // Assignments
  assignments: {
    create: (courseId: string, data: any) => apiClient.post<Assignment>(`/courses/${courseId}/assignments`, data),
    listForCourse: (courseId: string) => apiClient.get<Assignment[]>(`/courses/${courseId}/assignments`),
    uploadSubmission: (assignmentId: string, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiClient.post<AssignmentSubmission>(`/assignments/${assignmentId}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    getInstructorQueue: () => apiClient.get<AssignmentSubmission[]>('/assignments/instructor/queue'),
    gradeSubmission: (submissionId: string, data: { score: number; comments: string }) =>
      apiClient.post(`/assignments/submissions/${submissionId}/feedback`, data),
  },

  // Certificates
  certificates: {
    claim: (courseId: string) => apiClient.post<Certificate>(`/courses/${courseId}/certificates/generate`),
    myCertificates: () => apiClient.get<Certificate[]>('/certificates/my'),
    verifyPublic: (code: string) => apiClient.get<PublicVerificationResponse>(`/certificates/verify/${code}`),
  },

  // Adaptive Learning (USP)
  adaptive: {
    getMyPath: () => apiClient.get<LearningRecommendation[]>('/adaptive/my-path'),
    resolveRecommendation: (id: string) => apiClient.post(`/adaptive/recommendations/${id}/resolve`),
  },

  // Analytics & Admin
  analytics: {
    getOverview: () => apiClient.get<any>('/analytics/overview'),
    getCourseAnalytics: (courseId: string) => apiClient.get<any>(`/analytics/instructor/courses/${courseId}`),
  },

  // System & Users
  users: {
    list: () => apiClient.get<User[]>('/users'),
    toggleActive: (userId: string, is_active: boolean) => apiClient.patch(`/users/${userId}/status`, { is_active }),
    assignRole: (userId: string, roleName: string) => apiClient.post(`/users/${userId}/roles`, { role_name: roleName }),
  },

  system: {
    getAuditLogs: (params?: { entity_type?: string; limit?: number }) => apiClient.get<AuditLog[]>('/system/audit-logs', { params }),
    getNotifications: () => apiClient.get<any[]>('/notifications'),
    markNotificationRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
  }
};
