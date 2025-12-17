from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime
from uuid import uuid4
 
from .schemas import (
	Customer, CustomerCreate, CustomerUpdate,
	Employee, EmployeeCreate, EmployeeUpdate,
	Assignment, AssignmentCreate, AssignmentUpdate,
	ServiceType, ServiceTypeCreate, ServiceTypeUpdate,
	PlanningAutoRequest, PlanningAutoResponse,
	AssistantQueryRequest, AssistantQueryResponse,
	PricingSettings, PricingSettingsUpdate,
	CityPricing, CityPricingCreate, CityPricingUpdate,
	CalculationRequest, CalculationResponse,
	NotificationSettings, NotificationSettingsUpdate,
	QualitySettings, QualitySettingsUpdate,
	Feedback, FeedbackCreate, FeedbackSubmit,
	Ticket, TicketCreate, TicketUpdate,
	Photo, PhotoCreate, PhotoShareResponse
)
from .db import repo
from .planning import auto_plan
from .assistant import openrouter_client
from .calculation import calculate_price
from .storage import save_upload_file
from .config import settings

router = APIRouter()


# Customers
@router.get("/customers", response_model=List[Customer])
def list_customers():
	return repo.list_customers()


@router.post("/customers", response_model=Customer)
def create_customer(payload: CustomerCreate):
	return repo.create_customer(payload.model_dump(exclude_none=True))


@router.get("/customers/{id}", response_model=Customer)
def get_customer(id: str):
	obj = repo.get_customer(id)
	if not obj:
		raise HTTPException(status_code=404, detail="Customer not found")
	return obj


@router.put("/customers/{id}", response_model=Customer)
def update_customer(id: str, payload: CustomerUpdate):
	obj = repo.update_customer(id, payload.model_dump(exclude_none=True))
	if not obj:
		raise HTTPException(status_code=404, detail="Customer not found")
	return obj


@router.delete("/customers/{id}")
def delete_customer(id: str):
	ok = repo.delete_customer(id)
	if not ok:
		raise HTTPException(status_code=404, detail="Customer not found")
	return {"ok": True}


# Employees
@router.get("/employees", response_model=List[Employee])
def list_employees():
	return repo.list_employees()


@router.post("/employees", response_model=Employee)
def create_employee(payload: EmployeeCreate):
	return repo.create_employee(payload.model_dump(exclude_none=True))


@router.get("/employees/{id}", response_model=Employee)
def get_employee(id: str):
	obj = repo.get_employee(id)
	if not obj:
		raise HTTPException(status_code=404, detail="Employee not found")
	return obj


@router.put("/employees/{id}", response_model=Employee)
def update_employee(id: str, payload: EmployeeUpdate):
	obj = repo.update_employee(id, payload.model_dump(exclude_none=True))
	if not obj:
		raise HTTPException(status_code=404, detail="Employee not found")
	return obj


@router.delete("/employees/{id}")
def delete_employee(id: str):
	ok = repo.delete_employee(id)
	if not ok:
		raise HTTPException(status_code=404, detail="Employee not found")
	return {"ok": True}


# Assignments
@router.get("/assignments", response_model=List[Assignment])
def list_assignments():
	return repo.list_assignments()


@router.post("/assignments", response_model=Assignment)
def create_assignment(payload: AssignmentCreate):
	return repo.create_assignment(payload.model_dump(exclude_none=True))


@router.get("/assignments/{id}", response_model=Assignment)
def get_assignment(id: str):
	obj = repo.get_assignment(id)
	if not obj:
		raise HTTPException(status_code=404, detail="Assignment not found")
	return obj


@router.put("/assignments/{id}", response_model=Assignment)
def update_assignment(id: str, payload: AssignmentUpdate):
	obj = repo.update_assignment(id, payload.model_dump(exclude_none=True))
	if not obj:
		raise HTTPException(status_code=404, detail="Assignment not found")
	return obj


@router.delete("/assignments/{id}")
def delete_assignment(id: str):
	ok = repo.delete_assignment(id)
	if not ok:
		raise HTTPException(status_code=404, detail="Assignment not found")
	return {"ok": True}


# Service Types
@router.get("/service-types", response_model=List[ServiceType])
def list_service_types():
	return repo.list_service_types()


