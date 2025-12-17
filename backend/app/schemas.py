from __future__ import annotations
from typing import List, Optional, Dict, Union, Any
from pydantic import BaseModel, EmailStr, Field
from datetime import date, time, datetime

# --- Pricing Settings Schemas ---

class PvTier(BaseModel):
	min: int
	max: Optional[int]  # None means "infinity" / "ab X"
	price: float

class PvConfig(BaseModel):
	tiers: List[PvTier] = Field(default_factory=list)
	surcharge_difficult_percent: float = 0.0
	surcharge_dirty_fix: float = 0.0

class StairwellConfig(BaseModel):
	method: str = "units" # units, sqm, flat
	price_per_unit_weekly: float = 0.0
	price_per_unit_biweekly: float = 0.0
	price_per_unit_monthly: float = 0.0
	base_price_obj: float = 0.0
	price_sqm_upto: float = 0.0
	threshold_sqm: float = 100.0
	price_sqm_after: float = 0.0
	base_price_sqm: float = 0.0
	flat_price: float = 0.0
	cellar_price: float = 0.0
	window_price: float = 0.0

class GlassConfig(BaseModel):
	price_window_in: float = 0.0
	price_window_out: float = 0.0
	surcharge_height: float = 0.0
	surcharge_difficult_percent: float = 0.0
	price_sqm_in: float = 0.0
	price_sqm_out: float = 0.0
	surcharge_frame_percent: float = 0.0

class MaintenanceConfig(BaseModel):
	price_sqm: float = 0.0
	hourly_rate: float = 0.0
	extras: Dict[str, float] = Field(default_factory=dict)

class PricingSettingsBase(BaseModel):
	pv_config: PvConfig
	stairwell_config: StairwellConfig
	glass_config: GlassConfig
	maintenance_config: MaintenanceConfig

class PricingSettingsUpdate(PricingSettingsBase):
	pass

class PricingSettings(PricingSettingsBase):
	id: str
	class Config:
		from_attributes = True

class CityPricingBase(BaseModel):
	city_name: str
	travel_fee: float
	min_order_value: Optional[float] = None
	surcharge_percent: Optional[float] = None

class CityPricingCreate(CityPricingBase):
	id: Optional[str] = None

class CityPricingUpdate(BaseModel):
	city_name: Optional[str] = None
	travel_fee: Optional[float] = None
	min_order_value: Optional[float] = None
	surcharge_percent: Optional[float] = None

class CityPricing(CityPricingBase):
	id: str
	class Config:
		from_attributes = True


# --- Notification Settings Schemas ---

class ReminderTemplate(BaseModel):
	subject: str
	body: str

class NotificationConfig(BaseModel):
	enabled: bool = False
	hours_before: int = 24
	enable_email: bool = True
	enable_sms: bool = False
	# Keys: "hausverwaltung", "privat", etc.
	templates: Dict[str, ReminderTemplate] = Field(default_factory=dict)

class NotificationSettingsUpdate(NotificationConfig):
	pass

class NotificationSettings(NotificationConfig):
	id: str
	class Config:
		from_attributes = True


# --- Quality Settings Schemas ---

class QualitySettingsBase(BaseModel):
	enabled: bool = False
	trigger_mode: str = "all"
	allowed_service_types: List[str] = Field(default_factory=list)
	use_email: bool = True
	use_sms: bool = False
	email_subject: str = "Wie zufrieden sind Sie mit unserer Reinigung?"
	email_body: str = (
		"Hallo {{customerName}},\n"
		"wie zufrieden waren Sie mit unserem Einsatz am {{date}}? "
		"Bitte geben Sie uns Feedback: {{feedbackLink}}\n\nDanke!"
	)

class QualitySettingsUpdate(QualitySettingsBase):
	pass

class QualitySettings(QualitySettingsBase):
	id: str
	class Config:
		from_attributes = True


# --- Feedback / Tickets ---

class FeedbackBase(BaseModel):
	appointment_id: str
	customer_id: str
	object_id: Optional[str] = None
	rating: int = Field(..., ge=1, le=5)
	comment: Optional[str] = None
	submitted_by: Optional[str] = None
	source: Optional[str] = None

class FeedbackCreate(FeedbackBase):
	id: Optional[str] = None

class Feedback(FeedbackBase):
	id: str
	created_at: datetime
	class Config:
		from_attributes = True

