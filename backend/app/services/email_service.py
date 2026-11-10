import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        self.host = settings.SMTP_HOST
        self.port = settings.SMTP_PORT
        self.sender = settings.SMTP_FROM
        self.use_tls = settings.SMTP_TLS

    def _send_email(self, recipient: str, subject: str, html_content: str):
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.sender
            msg["To"] = recipient

            part = MIMEText(html_content, "html")
            msg.attach(part)

            with smtplib.SMTP(self.host, self.port, timeout=5) as server:
                if self.use_tls:
                    server.starttls()
                server.sendmail(self.sender, [recipient], msg.as_string())
            logger.info(f"Email successfully sent to {recipient}: '{subject}'")
        except Exception as e:
            logger.warning(f"Could not deliver email to {recipient} via {self.host}:{self.port} - {e}")

    def send_welcome_email(self, to_email: str, first_name: str):
        subject = "Welcome to Learnflow LMS!"
        html = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
            <h2 style="color: #4f46e5;">Welcome to Learnflow, {first_name}!</h2>
            <p>Your learner account has been successfully created.</p>
            <p>Explore our catalog of structured technical courses, complete hands-on assignments, and earn verifiable certificates.</p>
            <br>
            <a href="{settings.FRONTEND_URL}/login" style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Login to Dashboard</a>
        </div>
        """
        self._send_email(to_email, subject, html)

    def send_enrollment_confirmation(self, to_email: str, course_title: str):
        subject = f"Enrolled: {course_title}"
        html = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
            <h2 style="color: #4f46e5;">Enrollment Confirmed!</h2>
            <p>You are now enrolled in <strong>{course_title}</strong>.</p>
            <p>All prerequisite checks have been validated. You can begin learning immediately.</p>
            <br>
            <a href="{settings.FRONTEND_URL}/learn/dashboard" style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Course</a>
        </div>
        """
        self._send_email(to_email, subject, html)

    def send_grade_notification(self, to_email: str, assignment_title: str, grade_points: float, max_points: float):
        subject = f"Grade Released: {assignment_title}"
        html = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
            <h2 style="color: #4f46e5;">Your Assignment Has Been Graded</h2>
            <p>Assignment: <strong>{assignment_title}</strong></p>
            <p>Score Awarded: <strong>{grade_points} / {max_points} points</strong></p>
            <p>Detailed rubric comments and feedback are now available in your learner portal.</p>
            <br>
            <a href="{settings.FRONTEND_URL}/learn/dashboard" style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Feedback</a>
        </div>
        """
        self._send_email(to_email, subject, html)

    def send_certificate_notification(self, to_email: str, course_title: str, verification_code: str):
        subject = f"Certificate Earned: {course_title}"
        verify_url = f"{settings.FRONTEND_URL}/verify/{verification_code}"
        html = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
            <h2 style="color: #10b981;">Congratulations! Certificate Earned!</h2>
            <p>You have satisfied all completion criteria for <strong>{course_title}</strong>.</p>
            <p>Your unique verification code is: <code style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px;">{verification_code}</code></p>
            <br>
            <a href="{verify_url}" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">View & Verify Credential</a>
        </div>
        """
        self._send_email(to_email, subject, html)


    def send_password_reset_email(self, to_email: str, reset_token: str):
        subject = "Learnflow - Password Reset Request"
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        html = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
            <h2 style="color: #4f46e5;">Password Reset Request</h2>
            <p>We received a request to reset your Learnflow account password.</p>
            <p>Click the button below to set a new password. This link is valid for {settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES} minutes and can only be used once.</p>
            <br>
            <a href="{reset_url}" style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
            <br><br>
            <p style="font-size: 12px; color: #64748b;">If you did not request a password reset, please ignore this email or notify security immediately.</p>
        </div>
        """
        self._send_email(to_email, subject, html)

    def send_progress_reminder_email(
        self,
        to_email: str,
        first_name: str,
        course_title: str,
        progress_percentage: float,
        next_lesson_title: str
    ):
        subject = f"Continue Learning: {course_title}"
        html = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
            <h2 style="color: #0284c7;">Keep Up Your Momentum, {first_name}!</h2>
            <p>You have achieved <strong>{round(progress_percentage)}% sequential progress</strong> in <strong>{course_title}</strong>.</p>
            <p>Your next unlocked lesson is ready for you: <em>"{next_lesson_title}"</em>.</p>
            <br>
            <a href="{settings.FRONTEND_URL}/my-learning" style="background: #0284c7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Resume Course</a>
        </div>
        """
        self._send_email(to_email, subject, html)

    def send_certificate_claim_reminder(
        self,
        to_email: str,
        first_name: str,
        course_title: str,
        verification_code: str
    ):
        subject = f"Ready to Claim: Verified Certificate for {course_title}"
        html = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
            <h2 style="color: #10b981;">Academic Milestone Achieved!</h2>
            <p>Congratulations, {first_name}! You have cleared all milestone requirements and quizzes for <strong>{course_title}</strong>.</p>
            <p>Your verifiable credential (Code: <code>{verification_code}</code>) is ready for download in high-resolution PDF and PNG formats.</p>
            <br>
            <a href="{settings.FRONTEND_URL}/credentials" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">View & Download Certificate</a>
        </div>
        """
        self._send_email(to_email, subject, html)

    def send_new_course_announcement_email(
        self,
        to_email: str,
        first_name: str,
        course_title: str,
        difficulty: str,
        description: str
    ):
        subject = f"New Curriculum Track: {course_title}"
        html = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
            <h2 style="color: #6366f1;">New Academic Track Added!</h2>
            <p>Hello {first_name}, a new course has just been published to the Learnflow catalog:</p>
            <h3 style="margin-bottom: 4px;">{course_title} <span style="font-size: 12px; color: #64748b; font-weight: normal;">({difficulty.capitalize()})</span></h3>
            <p style="color: #475569;">{description}</p>
            <br>
            <a href="{settings.FRONTEND_URL}/courses" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Explore Course Catalog</a>
        </div>
        """
        self._send_email(to_email, subject, html)

    def send_quiz_feedback_notification(
        self,
        to_email: str,
        quiz_title: str,
        score_pct: float,
        instructor_name: str,
        feedback: str
    ):
        subject = f"Faculty Feedback: {quiz_title}"
        html = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
            <h2 style="color: #0284c7;">Faculty Review on Your Quiz Submission</h2>
            <p>Quiz: <strong>{quiz_title}</strong> (Score: <strong>{score_pct}%</strong>)</p>
            <p>Reviewed by: <strong>{instructor_name}</strong></p>
            <div style="background: #f1f5f9; padding: 12px; border-left: 4px solid #0284c7; margin: 15px 0;">
                <p style="margin: 0; font-style: italic;">"{feedback}"</p>
            </div>
            <a href="{settings.FRONTEND_URL}/my-journey" style="background: #0284c7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Assessment Telemetry</a>
        </div>
        """
        self._send_email(to_email, subject, html)


email_service = EmailService()