@router.post("/service-types", response_model=ServiceType)
def create_service_type(payload: ServiceTypeCreate):
	return repo.create_service_type(payload.model_dump(exclude_none=True))


@router.get("/service-types/{id}", response_model=ServiceType)
def get_service_type(id: str):
	obj = repo.get_service_type(id)
	if not obj:
		raise HTTPException(status_code=404, detail="ServiceType not found")
	return obj


@router.put("/service-types/{id}", response_model=ServiceType)
def update_service_type(id: str, payload: ServiceTypeUpdate):
	obj = repo.update_service_type(id, payload.model_dump(exclude_none=True))
	if not obj:
		raise HTTPException(status_code=404, detail="ServiceType not found")
	return obj


@router.delete("/service-types/{id}")
def delete_service_type(id: str):
	ok = repo.delete_service_type(id)
	if not ok:
		raise HTTPException(status_code=404, detail="ServiceType not found")
	return {"ok": True}


# Pricing Settings
@router.get("/pricing/settings", response_model=PricingSettings)
def get_pricing_settings():
	return repo.get_pricing_settings()


@router.put("/pricing/settings", response_model=PricingSettings)
def update_pricing_settings(payload: PricingSettingsUpdate):
	return repo.update_pricing_settings(payload.model_dump(exclude_none=True))


# Notification Settings
@router.get("/notifications/settings", response_model=NotificationSettings)
def get_notification_settings():
	return repo.get_notification_settings()


@router.put("/notifications/settings", response_model=NotificationSettings)
def update_notification_settings(payload: NotificationSettingsUpdate):
	return repo.update_notification_settings(payload.model_dump(exclude_none=True))


# City Pricing
@router.get("/pricing/cities", response_model=List[CityPricing])
def list_city_pricing():
	return repo.list_city_pricing()


@router.post("/pricing/cities", response_model=CityPricing)
def create_city_pricing(payload: CityPricingCreate):
	return repo.create_city_pricing(payload.model_dump(exclude_none=True))


@router.put("/pricing/cities/{id}", response_model=CityPricing)
def update_city_pricing(id: str, payload: CityPricingUpdate):
	obj = repo.update_city_pricing(id, payload.model_dump(exclude_none=True))
	if not obj:
		raise HTTPException(status_code=404, detail="CityPricing not found")
	return obj


@router.delete("/pricing/cities/{id}")
def delete_city_pricing(id: str):
	ok = repo.delete_city_pricing(id)
	if not ok:
		raise HTTPException(status_code=404, detail="CityPricing not found")
	return {"ok": True}


# Quality Settings
@router.get("/quality/settings", response_model=QualitySettings)
def get_quality_settings():
	return repo.get_quality_settings()


@router.put("/quality/settings", response_model=QualitySettings)
def update_quality_settings(payload: QualitySettingsUpdate):
	return repo.update_quality_settings(payload.model_dump(exclude_none=True))


# Feedback
@router.get("/feedback", response_model=List[Feedback])
def list_feedback():
	return repo.list_feedback()


@router.post("/feedback", response_model=Feedback)
def create_feedback(payload: FeedbackCreate):
	return _create_feedback_with_logic(payload.model_dump(exclude_none=True))


@router.post("/feedback/submit", response_model=Feedback)
def submit_feedback(payload: FeedbackSubmit):
	assignment = repo.get_assignment_by_token(payload.token)
	if not assignment:
		raise HTTPException(status_code=404, detail="Ungültiger oder abgelaufener Link.")
	if assignment.get("feedback_received_at"):
		raise HTTPException(status_code=400, detail="Feedback wurde bereits übermittelt.")

	customer = repo.get_customer(assignment["customer_id"])
	data = {
		"appointment_id": assignment["id"],
		"customer_id": assignment["customer_id"],
		"rating": payload.rating,
		"comment": payload.comment,
		"submitted_by": payload.submitted_by,
		"source": "email_link",
	}
	feedback = _create_feedback_with_logic(data)
	repo.update_assignment(assignment["id"], {"feedback_received_at": datetime.utcnow()})
	return feedback


# Tickets
@router.get("/tickets", response_model=List[Ticket])
def list_tickets():
	return repo.list_tickets()


