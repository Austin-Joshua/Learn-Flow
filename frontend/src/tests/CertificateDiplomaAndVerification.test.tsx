import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CertificateDiplomaCard } from '../components/certificate/CertificateDiplomaCard';
import { PublicVerifyCertificatePage } from '../pages/PublicVerifyCertificatePage';
import { api } from '../services/api';
import { Certificate, PublicVerificationResponse, DocumentVerificationResponse } from '../types';

vi.mock('../services/api', () => ({
  api: {
    certificates: {
      verifyPublic: vi.fn(),
      verifyDocument: vi.fn(),
    },
  },
}));

describe('CertificateDiplomaCard & PublicVerifyCertificatePage', () => {
  const mockCertificate: Certificate = {
    id: 'cert-uuid-1234',
    user_id: 'user-uuid-1234',
    course_id: 'course-uuid-1234',
    recipient_name: 'Ada Lovelace',
    course_title: 'Full-Stack System Design & Distributed Architecture',
    verification_code: 'LF-ACAD-7749-SYSARCH',
    status: 'valid',
    issued_at: '2026-10-20T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders CertificateDiplomaCard with authentic academic diploma elements and download links', () => {
    render(
      <BrowserRouter>
        <CertificateDiplomaCard certificate={mockCertificate} />
      </BrowserRouter>
    );

    expect(screen.getByText(/LEARNFLOW INSTITUTE OF ADVANCED COMPUTING/i)).toBeInTheDocument();
    expect(screen.getByText(/OFFICIAL DIPLOMA OF ACADEMIC ACHIEVEMENT/i)).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Full-Stack System Design & Distributed Architecture')).toBeInTheDocument();
    expect(screen.getByText(/100% course completion/i)).toBeInTheDocument();
    expect(screen.getByText(/Dr\. Alan Turing/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Grace Hopper/i).length).toBeGreaterThanOrEqual(1);

    // Check Download buttons
    const pdfLink = screen.getByRole('link', { name: /Download Official PDF/i });
    expect(pdfLink).toHaveAttribute('href', '/api/v1/certificates/cert-uuid-1234/download');

    const pngLink = screen.getByRole('link', { name: /Download PNG Image/i });
    expect(pngLink).toHaveAttribute('href', '/api/v1/certificates/cert-uuid-1234/download-image');

    // Check Verify Registry Link
    const verifyLink = screen.getByRole('link', { name: /Verify in Registry/i });
    expect(verifyLink).toHaveAttribute('href', '/verify?code=LF-ACAD-7749-SYSARCH');
  });

  it('allows copying verification code on CertificateDiplomaCard', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });

    render(
      <BrowserRouter>
        <CertificateDiplomaCard certificate={mockCertificate} />
      </BrowserRouter>
    );

    const copyBtn = screen.getByTitle('Copy Verification Code');
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('LF-ACAD-7749-SYSARCH');
  });

  it('verifies certificate code on PublicVerifyCertificatePage and displays authentic dossier', async () => {
    const mockValidResponse: PublicVerificationResponse = {
      valid: true,
      status: 'valid',
      verification_code: 'LF-ACAD-7749-SYSARCH',
      recipient_name: 'Ada Lovelace',
      course_title: 'Full-Stack System Design & Distributed Architecture',
      instructor_name: 'Academic Directorate',
      issued_at: '2026-10-20T00:00:00Z',
      pdf_download_url: '/api/v1/certificates/cert-123/download',
    };

    (api.certificates.verifyPublic as any).mockResolvedValueOnce({
      data: mockValidResponse,
    });

    render(
      <BrowserRouter>
        <PublicVerifyCertificatePage />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText(/e\.g\. LF-ACAD-7749-SYSARCH/i);
    fireEvent.change(input, { target: { value: 'LF-ACAD-7749-SYSARCH' } });

    const submitBtn = screen.getByRole('button', { name: /Verify Code/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.certificates.verifyPublic).toHaveBeenCalledWith('LF-ACAD-7749-SYSARCH');
      expect(screen.getByText(/Official Credential Authenticated/i)).toBeInTheDocument();
      expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    });
  });

  it('uploads document and displays multi-factor forensic breakdown on PublicVerifyCertificatePage', async () => {
    const mockDocResponse: DocumentVerificationResponse = {
      is_authentic: true,
      status: 'valid',
      verification_code: 'LF-ACAD-7749-SYSARCH',
      recipient_name: 'Ada Lovelace',
      course_title: 'Full-Stack System Design & Distributed Architecture',
      instructor_name: 'Academic Directorate',
      issued_at: '2026-10-20T00:00:00Z',
      completion_percentage: 100.0,
      logo_crest_verified: true,
      document_layout_valid: true,
      database_record_matched: true,
      course_completion_verified: true,
      signature_integrity_verified: true,
      message: 'Official Credential Authenticated',
      anomalies: [],
      pdf_download_url: '/api/v1/certificates/cert-123/download',
    };

    (api.certificates.verifyDocument as any).mockResolvedValueOnce({
      data: mockDocResponse,
    });

    render(
      <BrowserRouter>
        <PublicVerifyCertificatePage />
      </BrowserRouter>
    );

    // Switch to Upload tab
    const uploadTabBtn = screen.getByRole('button', { name: /Upload Certificate Document/i });
    fireEvent.click(uploadTabBtn);

    expect(screen.getByText(/Drag & Drop Certificate or Click to Browse/i)).toBeInTheDocument();

    const file = new File(['fake pdf content'], 'certificate.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(api.certificates.verifyDocument).toHaveBeenCalled();
      expect(screen.getByText(/Authenticity Verdict: REAL & VALID/i)).toBeInTheDocument();
      expect(screen.getByText(/Learnflow Official Seal/i)).toBeInTheDocument();
      expect(screen.getByText(/Document Geometry & Framing/i)).toBeInTheDocument();
      expect(screen.getByText(/PASS \(100%\)/i)).toBeInTheDocument();
    });
  });
});
