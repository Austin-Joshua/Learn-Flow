import io
from datetime import datetime
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from PIL import Image, ImageDraw, ImageFont, PngImagePlugin


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
        Generates a prestigious, authentic academic diploma certificate PDF in landscape letter format.
        Embeds cryptographic verification metadata in standard PDF document dictionary headers.
        Returns the raw PDF bytes.
        """
        buffer = io.BytesIO()
        width, height = landscape(letter)

        c = canvas.Canvas(buffer, pagesize=landscape(letter))

        # 1. Document Metadata (Critical for tamper-proof binary regex inspection)
        c.setTitle(f"Learnflow Certificate {verification_code}")
        c.setSubject(verification_code)
        c.setAuthor("Learnflow Academic Directorate")
        c.setKeywords(f"Learnflow;Certificate;{verification_code};100%;Verified;Academic;Mastery")
        c.setCreator("Learnflow Cryptographic Credential Engine")

        # 2. Parchment Ivory Background
        c.setFillColor(colors.HexColor("#FAF8F5"))
        c.rect(0, 0, width, height, fill=True, stroke=False)

        # 3. Outer Academic Dark Border
        c.setStrokeColor(colors.HexColor("#0B1E28"))
        c.setLineWidth(5)
        c.rect(18, 18, width - 36, height - 36)

        # 4. Inner Antique Gold Border
        c.setStrokeColor(colors.HexColor("#C5A059"))
        c.setLineWidth(1.5)
        c.rect(26, 26, width - 52, height - 52)

        # 5. Ornamental Corner Accents (Gold Diamonds)
        c.setFillColor(colors.HexColor("#C5A059"))
        for (cx, cy) in [(34, 34), (width - 34, 34), (34, height - 34), (width - 34, height - 34)]:
            p = c.beginPath()
            p.moveTo(cx, cy - 7)
            p.lineTo(cx + 7, cy)
            p.lineTo(cx, cy + 7)
            p.lineTo(cx - 7, cy)
            p.close()
            c.drawPath(p, fill=True, stroke=False)

        # 6. Academic Seal & Crest (Top Center)
        crest_x = width / 2.0
        crest_y = height - 68
        c.setStrokeColor(colors.HexColor("#C5A059"))
        c.setLineWidth(1.5)
        c.circle(crest_x, crest_y, 20, stroke=True, fill=False)
        c.setFillColor(colors.HexColor("#0B1E28"))
        c.circle(crest_x, crest_y, 16, stroke=False, fill=True)
        c.setFillColor(colors.HexColor("#FAF8F5"))
        c.setFont("Helvetica-Bold", 11)
        c.drawCentredString(crest_x, crest_y - 4, "LF")

        # 7. Institution Header
        c.setFont("Helvetica-Bold", 14)
        c.setFillColor(colors.HexColor("#0B1E28"))
        c.drawCentredString(width / 2.0, height - 104, "LEARNFLOW INSTITUTE OF ADVANCED COMPUTING")

        c.setFont("Helvetica", 9)
        c.setFillColor(colors.HexColor("#C5A059"))
        c.drawCentredString(width / 2.0, height - 118, "OFFICIAL DIPLOMA OF ACADEMIC ACHIEVEMENT & CURRICULUM MASTERY")

        # Decorative Horizontal Hairlines with Center Gold Knot
        c.setStrokeColor(colors.HexColor("#E2D8C3"))
        c.setLineWidth(1)
        c.line(width / 2.0 - 200, height - 132, width / 2.0 - 30, height - 132)
        c.line(width / 2.0 + 30, height - 132, width / 2.0 + 200, height - 132)
        c.setFillColor(colors.HexColor("#C5A059"))
        c.circle(width / 2.0, height - 132, 3, fill=True, stroke=False)

        # 8. Conferment Statement
        c.setFont("Helvetica-Oblique", 13)
        c.setFillColor(colors.HexColor("#475569"))
        c.drawCentredString(width / 2.0, height - 162, "This authoritative credential is proud to certify that")

        # 9. Recipient Name (Prominent Academic Typography)
        c.setFont("Helvetica-Bold", 26)
        c.setFillColor(colors.HexColor("#0B1E28"))
        c.drawCentredString(width / 2.0, height - 205, recipient_name)

        # Name Underline Ribbon in Gold
        c.setStrokeColor(colors.HexColor("#C5A059"))
        c.setLineWidth(1.5)
        c.line(width / 2.0 - 180, height - 215, width / 2.0 + 180, height - 215)

        # 10. Requirement & Achievement Citation
        c.setFont("Helvetica", 11)
        c.setFillColor(colors.HexColor("#334155"))
        c.drawCentredString(
            width / 2.0,
            height - 245,
            "has satisfied all rigorous institutional criteria, achieved 100% course completion, and demonstrated verified mastery in"
        )

        # 11. Course Title
        c.setFont("Helvetica-Bold", 20)
        c.setFillColor(colors.HexColor("#0284C7"))  # Vivid Sky Blue
        c.drawCentredString(width / 2.0, height - 285, course_title)

        # 12. Verification & 100% Mastery Badge (Left Footer)
        seal_x = 95
        seal_y = 120
        c.setFillColor(colors.HexColor("#FEF9C3"))  # Pale Gold Tint
        c.setStrokeColor(colors.HexColor("#C5A059"))
        c.setLineWidth(2)
        c.circle(seal_x, seal_y, 30, stroke=True, fill=True)
        c.setFillColor(colors.HexColor("#0B1E28"))
        c.setFont("Helvetica-Bold", 7.5)
        c.drawCentredString(seal_x, seal_y + 10, "LEARNFLOW")
        c.drawCentredString(seal_x, seal_y, "100% MASTERY")
        c.setFont("Helvetica-Bold", 6.5)
        c.setFillColor(colors.HexColor("#C5A059"))
        c.drawCentredString(seal_x, seal_y - 10, "OFFICIAL SEAL")

        # 13. Authority Signatures (Dual Signatures)
        sig_y = 120
        sig_width = 170

        # Left Signature: Provost Alan Turing
        c.setStrokeColor(colors.HexColor("#94A3B8"))
        c.setLineWidth(1)
        c.line(width / 2.0 - sig_width - 15, sig_y + 10, width / 2.0 - 15, sig_y + 10)
        c.setFont("Helvetica-Oblique", 11)
        c.setFillColor(colors.HexColor("#0B1E28"))
        c.drawCentredString(width / 2.0 - (sig_width / 2.0) - 15, sig_y + 18, "Alan Turing")
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(width / 2.0 - (sig_width / 2.0) - 15, sig_y - 3, "Dr. Alan Turing")
        c.setFont("Helvetica", 7.5)
        c.setFillColor(colors.HexColor("#64748B"))
        c.drawCentredString(width / 2.0 - (sig_width / 2.0) - 15, sig_y - 14, "Provost & Dean of Computing")

        # Right Signature: Instructor / Directorate Grace Hopper
        c.setStrokeColor(colors.HexColor("#94A3B8"))
        c.setLineWidth(1)
        c.line(width / 2.0 + 15, sig_y + 10, width / 2.0 + sig_width + 15, sig_y + 10)
        c.setFont("Helvetica-Oblique", 11)
        c.setFillColor(colors.HexColor("#0B1E28"))
        c.drawCentredString(width / 2.0 + (sig_width / 2.0) + 15, sig_y + 18, instructor_name)
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(width / 2.0 + (sig_width / 2.0) + 15, sig_y - 3, instructor_name)
        c.setFont("Helvetica", 7.5)
        c.setFillColor(colors.HexColor("#64748B"))
        c.drawCentredString(width / 2.0 + (sig_width / 2.0) + 15, sig_y - 14, "Academic Directorate & Systems Lead")

        # 14. Authoritative Verification Footer
        issue_str = issued_at.strftime("%B %d, %Y")
        c.setFont("Helvetica-Bold", 8.5)
        c.setFillColor(colors.HexColor("#0B1E28"))
        c.drawCentredString(width / 2.0, 56, f"Verification Code: {verification_code}")

        c.setFont("Helvetica", 7.5)
        c.setFillColor(colors.HexColor("#64748B"))
        c.drawCentredString(width / 2.0, 44, f"Issued: {issue_str}  •  Verify Online: https://learnflow.edu/verify/{verification_code}")

        c.setFont("Helvetica", 6.5)
        c.setFillColor(colors.HexColor("#94A3B8"))
        c.drawCentredString(width / 2.0, 34, "HMAC-SHA256 Cryptographically Signed Credential  •  Institutional Registry Verified  •  100% Completion")

        c.showPage()
        c.save()

        buffer.seek(0)
        return buffer.getvalue()

    @staticmethod
    def generate_certificate_image(
        recipient_name: str,
        course_title: str,
        verification_code: str,
        issued_at: datetime,
        instructor_name: str = "Academic Directorate"
    ) -> bytes:
        """
        Generates a high-resolution authentic PNG certificate image (1600x1050).
        Embeds verification metadata in standard PNG tEXt chunks for document inspection.
        """
        w, h = 1600, 1050
        img = Image.new("RGB", (w, h), color="#FAF8F5")
        draw = ImageDraw.Draw(img)

        # 1. Outer Dark Navy Border & Inner Gold Border
        draw.rectangle([24, 24, w - 24, h - 24], outline="#0B1E28", width=6)
        draw.rectangle([36, 36, w - 36, h - 36], outline="#C5A059", width=2)

        # 2. Corner Ornaments (Diamonds)
        for cx, cy in [(48, 48), (w - 48, 48), (48, h - 48), (w - 48, h - 48)]:
            draw.polygon([
                (cx, cy - 10),
                (cx + 10, cy),
                (cx, cy + 10),
                (cx - 10, cy)
            ], fill="#C5A059")

        # 3. Fonts
        font_header = ImageFont.load_default(size=30)
        font_sub = ImageFont.load_default(size=16)
        font_label = ImageFont.load_default(size=20)
        font_name = ImageFont.load_default(size=48)
        font_course = ImageFont.load_default(size=36)
        font_small = ImageFont.load_default(size=16)
        font_tiny = ImageFont.load_default(size=14)

        # 4. Top Academic Crest
        crest_x = w // 2
        crest_y = 110
        draw.ellipse([crest_x - 30, crest_y - 30, crest_x + 30, crest_y + 30], outline="#C5A059", width=2)
        draw.ellipse([crest_x - 24, crest_y - 24, crest_x + 24, crest_y + 24], fill="#0B1E28")
        draw.text((crest_x, crest_y), "LF", fill="#FAF8F5", font=font_sub, anchor="mm")

        # 5. Header Titles
        draw.text((w // 2, 175), "LEARNFLOW INSTITUTE OF ADVANCED COMPUTING", fill="#0B1E28", font=font_header, anchor="mm")
        draw.text((w // 2, 215), "OFFICIAL DIPLOMA OF ACADEMIC ACHIEVEMENT & CURRICULUM MASTERY", fill="#C5A059", font=font_sub, anchor="mm")
        draw.line([w // 2 - 300, 240, w // 2 + 300, 240], fill="#E2D8C3", width=2)

        # 6. Presentation
        draw.text((w // 2, 300), "This authoritative credential is proud to certify that", fill="#475569", font=font_label, anchor="mm")

        # 7. Recipient Name
        draw.text((w // 2, 390), recipient_name, fill="#0B1E28", font=font_name, anchor="mm")
        draw.line([w // 2 - 280, 425, w // 2 + 280, 425], fill="#C5A059", width=2)

        # 8. Achievement Details
        draw.text(
            (w // 2, 480),
            "has satisfied all institutional criteria, completed 100% of coursework, and demonstrated verified mastery in",
            fill="#334155",
            font=font_label,
            anchor="mm"
        )

        # 9. Course Title
        draw.text((w // 2, 560), course_title, fill="#0284C7", font=font_course, anchor="mm")

        # 10. Official Seal (Left bottom)
        seal_x, seal_y = 220, 780
        draw.ellipse([seal_x - 55, seal_y - 55, seal_x + 55, seal_y + 55], fill="#FEF9C3", outline="#C5A059", width=3)
        draw.text((seal_x, seal_y - 20), "LEARNFLOW", fill="#0B1E28", font=font_tiny, anchor="mm")
        draw.text((seal_x, seal_y), "100% MASTERY", fill="#0B1E28", font=font_small, anchor="mm")
        draw.text((seal_x, seal_y + 20), "OFFICIAL SEAL", fill="#C5A059", font=font_tiny, anchor="mm")

        # 11. Signatures
        # Turing
        sig1_x = 650
        draw.line([sig1_x - 140, 790, sig1_x + 140, 790], fill="#94A3B8", width=2)
        draw.text((sig1_x, 765), "Alan Turing", fill="#0B1E28", font=font_label, anchor="mm")
        draw.text((sig1_x, 810), "Dr. Alan Turing", fill="#0B1E28", font=font_small, anchor="mm")
        draw.text((sig1_x, 830), "Provost & Dean of Computing", fill="#64748B", font=font_tiny, anchor="mm")

        # Instructor / Lead
        sig2_x = 1100
        draw.line([sig2_x - 140, 790, sig2_x + 140, 790], fill="#94A3B8", width=2)
        draw.text((sig2_x, 765), instructor_name, fill="#0B1E28", font=font_label, anchor="mm")
        draw.text((sig2_x, 810), instructor_name, fill="#0B1E28", font=font_small, anchor="mm")
        draw.text((sig2_x, 830), "Academic Directorate & Systems Lead", fill="#64748B", font=font_tiny, anchor="mm")

        # 12. Verification Code & Security Footer
        issue_str = issued_at.strftime("%B %d, %Y")
        draw.text((w // 2, 930), f"Verification Code: {verification_code}", fill="#0B1E28", font=font_small, anchor="mm")
        draw.text(
            (w // 2, 960),
            f"Issued: {issue_str}  •  Verify: https://learnflow.edu/verify/{verification_code}",
            fill="#64748B",
            font=font_tiny,
            anchor="mm"
        )
        draw.text(
            (w // 2, 985),
            "HMAC-SHA256 Cryptographically Signed Credential  •  Institutional Registry Verified  •  100% Completion",
            fill="#94A3B8",
            font=font_tiny,
            anchor="mm"
        )

        buffer = io.BytesIO()
        png_info = PngImagePlugin.PngInfo()
        png_info.add_text("Verification-Code", verification_code)
        png_info.add_text("Issuer", "Learnflow Academic Directorate")
        png_info.add_text("Course", course_title)
        png_info.add_text("Recipient", recipient_name)
        png_info.add_text("Completion", "100%")
        png_info.add_text("Issued", issue_str)
        png_info.add_text("Status", "Authentic")

        img.save(buffer, format="PNG", pnginfo=png_info)
        buffer.seek(0)
        return buffer.getvalue()


pdf_service = PDFService()
