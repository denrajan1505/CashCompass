import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings


def send_email(to: str, subject: str, html_body: str):
    if not settings.SMTP_USER:
        print(f"[email] SMTP not configured — skipping email to {to}")
        return
    print(f"[email] Sending '{subject}' to {to} via {settings.SMTP_HOST}:{settings.SMTP_PORT} as {settings.SMTP_USER}")
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = to
        msg.attach(MIMEText(html_body, "html"))
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAIL_FROM, to, msg.as_string())
        print(f"[email] Successfully sent to {to}")
    except Exception as e:
        print(f"[email] ERROR sending to {to}: {e}")


def send_verification_email(to: str, full_name: str, token: str):
    url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    send_email(to, "Verify your CashCompass account", f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:12px;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:28px;font-weight:bold;color:#6C63FF;">CashCompass</span>
      </div>
      <div style="background:#ffffff;border-radius:10px;padding:32px;">
        <h2 style="color:#1a1a2e;margin-top:0;">Hi {full_name},</h2>
        <p style="color:#555;line-height:1.6;">Welcome to CashCompass! Please verify your email address to activate your account:</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="{url}" style="background:#6C63FF;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">Verify Email</a>
        </div>
        <p style="color:#888;font-size:13px;line-height:1.6;">This link expires in <strong>24 hours</strong>.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#aaa;font-size:12px;text-align:center;margin:0;">If the button doesn't work, copy and paste this link:<br/>
          <a href="{url}" style="color:#6C63FF;word-break:break-all;">{url}</a>
        </p>
      </div>
    </div>
    """)


def send_password_reset_email(to: str, full_name: str, token: str):
    url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    send_email(to, "Reset your CashCompass password", f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:12px;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:28px;font-weight:bold;color:#6C63FF;">CashCompass</span>
      </div>
      <div style="background:#ffffff;border-radius:10px;padding:32px;">
        <h2 style="color:#1a1a2e;margin-top:0;">Hi {full_name},</h2>
        <p style="color:#555;line-height:1.6;">You requested a password reset for your CashCompass account. Click the button below to set a new password:</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="{url}" style="background:#6C63FF;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">Reset Password</a>
        </div>
        <p style="color:#888;font-size:13px;line-height:1.6;">This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#aaa;font-size:12px;text-align:center;margin:0;">If the button doesn't work, copy and paste this link:<br/>
          <a href="{url}" style="color:#6C63FF;word-break:break-all;">{url}</a>
        </p>
      </div>
    </div>
    """)
