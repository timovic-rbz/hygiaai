from datetime import datetime, timedelta, date, time
import logging
from typing import List, Dict, Any
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from ..db import repo
from ..models import AssignmentModel, CustomerModel
from ..schemas import NotificationSettings, ReminderTemplate

logger = logging.getLogger(__name__)

class NotificationService:
	def __init__(self):
		# In production, init SMTP client etc here
		pass

	async def send_reminder(self, assignment: Dict[str, Any], customer: Dict[str, Any], settings: Dict[str, Any]):
		# 1. Determine Template
		cust_type = customer.get("customer_type", "privat")
		templates = settings.get("templates", {})
		
		# Default templates if not configured
		tmpl_data = templates.get(cust_type)
		if not tmpl_data:
			if cust_type == "hausverwaltung":
				tmpl_data = {
					"subject": "Erinnerung: Reinigungstermin",
					"body": "Sehr geehrte Damen und Herren,\n\nmorgen sind wir im Objekt {{objectName}} ({{address}}) zwischen {{timeWindow}} eingeplant.\n\nMit freundlichen Grüßen,\n{{companyName}}"
				}
			else:
				tmpl_data = {
					"subject": "Reinigungstermin morgen",
					"body": "Hallo {{customerName}},\n\nmorgen kommen wir zu Ihnen zwischen {{timeWindow}}. Bitte Zugang sicherstellen.\n\nLG {{companyName}}"
				}

		# 2. Render
		subject = self._render(tmpl_data["subject"], assignment, customer)
		body = self._render(tmpl_data["body"], assignment, customer)

		# 3. Send
		channel = customer.get("preferred_channel", "email")
		if channel == "email" or channel == "both":
			if settings.get("enable_email", True):
				await self._send_email(customer.get("email"), subject, body)
		
		if channel == "sms" or channel == "both":
			if settings.get("enable_sms", False):
				await self._send_sms(customer.get("phone"), body)

	def _render(self, text: str, assignment: Dict[str, Any], customer: Dict[str, Any]) -> str:
		# Prepare context
		assign_date = assignment.get("date") # date object or str
		start_time = assignment.get("start_time") # time object or str
		
		# Format date/time
		date_str = str(assign_date)
		time_window = "08:00 - 17:00" # default
		if start_time:
			# simple assumption: duration 1h or from customer
			st = str(start_time)[:5]
			time_window = f"ab {st} Uhr"

		context = {
			"customerName": customer.get("name", ""),
			"objectName": customer.get("name", ""), # fallback if no object name
			"address": f"{customer.get('address', '')}, {customer.get('city', '')}",
			"date": date_str,
			"timeWindow": time_window,
			"companyName": "Hygia Reinigungen",
			"contactPhone": "+49 123 456789"
		}
		
		for k, v in context.items():
			text = text.replace(f"{{{{{k}}}}}", str(v))
		return text

	async def _send_email(self, to: str, subject: str, body: str):
		if not to:
			return
		# Placeholder for SMTP
		logger.info(f"[@] Sending EMAIL to {to}: Subject='{subject}'")
		# print(f"--- EMAIL ---\nTo: {to}\nSubject: {subject}\n\n{body}\n-------------")

	async def send_custom_email(self, to: str, subject: str, body: str):
		await self._send_email(to, subject, body)

	async def _send_sms(self, to: str, body: str):
		if not to:
			return
		# Placeholder for Twilio
		logger.info(f"[@] Sending SMS to {to}: '{body[:20]}...'")


service = NotificationService()
scheduler = AsyncIOScheduler()

async def check_and_send_reminders():
	logger.info("Checking for reminders...")
	settings = repo.get_notification_settings()
	if not settings.get("enabled"):
		return

	hours_before = settings.get("hours_before", 24)
	# Look for assignments in window: now + hours_before (approx)
	# Logic: find assignments where start_datetime is between now and now+hours+buffer
	# Simpler Logic for MVP: Check all assignments that are tomorrow (if 24h) or match date logic.
	
	# We need datetime comparison. Assignment has date + start_time.
	now = datetime.now()
	target_start = now + timedelta(hours=hours_before)
	target_end = target_start + timedelta(hours=1) # 1h window to catch them? Or just check everything "upcoming" that hasn't been reminded?
	
	# Better Strategy: "Look ahead X hours". Any assignment starting within [now, now + X + buffer] that HAS NOT been reminded.
	# To avoid reminding too early (e.g. 48h before when 24h set), we check lower bound.
	# Range: [now + hours_before - 1h, now + hours_before + 1h] ?
	# Let's say standard is "Day before".
	
	# Let's iterate all future assignments and check difference.
	assignments = repo.list_assignments()
	
	count = 0
	for a in assignments:
		if a.get("reminder_sent_at") or a.get("no_reminder"):
			continue
			
		# Build datetime
		d = a["date"] # date
		t = a["start_time"] or time(8, 0) # default 8am
		
		if isinstance(d, str):
			d = datetime.strptime(d, "%Y-%m-%d").date()
		if isinstance(t, str):
			t = datetime.strptime(t, "%H:%M:%S").time()
			
		dt = datetime.combine(d, t)
		
		diff = dt - now
		hours_diff = diff.total_seconds() / 3600
		
		# If it's within the window (e.g. between hours_before-1 and hours_before+1)
		# Or just "less than hours_before" but "more than 1h" (not in past)
		# To avoid double send, we rely on reminder_sent_at.
		# We trigger if diff <= hours_before.
		
		if 0 < hours_diff <= hours_before:
			# Send!
			cust = repo.get_customer(a["customer_id"])
			if cust and cust.get("wants_reminders"):
				await service.send_reminder(a, cust, settings)
				
				# Mark done
				repo.update_assignment(a["id"], {"reminder_sent_at": datetime.now()})
				count += 1
	
	if count > 0:
		logger.info(f"Sent {count} reminders.")

def start_scheduler():
	if not scheduler.running:
		scheduler.add_job(check_and_send_reminders, "interval", minutes=15)
		scheduler.start()
		logger.info("Reminder scheduler started (interval=15min).")

