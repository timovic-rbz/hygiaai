from datetime import datetime, time, timedelta
from uuid import uuid4
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from ..db import repo
from ..config import settings
from .notification import service as notification_service

logger = logging.getLogger(__name__)

quality_scheduler = AsyncIOScheduler()


async def check_feedback_requests():
	cfg = repo.get_quality_settings()
	if not cfg.get("enabled"):
		return

	assignments = repo.list_assignments()
	now = datetime.utcnow()
	window_days = 7
	count = 0

	for assignment in assignments:
		status = (assignment.get("status") or "").lower()
		if status not in {"done", "completed"}:
			continue
		if assignment.get("feedback_requested_at"):
			continue
		if assignment.get("no_feedback"):
			continue

		date_val = assignment.get("date")
		if isinstance(date_val, str):
			try:
				date_val = datetime.strptime(date_val, "%Y-%m-%d").date()
			except ValueError:
				continue
		start_val = assignment.get("start_time")
		if isinstance(start_val, str):
			try:
				start_val = datetime.strptime(start_val, "%H:%M:%S").time()
			except ValueError:
				start_val = None
		if not isinstance(start_val, time):
			start_val = time(8, 0)

		event_dt = datetime.combine(date_val, start_val)
		if event_dt > now:
			continue
		if now - event_dt > timedelta(days=window_days):
			continue

		if cfg.get("trigger_mode") == "service_type" and cfg.get("allowed_service_types"):
			if (assignment.get("service_type") or "") not in cfg.get("allowed_service_types"):
				continue

		customer = repo.get_customer(assignment["customer_id"])
		if not customer or not customer.get("email"):
			continue

		token = assignment.get("feedback_token") or str(uuid4())
		feedback_link = f"{settings.frontend_url or 'http://localhost:3000'}/feedback/{token}"
		subject = cfg.get("email_subject")
		body = cfg.get("email_body", "").replace("{{customerName}}", customer.get("name", "")) \
			.replace("{{objectName}}", customer.get("name", "")) \
			.replace("{{address}}", customer.get("address", "") or "") \
			.replace("{{date}}", assignment.get("date") or "") \
			.replace("{{companyName}}", "HygiaAI") \
			.replace("{{feedbackLink}}", feedback_link)

		try:
			if cfg.get("use_email", True):
				await notification_service.send_custom_email(customer.get("email"), subject, body)
			repo.update_assignment(assignment["id"], {
				"feedback_requested_at": now,
				"feedback_token": token
			})
			count += 1
		except Exception as exc:
			logger.error("Feedback request failed: %s", exc)

	if count:
		logger.info("Feedback-Anfragen versendet: %s", count)


def start_quality_scheduler():
	if not quality_scheduler.running:
		quality_scheduler.add_job(check_feedback_requests, "interval", minutes=30)
		quality_scheduler.start()
		logger.info("Quality scheduler started (30 min interval).")