@router.post("/tickets", response_model=Ticket)
def create_ticket(payload: TicketCreate):
	return repo.create_ticket(payload.model_dump(exclude_none=True))


@router.put("/tickets/{id}", response_model=Ticket)
def update_ticket(id: str, payload: TicketUpdate):
	obj = repo.update_ticket(id, payload.model_dump(exclude_none=True))
	if not obj:
		raise HTTPException(status_code=404, detail="Ticket not found")
	return obj


# Photos
@router.post("/photos/upload", response_model=Photo)
async def upload_photo(
	file: UploadFile = File(...),
	customer_id: str = Form(...),
	appointment_id: Optional[str] = Form(None),
	employee_id: Optional[str] = Form(None),
	note: Optional[str] = Form(None),
	is_complaint: bool = Form(False),
):
	file_url = await save_upload_file(file)
	data = {
		"customer_id": customer_id,
		"appointment_id": appointment_id,
		"employee_id": employee_id,
		"file_url": file_url,
		"note": note,
		"is_complaint": is_complaint,
	}
	photo = repo.create_photo(data)
	if is_complaint:
		_create_photo_ticket(photo)
	return photo


@router.get("/photos/by-customer/{customer_id}", response_model=List[Photo])
def photos_by_customer(customer_id: str):
	return repo.list_photos_by_customer(customer_id)


@router.get("/photos/by-appointment/{appointment_id}", response_model=List[Photo])
def photos_by_appointment(appointment_id: str):
	return repo.list_photos_by_assignment(appointment_id)


@router.post("/photos/{photo_id}/share", response_model=PhotoShareResponse)
def share_photo(photo_id: str):
	token = str(uuid4())
	photo = repo.update_photo(photo_id, {"share_token": token})
	if not photo:
		raise HTTPException(status_code=404, detail="Photo not found")
	share_url = f"{settings.frontend_url or 'http://localhost:3000'}/share/photo/{token}"
	return {"share_token": token, "share_url": share_url}


@router.post("/photos/{photo_id}/mark-complaint", response_model=Photo)
def mark_photo_as_complaint(photo_id: str):
	photo = repo.update_photo(photo_id, {"is_complaint": True})
	if not photo:
		raise HTTPException(status_code=404, detail="Photo not found")
	_create_photo_ticket(photo)
	return photo


@router.get("/share/photo/{token}", response_model=Photo)
def public_photo_share(token: str):
	photo = repo.get_photo_by_token(token)
	if not photo:
		raise HTTPException(status_code=404, detail="Foto nicht gefunden oder Link ungültig.")
	return photo


# Helper
def _create_feedback_with_logic(data: dict) -> Feedback:
	feedback = repo.create_feedback(data)
	# Auto-ticket if rating low
	if feedback.get("rating", 5) < 3:
		customer = repo.get_customer(feedback["customer_id"])
		title = f"Reklamation zu Termin {feedback['appointment_id']}"
		desc = f"Kunde: {customer.get('name') if customer else feedback['customer_id']}\nBewertung: {feedback.get('rating')}\nKommentar: {feedback.get('comment')}"
		repo.create_ticket({
			"title": title,
			"description": desc,
			"customer_id": feedback.get("customer_id"),
			"assignment_id": feedback.get("appointment_id"),
			"feedback_id": feedback.get("id"),
			"type": "complaint",
			"status": "open",
			"priority": "high"
		})
	return feedback


def _create_photo_ticket(photo: dict):
	title = f"Reklamation (Foto) – Kunde {photo.get('customer_id')}"
	desc = f"Foto-ID: {photo.get('id')} wurde als Reklamation markiert.\nNotiz: {photo.get('note') or '-'}"
	repo.create_ticket({
		"type": "complaint_photo",
		"title": title,
		"description": desc,
		"customer_id": photo.get("customer_id"),
		"assignment_id": photo.get("appointment_id"),
		"status": "open",
		"priority": "high",
	})

# Calculation
@router.post("/pricing/calculate", response_model=CalculationResponse)
def calculate_price_endpoint(payload: CalculationRequest):
	return calculate_price(payload)


