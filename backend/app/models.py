from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Text, Integer, Boolean, Float, Date, Time, DateTime, JSON, ForeignKey, UniqueConstraint
from typing import List, Optional
from datetime import datetime


class Base(DeclarativeBase):
	pass


class CustomerModel(Base):
	__tablename__ = "customers"

	id: Mapped[str] = mapped_column(String, primary_key=True)
	name: Mapped[str] = mapped_column(String, nullable=False)
	address: Mapped[Optional[str]] = mapped_column(String, nullable=True)
	city: Mapped[Optional[str]] = mapped_column(String, nullable=True)
	phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
	email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
	notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
	service_tags: Mapped[List[str]] = mapped_column(JSON, default=list)
	duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
	frequency: Mapped[Optional[str]] = mapped_column(String, nullable=True)
	lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
	lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
	is_active: Mapped[bool] = mapped_column(Boolean, default=True)
	is_existing_customer: Mapped[bool] = mapped_column(Boolean, default=False)

	# Reminder fields
	customer_type: Mapped[str] = mapped_column(String, default="privat")
	wants_reminders: Mapped[bool] = mapped_column(Boolean, default=True)
	preferred_channel: Mapped[str] = mapped_column(String, default="email") # email, sms, both

	assignments: Mapped[List["AssignmentModel"]] = relationship(back_populates="customer", cascade="all,delete")


class EmployeeModel(Base):
	__tablename__ = "employees"

	id: Mapped[str] = mapped_column(String, primary_key=True)
	name: Mapped[str] = mapped_column(String, nullable=False)
	phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
	email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
	notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
	is_active: Mapped[bool] = mapped_column(Boolean, default=True)
	
	# Pausenzeit-Einstellungen (in Minuten)
	break_duration_minutes: Mapped[int] = mapped_column(Integer, default=30)
	daily_break_count: Mapped[int] = mapped_column(Integer, default=1)

	assignments: Mapped[List["AssignmentModel"]] = relationship(back_populates="employee", cascade="all,delete")


class ServiceTypeModel(Base):
	__tablename__ = "service_types"
	__table_args__ = (UniqueConstraint("key", name="uq_service_types_key"),)

	id: Mapped[str] = mapped_column(String, primary_key=True)
	key: Mapped[str] = mapped_column(String, nullable=False)
	label: Mapped[str] = mapped_column(String, nullable=False)
	color: Mapped[Optional[str]] = mapped_column(String, nullable=True)


class AssignmentModel(Base):
	__tablename__ = "assignments"

	id: Mapped[str] = mapped_column(String, primary_key=True)
	date: Mapped[Date] = mapped_column(Date, nullable=False)
	start_time: Mapped[Optional[Time]] = mapped_column(Time, nullable=True)
	employee_id: Mapped[str] = mapped_column(String, ForeignKey("employees.id", ondelete="CASCADE"))
	customer_id: Mapped[str] = mapped_column(String, ForeignKey("customers.id", ondelete="CASCADE"))
	service_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
	status: Mapped[Optional[str]] = mapped_column(String, nullable=True)
	notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
	
	# Reminder tracking
	reminder_sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
	no_reminder: Mapped[bool] = mapped_column(Boolean, default=False)
	feedback_requested_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
	feedback_received_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
	feedback_token: Mapped[Optional[str]] = mapped_column(String, nullable=True, unique=True)

	employee: Mapped["EmployeeModel"] = relationship(back_populates="assignments")
	customer: Mapped["CustomerModel"] = relationship(back_populates="assignments")


class PricingSettingsModel(Base):
	__tablename__ = "pricing_settings"

	id: Mapped[str] = mapped_column(String, primary_key=True)
	# JSON columns for flexible configuration
	pv_config: Mapped[dict] = mapped_column(JSON, default=dict)
	stairwell_config: Mapped[dict] = mapped_column(JSON, default=dict)
	glass_config: Mapped[dict] = mapped_column(JSON, default=dict)
	maintenance_config: Mapped[dict] = mapped_column(JSON, default=dict)


class CityPricingModel(Base):
	__tablename__ = "city_pricing"

	id: Mapped[str] = mapped_column(String, primary_key=True)
	city_name: Mapped[str] = mapped_column(String, nullable=False)
	travel_fee: Mapped[float] = mapped_column(Float, default=0.0)
	min_order_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
	surcharge_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)