class FeedbackSubmit(BaseModel):
	token: str
	rating: int = Field(..., ge=1, le=5)
	comment: Optional[str] = None
	submitted_by: Optional[str] = None

class TicketBase(BaseModel):
	type: str = "complaint"
	status: str = "open"
	priority: str = "normal"
	title: str
	description: Optional[str] = None
	customer_id: Optional[str] = None
	assignment_id: Optional[str] = None
	feedback_id: Optional[str] = None
	assigned_to_user_id: Optional[str] = None

class TicketCreate(TicketBase):
	id: Optional[str] = None

class TicketUpdate(BaseModel):
	type: Optional[str] = None
	status: Optional[str] = None
	priority: Optional[str] = None
	title: Optional[str] = None
	description: Optional[str] = None
	customer_id: Optional[str] = None
	assignment_id: Optional[str] = None
	feedback_id: Optional[str] = None
	assigned_to_user_id: Optional[str] = None

class Ticket(TicketBase):
	id: str
	created_at: datetime
	updated_at: datetime
	class Config:
		from_attributes = True


class PhotoBase(BaseModel):
	customer_id: str
	appointment_id: Optional[str] = None
	employee_id: Optional[str] = None
	file_url: str
	note: Optional[str] = None
	is_complaint: bool = False

class PhotoCreate(PhotoBase):
	id: Optional[str] = None

class Photo(PhotoBase):
	id: str
	share_token: Optional[str] = None
	created_at: datetime

	class Config:
		from_attributes = True

class PhotoShareResponse(BaseModel):
	share_token: str
	share_url: str


# --- Calculation Schemas ---

class CalculationRequest(BaseModel):
	service_category: str 
	city: Optional[str] = None
	is_existing_customer: bool = False

	pv_modules_count: Optional[int] = None
	is_difficult_access: bool = False
	is_very_dirty: bool = False

	units: Optional[int] = None
	floors: Optional[int] = None 
	frequency_per_month: Optional[float] = None 
	sqm: Optional[float] = None
	has_cellar: bool = False
	windows_count: Optional[int] = None

	calculation_method: Optional[str] = None
	glass_sqm_in: Optional[float] = None
	glass_sqm_out: Optional[float] = None
	glass_count_in: Optional[int] = None
	glass_count_out: Optional[int] = None
	glass_height_surcharge: bool = False
	glass_difficult_access: bool = False
	frame_cleaning: bool = False

	maintenance_sqm: Optional[float] = None
	hours_estimated: Optional[float] = None

class CalculationResponse(BaseModel):
	net_price: float
	travel_fee: float
	total_price: float
	details: Dict[str, Any]


# --- Existing Schemas ---

class PlanningAutoRequest(BaseModel):
	date: date
	employee_id: str
	city: Optional[str] = None
	service_type: Optional[str] = None

class PlanningAutoResponse(BaseModel):
	ordered_customers: List["Customer"]
	total_duration_minutes: int

class AssistantQueryRequest(BaseModel):
	prompt: str = Field(..., min_length=1, max_length=4000)

class AssistantQueryResponse(BaseModel):
	reply: str
	usage: Optional[dict] = None
	model: Optional[str] = None

class CustomerBase(BaseModel):
	name: str
	address: Optional[str] = None
	city: Optional[str] = None
	phone: Optional[str] = None
	email: Optional[EmailStr] = None
	notes: Optional[str] = None
	service_tags: List[str] = Field(default_factory=list)
	duration_minutes: Optional[int] = None
	frequency: Optional[str] = None
	lat: Optional[float] = None
	lng: Optional[float] = None
	is_active: bool = True
	is_existing_customer: bool = False
	
	# Reminder
	customer_type: str = "privat"
	wants_reminders: bool = True
	preferred_channel: str = "email"


class CustomerCreate(CustomerBase):
	id: Optional[str] = None

class CustomerUpdate(BaseModel):
	name: Optional[str] = None
	address: Optional[str] = None
	city: Optional[str] = None
	phone: Optional[str] = None
	email: Optional[EmailStr] = None
	notes: Optional[str] = None
	service_tags: Optional[List[str]] = None
	duration_minutes: Optional[int] = None
	frequency: Optional[str] = None
	lat: Optional[float] = None
	lng: Optional[float] = None
	is_active: Optional[bool] = None
	is_existing_customer: Optional[bool] = None
	
	customer_type: Optional[str] = None
	wants_reminders: Optional[bool] = None
	preferred_channel: Optional[str] = None