# Planning optimize placeholder
@router.post("/planning/optimize")
def optimize_route():
	# Placeholder response with dummy coordinates
	return {
		"route": {
			"distance_km": 12.3,
			"duration_minutes": 38,
			"waypoints": [
				{"lat": 48.137154, "lng": 11.576124},
				{"lat": 48.148, "lng": 11.56},
				{"lat": 48.155, "lng": 11.58},
			],
		},
		"note": "Dies ist ein Platzhalter. Optimierung folgt."
	}


@router.post("/planning/auto", response_model=PlanningAutoResponse)
def planning_auto(payload: PlanningAutoRequest):
	return auto_plan(payload)


@router.post("/assistant/query", response_model=AssistantQueryResponse)
async def assistant_query(payload: AssistantQueryRequest):
	# Use OpenRouter if configured; otherwise return a placeholder
	if openrouter_client.is_configured():
		res = await openrouter_client.complete(payload.prompt)
		reply = res.get("reply") or "Keine Antwort erhalten."
		return {"reply": reply, "usage": {"prompt_tokens": len(payload.prompt.split())}, "model": "openrouter/auto"}
	else:
		demo_reply = (
			"Hallo! Ich bin der HygiaAI‑Assistent. "
			"OpenRouter ist noch nicht konfiguriert, daher siehst du eine Beispiel‑Antwort."
		)
		return {
			"reply": demo_reply,
			"usage": {"prompt_tokens": len(payload.prompt.split()), "completion_tokens": len(demo_reply.split())},
			"model": "placeholder",
		}


# ===== Timer / Time Tracking Endpoints =====

from .services.timer import TimerService
from .models import TimeEntryModel
from sqlalchemy.orm import Session as SQLSession

def get_timer_service():
	"""Get a timer service instance with a fresh session"""
	from .db import repo
	return TimerService(repo.SessionLocal())


@router.get("/timer/current/{employee_id}")
def get_current_assignment(employee_id: str):
	"""Get the current or next assignment based on schedule"""
	service = get_timer_service()
	try:
		result = service.get_current_assignment(employee_id)
		if not result:
			return {"assignment": None, "customer": None, "is_current": False, "message": "Keine Einsätze für heute"}
		return result
	finally:
		service.session.close()


@router.get("/timer/today/{employee_id}")
def get_todays_assignments(employee_id: str):
	"""Get all of today's assignments for an employee"""
	service = get_timer_service()
	try:
		return service.get_todays_assignments(employee_id)
	finally:
		service.session.close()


@router.get("/timer/active/{employee_id}")
def get_active_timer(employee_id: str):
	"""Get the currently running timer for an employee"""
	service = get_timer_service()
	try:
		entry = service.get_active_entry(employee_id)
		return {"active_entry": entry}
	finally:
		service.session.close()


@router.post("/timer/start")
def start_timer(
	employee_id: str,
	customer_id: str,
	assignment_id: str,
	entry_type: str = "work"
):
	"""Start a new timer"""
	service = get_timer_service()
	try:
		entry = service.start_timer(employee_id, customer_id, assignment_id, entry_type)
		return {"success": True, "entry": entry}
	except ValueError as e:
		raise HTTPException(status_code=400, detail=str(e))
	finally:
		service.session.close()


@router.post("/timer/stop/{entry_id}")
def stop_timer(entry_id: str, notes: Optional[str] = None):
	"""Stop a running timer"""
	service = get_timer_service()
	try:
		entry = service.stop_timer(entry_id, notes)
		return {"success": True, "entry": entry}
	except ValueError as e:
		raise HTTPException(status_code=400, detail=str(e))
	finally:
		service.session.close()


@router.get("/timer/entries/{employee_id}")
def get_employee_entries_today(employee_id: str):
	"""Get all time entries for an employee today"""
	service = get_timer_service()
	try:
		return service.get_employee_entries_today(employee_id)
	finally:
		service.session.close()


@router.get("/timer/average/{customer_id}")
def get_customer_average_time(customer_id: str):
	"""Get average work time for a customer"""
	service = get_timer_service()
	try:
		return service.get_customer_average_time(customer_id)
	finally:
		service.session.close()


@router.get("/timer/break-settings/{employee_id}")
def get_break_settings(employee_id: str):
	"""Get break settings for an employee"""
	service = get_timer_service()
	try:
		return service.get_employee_break_settings(employee_id)
	except ValueError as e:
		raise HTTPException(status_code=404, detail=str(e))
	finally:
		service.session.close()