class NotificationSettingsModel(Base):
	__tablename__ = "notification_settings"

	id: Mapped[str] = mapped_column(String, primary_key=True) # usually 'default'
	enabled: Mapped[bool] = mapped_column(Boolean, default=False)
	hours_before: Mapped[int] = mapped_column(Integer, default=24)
	enable_email: Mapped[bool] = mapped_column(Boolean, default=True)
	enable_sms: Mapped[bool] = mapped_column(Boolean, default=False)
	
	# Templates dict: { "hausverwaltung": { "subject": "...", "body": "..." }, "privat": ... }
	templates: Mapped[dict] = mapped_column(JSON, default=dict)


class QualitySettingsModel(Base):
	__tablename__ = "quality_settings"

	id: Mapped[str] = mapped_column(String, primary_key=True)  # 'default'
	enabled: Mapped[bool] = mapped_column(Boolean, default=False)
	trigger_mode: Mapped[str] = mapped_column(String, default="all")  # all, service_type
	allowed_service_types: Mapped[List[str]] = mapped_column(JSON, default=list)
	use_email: Mapped[bool] = mapped_column(Boolean, default=True)
	use_sms: Mapped[bool] = mapped_column(Boolean, default=False)
	email_subject: Mapped[str] = mapped_column(String, default="Wie zufrieden sind Sie mit unserer Reinigung?")
	email_body: Mapped[str] = mapped_column(Text, default="Hallo {{customerName}},\\n\\nwie zufrieden waren Sie mit unserem Einsatz am {{date}}? Bitte geben Sie uns Feedback: {{feedbackLink}}\\n\\nDanke!")


class FeedbackModel(Base):
	__tablename__ = "feedback"

	id: Mapped[str] = mapped_column(String, primary_key=True)
	appointment_id: Mapped[str] = mapped_column(String, ForeignKey("assignments.id", ondelete="CASCADE"))
	customer_id: Mapped[str] = mapped_column(String, ForeignKey("customers.id", ondelete="CASCADE"))
	object_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
	rating: Mapped[int] = mapped_column(Integer, nullable=False)
	comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
	submitted_by: Mapped[Optional[str]] = mapped_column(String, nullable=True)
	source: Mapped[Optional[str]] = mapped_column(String, nullable=True)
	created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

	appointment: Mapped["AssignmentModel"] = relationship()
	customer: Mapped["CustomerModel"] = relationship()


class TicketModel(Base):
	__tablename__ = "tickets"

	id: Mapped[str] = mapped_column(String, primary_key=True)
	type: Mapped[str] = mapped_column(String, default="complaint")
	status: Mapped[str] = mapped_column(String, default="open")
	priority: Mapped[str] = mapped_column(String, default="normal")
	title: Mapped[str] = mapped_column(String, nullable=False)
	description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
	customer_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("customers.id", ondelete="SET NULL"))
	assignment_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("assignments.id", ondelete="SET NULL"))
	feedback_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("feedback.id", ondelete="SET NULL"))
	assigned_to_user_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
	created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
	updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PhotoModel(Base):
	__tablename__ = "photos"

	id: Mapped[str] = mapped_column(String, primary_key=True)
	customer_id: Mapped[str] = mapped_column(String, ForeignKey("customers.id", ondelete="CASCADE"))
	appointment_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("assignments.id", ondelete="SET NULL"))
	employee_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("employees.id", ondelete="SET NULL"))
	file_url: Mapped[str] = mapped_column(String, nullable=False)
	note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
	is_complaint: Mapped[bool] = mapped_column(Boolean, default=False)
	share_token: Mapped[Optional[str]] = mapped_column(String, nullable=True, unique=True)
	created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

	customer: Mapped["CustomerModel"] = relationship()
	appointment: Mapped[Optional["AssignmentModel"]] = relationship()
	employee: Mapped[Optional["EmployeeModel"]] = relationship()


class TimeEntryModel(Base):
	"""Tracks actual time spent on assignments (work time and travel time)"""
	__tablename__ = "time_entries"

	id: Mapped[str] = mapped_column(String, primary_key=True)
	assignment_id: Mapped[str] = mapped_column(String, ForeignKey("assignments.id", ondelete="CASCADE"))
	employee_id: Mapped[str] = mapped_column(String, ForeignKey("employees.id", ondelete="CASCADE"))
	customer_id: Mapped[str] = mapped_column(String, ForeignKey("customers.id", ondelete="CASCADE"))
	entry_type: Mapped[str] = mapped_column(String, default="work")  # "work" or "travel"
	started_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
	ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
	duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
	notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
	created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

	assignment: Mapped["AssignmentModel"] = relationship()
	employee: Mapped["EmployeeModel"] = relationship()
	customer: Mapped["CustomerModel"] = relationship()