class Customer(CustomerBase):
	id: str
	class Config:
		from_attributes = True

class EmployeeBase(BaseModel):
	name: str
	phone: Optional[str] = None
	email: Optional[EmailStr] = None
	notes: Optional[str] = None
	is_active: bool = True
	break_duration_minutes: int = 30  # Pausendauer in Minuten
	daily_break_count: int = 1  # Anzahl Pausen pro Tag

class EmployeeCreate(EmployeeBase):
	id: Optional[str] = None

class EmployeeUpdate(BaseModel):
	name: Optional[str] = None
	phone: Optional[str] = None
	email: Optional[EmailStr] = None
	notes: Optional[str] = None
	is_active: Optional[bool] = None
	break_duration_minutes: Optional[int] = None
	daily_break_count: Optional[int] = None

class Employee(EmployeeBase):
	id: str
	class Config:
		from_attributes = True

class AssignmentBase(BaseModel):
	date: date
	start_time: Optional[time] = None
	employee_id: str
	customer_id: str
	service_type: Optional[str] = None
	status: Optional[str] = None
	notes: Optional[str] = None
	no_reminder: bool = False
	no_feedback: bool = False

class AssignmentCreate(AssignmentBase):
	id: Optional[str] = None

class AssignmentUpdate(BaseModel):
	date: Optional[date] = None
	start_time: Optional[time] = None
	employee_id: Optional[str] = None
	customer_id: Optional[str] = None
	service_type: Optional[str] = None
	status: Optional[str] = None
	notes: Optional[str] = None
	no_reminder: Optional[bool] = None
	reminder_sent_at: Optional[datetime] = None
	no_feedback: Optional[bool] = None
	feedback_requested_at: Optional[datetime] = None
	feedback_received_at: Optional[datetime] = None
	feedback_token: Optional[str] = None

class Assignment(AssignmentBase):
	id: str
	reminder_sent_at: Optional[datetime] = None
	feedback_requested_at: Optional[datetime] = None
	feedback_received_at: Optional[datetime] = None
	feedback_token: Optional[str] = None

	class Config:
		from_attributes = True

class ServiceTypeBase(BaseModel):
	key: str
	label: str
	color: Optional[str] = None

class ServiceTypeCreate(ServiceTypeBase):
	id: Optional[str] = None

class ServiceTypeUpdate(BaseModel):
	key: Optional[str] = None
	label: Optional[str] = None
	color: Optional[str] = None

class ServiceType(BaseModel):
	id: str
	key: str
	label: str
	color: Optional[str] = None
	class Config:
		from_attributes = True


# --- Time Tracking Schemas ---

class TimeEntryCreate(BaseModel):
	assignment_id: str
	employee_id: str
	customer_id: str
	entry_type: str = "work"  # "work" or "travel"
	started_at: datetime
	ended_at: Optional[datetime] = None
	duration_minutes: Optional[int] = None
	notes: Optional[str] = None

class TimeEntryUpdate(BaseModel):
	ended_at: Optional[datetime] = None
	duration_minutes: Optional[int] = None
	notes: Optional[str] = None

class TimeEntry(BaseModel):
	id: str
	assignment_id: str
	employee_id: str
	customer_id: str
	entry_type: str
	started_at: datetime
	ended_at: Optional[datetime] = None
	duration_minutes: Optional[int] = None
	notes: Optional[str] = None
	created_at: datetime
	
	class Config:
		from_attributes = True

class CurrentAssignmentResponse(BaseModel):
	assignment: Optional[Assignment] = None
	customer: Optional[Customer] = None
	is_current: bool = False
	message: str = ""

class CustomerAverageTime(BaseModel):
	customer_id: str
	customer_name: str
	avg_duration_minutes: float
	total_entries: int
	planned_duration_minutes: Optional[int] = None

class StartTimerRequest(BaseModel):
	employee_id: str
	customer_id: Optional[str] = None  # If None, auto-detect from schedule
	entry_type: str = "work"  # "work" or "travel"

class StopTimerRequest(BaseModel):
	time_entry_id: str
	notes: Optional[str] = None
