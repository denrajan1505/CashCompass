import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings


def send_email(to: str, subject: str, html_body: str):
    if not settings.SMTP_USER:
        print(f"[email] SMTP not configured — skipping email to {to}")
        return
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to
    msg.attach(MIMEText(html_body, "html"))
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.EMAIL_FROM, to, msg.as_string())


def send_verification_email(to: str, full_name: str, token: str):
    url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    send_email(to, "Verify your CashCompass account", f"""
    <h2>Hi {full_name},</h2>
    <p>Welcome to CashCompass! Please verify your email by clicking the link below:</p>
    <a href="{url}" style="background:#6C63FF;color:white;padding:12px 24px;border-radius:8px;text-decoration:none">Verify Email</a>
    <p>This link expires in 24 hours.</p>
    """)


def send_password_reset_email(to: str, full_name: str, token: str):
    url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    send_email(to, "Reset your CashCompass password", f"""
    <h2>Hi {full_name},</h2>
    <p>You requested a password reset. Click below to set a new password:</p>
    <a href="{url}" style="background:#6C63FF;color:white;padding:12px 24px;border-radius:8px;text-decoration:none">Reset Password</a>
    <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    """)
