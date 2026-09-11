import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config();

const app = express();
const PORT = 3000;

// High limit for base64 PDF and embedded photos
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API Route for sending report via Resend
app.post('/api/send-report', async (req, res) => {
  try {
    let {
      pdfBase64,
      facilityEmail,
      supervisorEmail,
      facilityName,
      score,
      status,
      inspectorName,
      inspectionDate,
    } = req.body;

    if (!facilityEmail) {
      return res.status(400).json({ success: false, error: 'Facility manager email is required.' });
    }

    if (!pdfBase64) {
      return res.status(400).json({ success: false, error: 'PDF attachment data is missing.' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const configuredFrom = process.env.RESEND_FROM_EMAIL?.trim();

    // Check if configured email uses a public webmail provider that cannot be verified on Resend
    const publicWebmailProviders = ['@gmail.com', '@yahoo.com', '@outlook.com', '@hotmail.com', '@icloud.com', '@aol.com'];
    const isPublicWebmail = configuredFrom && publicWebmailProviders.some(provider => configuredFrom.toLowerCase().includes(provider));

    let fromAddress = configuredFrom || 'Commercial Cleaning Audits <onboarding@resend.dev>';
    let replyToAddress = configuredFrom || supervisorEmail || undefined;

    if (isPublicWebmail) {
      fromAddress = 'Commercial Cleaning Audits <onboarding@resend.dev>';
    }

    const isPassed = status === 'PASSED - COMPLIANT' || score >= 85;
    const statusColor = isPassed ? '#059669' : '#dc2626';
    const statusBg = isPassed ? '#ecfdf5' : '#fef2f2';
    const statusBorder = isPassed ? '#a7f3d0' : '#fecaca';

    facilityName = (facilityName || 'Facility').trim();
    status = status || (isPassed ? 'PASSED - COMPLIANT' : 'ACTION REQUIRED - NON-COMPLIANT');
    score = score !== undefined ? score : 0;

    const safeFacilityName = facilityName;
    const cleanFilename = `Audit_${safeFacilityName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Inspection Audit Report</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <tr>
              <td style="background-color: #0f172a; padding: 28px 32px; text-align: left;">
                <div style="color: #38bdf8; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px;">Commercial Cleaning Services</div>
                <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0 0 4px 0;">Quality Inspection Audit Report</h1>
                <p style="color: #94a3b8; font-size: 13px; margin: 0;">Official certification report delivered for <strong>${safeFacilityName}</strong></p>
              </td>
            </tr>
            <tr>
              <td style="padding: 24px 32px 16px 32px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${statusBg}; border: 1px solid ${statusBorder}; border-radius: 8px; padding: 18px 20px;">
                  <tr>
                    <td style="vertical-align: middle;">
                      <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: ${statusColor}; letter-spacing: 0.5px;">Compliance Score</div>
                      <div style="font-size: 32px; font-weight: 800; color: ${statusColor}; line-height: 1.1;">${score}%</div>
                      <div style="font-size: 12px; font-weight: 700; color: ${statusColor}; margin-top: 4px;">${status}</div>
                    </td>
                    <td style="text-align: right; vertical-align: middle;">
                      <div style="display: inline-block; background-color: ${statusColor}; color: #ffffff; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700;">
                        ${isPassed ? '✓ Compliant' : '⚠ Action Required'}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 32px 24px 32px;">
                <h2 style="font-size: 14px; font-weight: 700; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; margin: 16px 0 12px 0;">Audit Metadata</h2>
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px; border-collapse: collapse;">
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 10px 0; color: #64748b; font-weight: 500;">Facility:</td>
                    <td style="padding: 10px 0; color: #0f172a; font-weight: 600; text-align: right;">${safeFacilityName}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 10px 0; color: #64748b; font-weight: 500;">Inspecting Supervisor:</td>
                    <td style="padding: 10px 0; color: #0f172a; font-weight: 600; text-align: right;">${inspectorName || 'Field Supervisor'}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 10px 0; color: #64748b; font-weight: 500;">Date & Time:</td>
                    <td style="padding: 10px 0; color: #0f172a; font-weight: 600; text-align: right;">${inspectionDate || new Date().toLocaleString()}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 10px 0; color: #64748b; font-weight: 500;">Facility Manager Email:</td>
                    <td style="padding: 10px 0; color: #0f172a; font-weight: 600; text-align: right;">${facilityEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #64748b; font-weight: 500;">Supervisor Notification Email:</td>
                    <td style="padding: 10px 0; color: #0f172a; font-weight: 600; text-align: right;">${supervisorEmail || 'None'}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 32px 28px 32px;">
                <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 16px; text-align: center;">
                  <div style="font-size: 13px; font-weight: 600; color: #0f172a; margin-bottom: 4px;">📎 Executive PDF Report Attached</div>
                  <p style="font-size: 12px; color: #64748b; margin: 0;">
                    Please find attached <strong>${cleanFilename}</strong> containing complete item-by-item breakdown, photographic evidence, and certified digital supervisor signature.
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center;">
                <p style="font-size: 11px; color: #94a3b8; margin: 0 0 6px 0;">
                  This is an automated operational audit transmission generated by Commercial Cleaning Quality Assurance.
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    if (!apiKey) {
      console.warn('RESEND_API_KEY is not configured. Simulating dispatch.');
      return res.status(200).json({
        success: true,
        simulated: true,
        message: 'Audit report generated and delivery simulated successfully! (Add RESEND_API_KEY to project settings for live email dispatch).',
        recipient: facilityEmail,
        cc: supervisorEmail || null,
        filename: cleanFilename,
      });
    }

    const resend = new Resend(apiKey);

    const emailPayload: {
      from: string;
      to: string[];
      cc?: string[];
      replyTo?: string;
      subject: string;
      html: string;
      attachments: { filename: string; content: string }[];
    } = {
      from: fromAddress,
      to: [facilityEmail],
      subject: `Clean Audit Pro | Facility Inspection: ${facilityName} - ${status} (${score}%)`,
      html: htmlContent,
      attachments: [
        {
          filename: cleanFilename,
          content: pdfBase64,
        },
      ],
    };

    if (replyToAddress) {
      emailPayload.replyTo = replyToAddress;
    }

    if (supervisorEmail && supervisorEmail.trim() !== '') {
      emailPayload.cc = [supervisorEmail.trim()];
    }

    let response = await resend.emails.send(emailPayload);

    // If custom domain is not yet verified on Resend, retry using onboarding@resend.dev with replyTo
    if (response.error && response.error.message?.includes('domain is not verified')) {
      console.warn('Sender domain not verified on Resend. Retrying with onboarding@resend.dev...');
      emailPayload.from = 'Commercial Cleaning Audits <onboarding@resend.dev>';
      response = await resend.emails.send(emailPayload);
    }

    if (response.error) {
      console.error('Resend error:', response.error);
      return res.status(500).json({
        success: false,
        error: response.error.message || 'Failed to send email via Resend.',
      });
    }

    return res.status(200).json({
      success: true,
      data: response.data,
      message: `Audit report successfully dispatched to ${facilityEmail}${supervisorEmail ? ` and CC'd to ${supervisorEmail}` : ''}.`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Server error sending report:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error while dispatching audit report.',
    });
  }
});

// Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Inspection Audit server running on http://localhost:${PORT}`);
  });
}

startServer();
