import io
from datetime import datetime
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.pdfgen import canvas


class PDFService:
    @staticmethod
    def generate_certificate_pdf(
        recipient_name: str,
        course_title: str,
        verification_code: str,
        issued_at: datetime,
        instructor_name: str = "Academic Directorate"
    ) -> bytes:
        """
        Generates a branded, high-resolution certificate PDF in landscape letter format.
        Returns the raw PDF bytes.
        """
        buffer = io.BytesIO()
        width, height = landscape(letter)

        c = canvas.Canvas(buffer, pagesize=landscape(letter))

        # Background Fill
        c.setFillColor(colors.HexColor("#F8FAFC"))
        c.rect(0, 0, width, height, fill=True, stroke=False)

        # Outer Decorative Border
        c.setStrokeColor(colors.HexColor("#4F46E5"))
        c.setLineWidth(6)
        c.rect(20, 20, width - 40, height - 40)

        # Inner Thin Border
        c.setStrokeColor(colors.HexColor("#7C3AED"))
        c.setLineWidth(1.5)
        c.rect(28, 28, width - 56, height - 56)

        # Corner Accents
        c.setFillColor(colors.HexColor("#4F46E5"))
        c.circle(36, 36, 4, fill=True, stroke=False)
        c.circle(width - 36, 36, 4, fill=True, stroke=False)
        c.circle(36, height - 36, 4, fill=True, stroke=False)
        c.circle(width - 36, height - 36, 4, fill=True, stroke=False)

        # Header Title
        c.setFont("Helvetica-Bold", 32)
        c.setFillColor(colors.HexColor("#0F172A"))
        c.drawCentredString(width / 2.0, height - 100, "CERTIFICATE OF COMPLETION")

        # Subtitle
        c.setFont("Helvetica-Bold", 12)
        c.setFillColor(colors.HexColor("#64748B"))
        c.drawCentredString(width / 2.0, height - 125, "LEARNFLOW ONLINE ASSESSMENT & LEARNING PLATFORM")

        # Decorative Horizontal Rule
        c.setStrokeColor(colors.HexColor("#E2E8F0"))
        c.setLineWidth(1)
        c.line(width / 2.0 - 150, height - 145, width / 2.0 + 150, height - 145)

        # Certification Statement
        c.setFont("Helvetica", 14)
        c.setFillColor(colors.HexColor("#334155"))
        c.drawCentredString(width / 2.0, height - 180, "This is proudly presented to")

        # Student Name
        c.setFont("Helvetica-Bold", 28)
        c.setFillColor(colors.HexColor("#4F46E5"))
        c.drawCentredString(width / 2.0, height - 225, recipient_name)

        # Underline for Name
        c.setStrokeColor(colors.HexColor("#4F46E5"))
        c.setLineWidth(2)
        c.line(width / 2.0 - 180, height - 235, width / 2.0 + 180, height - 235)

        # Completion text
        c.setFont("Helvetica", 14)
        c.setFillColor(colors.HexColor("#334155"))
        c.drawCentredString(width / 2.0, height - 275, "for successfully completing all curriculum, assessment, and grading criteria for")

        # Course Title
        c.setFont("Helvetica-Bold", 22)
        c.setFillColor(colors.HexColor("#0F172A"))
        c.drawCentredString(width / 2.0, height - 320, course_title)

        # Footer Details (Date, Signature, Verification Code)
        issue_str = issued_at.strftime("%B %d, %Y")

        # Left Column: Date
        c.setFont("Helvetica-Bold", 11)
        c.setFillColor(colors.HexColor("#0F172A"))
        c.drawString(70, 95, f"Date Issued: {issue_str}")
        c.setFont("Helvetica", 9)
        c.setFillColor(colors.HexColor("#64748B"))
        c.drawString(70, 80, "Authoritative Platform Timestamp")

        # Center Column: Verification Token & QR Link
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(colors.HexColor("#0F172A"))
        c.drawCentredString(width / 2.0, 95, f"Verification Code: {verification_code}")
        c.setFont("Helvetica", 9)
        c.setFillColor(colors.HexColor("#4F46E5"))
        c.drawCentredString(width / 2.0, 80, f"Verify Online: https://learnflow.edu/verify/{verification_code}")

        # Right Column: Instructor / Directorate Signature
        c.setFont("Helvetica-Bold", 11)
        c.setFillColor(colors.HexColor("#0F172A"))
        c.drawRightString(width - 70, 95, f"{instructor_name}")
        c.setFont("Helvetica", 9)
        c.setFillColor(colors.HexColor("#64748B"))
        c.drawRightString(width - 70, 80, "Course Instructor & Evaluation Lead")
        c.setStrokeColor(colors.HexColor("#94A3B8"))
        c.setLineWidth(1)
        c.line(width - 220, 110, width - 70, 110)

        c.showPage()
        c.save()

        buffer.seek(0)
        return buffer.getvalue()


pdf_service = PDFService()

