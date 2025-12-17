from __future__ import annotations
from typing import Optional, List, Dict, Any
from uuid import uuid4
from contextlib import contextmanager
from datetime import date, time

from sqlalchemy import create_engine, select, update as sa_update, delete as sa_delete
from sqlalchemy.orm import sessionmaker, Session

from supabase import create_client, Client as SupabaseClient

from .config import settings
from .models import (
	Base,
	CustomerModel,
	EmployeeModel,
	AssignmentModel,
	ServiceTypeModel,
	PricingSettingsModel,
	CityPricingModel,
	NotificationSettingsModel,
	QualitySettingsModel,
	FeedbackModel,
	TicketModel,
	PhotoModel,
	TimeEntryModel,
)


def generate_id() -> str:
	return str(uuid4())


# Repository interface
class Repository:
	# Customers
	def list_customers(self) -> List[Dict[str, Any]]: ...
	def get_customer(self, id_: str) -> Optional[Dict[str, Any]]: ...
	def create_customer(self, data: Dict[str, Any]) -> Dict[str, Any]: ...
	def update_customer(self, id_: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]: ...
	def delete_customer(self, id_: str) -> bool: ...

	# Employees
	def list_employees(self) -> List[Dict[str, Any]]: ...
	def get_employee(self, id_: str) -> Optional[Dict[str, Any]]: ...
	def create_employee(self, data: Dict[str, Any]) -> Dict[str, Any]: ...
	def update_employee(self, id_: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]: ...
	def delete_employee(self, id_: str) -> bool: ...

	# Assignments
	def list_assignments(self) -> List[Dict[str, Any]]: ...
	def get_assignment(self, id_: str) -> Optional[Dict[str, Any]]: ...
	def create_assignment(self, data: Dict[str, Any]) -> Dict[str, Any]: ...
	def update_assignment(self, id_: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]: ...
	def delete_assignment(self, id_: str) -> bool: ...
	def get_assignment_by_token(self, token: str) -> Optional[Dict[str, Any]]: ...

	# Service Types
	def list_service_types(self) -> List[Dict[str, Any]]: ...
	def get_service_type(self, id_: str) -> Optional[Dict[str, Any]]: ...
	def create_service_type(self, data: Dict[str, Any]) -> Dict[str, Any]: ...
	def update_service_type(self, id_: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]: ...
	def delete_service_type(self, id_: str) -> bool: ...

	# Pricing Settings (Singleton-ish)
	def get_pricing_settings(self) -> Dict[str, Any]: ...
	def update_pricing_settings(self, data: Dict[str, Any]) -> Dict[str, Any]: ...

	# Notification Settings (Singleton-ish)
	def get_notification_settings(self) -> Dict[str, Any]: ...
	def update_notification_settings(self, data: Dict[str, Any]) -> Dict[str, Any]: ...

	# Quality Settings
	def get_quality_settings(self) -> Dict[str, Any]: ...
	def update_quality_settings(self, data: Dict[str, Any]) -> Dict[str, Any]: ...

	# Feedback
	def list_feedback(self) -> List[Dict[str, Any]]: ...
	def get_feedback(self, id_: str) -> Optional[Dict[str, Any]]: ...
	def create_feedback(self, data: Dict[str, Any]) -> Dict[str, Any]: ...

	# Tickets
	def list_tickets(self) -> List[Dict[str, Any]]: ...
	def get_ticket(self, id_: str) -> Optional[Dict[str, Any]]: ...
	def create_ticket(self, data: Dict[str, Any]) -> Dict[str, Any]: ...
	def update_ticket(self, id_: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]: ...

	# Photos
	def list_photos_by_customer(self, customer_id: str) -> List[Dict[str, Any]]: ...
	def list_photos_by_assignment(self, appointment_id: str) -> List[Dict[str, Any]]: ...
	def create_photo(self, data: Dict[str, Any]) -> Dict[str, Any]: ...
	def update_photo(self, id_: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]: ...
	def get_photo_by_token(self, token: str) -> Optional[Dict[str, Any]]: ...
	# City Pricing
	def list_city_pricing(self) -> List[Dict[str, Any]]: ...
	def get_city_pricing(self, id_: str) -> Optional[Dict[str, Any]]: ...
	def create_city_pricing(self, data: Dict[str, Any]) -> Dict[str, Any]: ...
	def update_city_pricing(self, id_: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]: ...
	def delete_city_pricing(self, id_: str) -> bool: ...


# SQLite / SQLAlchemy implementation
class SqlAlchemyRepository(Repository):
	def __init__(self, db_url: str = "sqlite:///data/hygiaai.db"):
		self.engine = create_engine(db_url, connect_args={"check_same_thread": False})
		self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
		Base.metadata.create_all(self.engine)

	@contextmanager
	def session_scope(self) -> Session:
		session = self.SessionLocal()
		try:
			yield session
			session.commit()
		except Exception:
			session.rollback()
			raise
		finally:
			session.close()

	# helper
	def _row_to_dict(self, row) -> Dict[str, Any]:
		return {c.name: getattr(row, c.name) for c in row.__table__.columns}

	# Customers
	def list_customers(self) -> List[Dict[str, Any]]:
		with self.session_scope() as s:
			rows = s.scalars(select(CustomerModel)).all()
			return [self._row_to_dict(r) for r in rows]

	def get_customer(self, id_: str) -> Optional[Dict[str, Any]]:
		with self.session_scope() as s:
			row = s.get(CustomerModel, id_)
			return self._row_to_dict(row) if row else None

	def create_customer(self, data: Dict[str, Any]) -> Dict[str, Any]:
		if not data.get("id"):
			data["id"] = generate_id()
		with self.session_scope() as s:
			obj = CustomerModel(**data)
			s.add(obj)
			s.flush()
			return self._row_to_dict(obj)

	def update_customer(self, id_: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
		with self.session_scope() as s:
			obj = s.get(CustomerModel, id_)
			if not obj:
				return None
			for k, v in data.items():
				if v is not None:
					setattr(obj, k, v)
			s.flush()
			return self._row_to_dict(obj)

	def delete_customer(self, id_: str) -> bool:
		with self.session_scope() as s:
			obj = s.get(CustomerModel, id_)
			if not obj:
				return False
			s.delete(obj)
			return True

	# Employees
	def list_employees(self) -> List[Dict[str, Any]]:
		with self.session_scope() as s:
			rows = s.scalars(select(EmployeeModel)).all()
			return [self._row_to_dict(r) for r in rows]

	def get_employee(self, id_: str) -> Optional[Dict[str, Any]]:
		with self.session_scope() as s:
			row = s.get(EmployeeModel, id_)
			return self._row_to_dict(row) if row else None

	def create_employee(self, data: Dict[str, Any]) -> Dict[str, Any]:
		if not data.get("id"):
			data["id"] = generate_id()
		with self.session_scope() as s:
			obj = EmployeeModel(**data)
			s.add(obj)
			s.flush()
			return self._row_to_dict(obj)

	def update_employee(self, id_: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
		with self.session_scope() as s:
			obj = s.get(EmployeeModel, id_)
			if not obj:
				return None
			for k, v in data.items():
				if v is not None:
					setattr(obj, k, v)
			s.flush()
			return self._row_to_dict(obj)

	def delete_employee(self, id_: str) -> bool:
		with self.session_scope() as s:
			obj = s.get(EmployeeModel, id_)
			if not obj:
				return False
			s.delete(obj)
			return True

	# Assignments
	def list_assignments(self) -> List[Dict[str, Any]]:
		with self.session_scope() as s:
			rows = s.scalars(select(AssignmentModel)).all()
			return [self._row_to_dict(r) for r in rows]

	def get_assignment(self, id_: str) -> Optional[Dict[str, Any]]:
		with self.session_scope() as s:
			row = s.get(AssignmentModel, id_)
			return self._row_to_dict(row) if row else None

	def create_assignment(self, data: Dict[str, Any]) -> Dict[str, Any]:
		if not data.get("id"):
			data["id"] = generate_id()
		with self.session_scope() as s:
			obj = AssignmentModel(**data)
			s.add(obj)
			s.flush()
			return self._row_to_dict(obj)

	def update_assignment(self, id_: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
		with self.session_scope() as s:
			obj = s.get(AssignmentModel, id_)
			if not obj:
				return None
			for k, v in data.items():
				if v is not None:
					setattr(obj, k, v)
			s.flush()
			return self._row_to_dict(obj)

	def delete_assignment(self, id_: str) -> bool:
		with self.session_scope() as s:
			obj = s.get(AssignmentModel, id_)
			if not obj:
				return False
			s.delete(obj)
			return True
	def get_assignment_by_token(self, token: str) -> Optional[Dict[str, Any]]:
		with self.session_scope() as s:
			row = s.scalars(select(AssignmentModel).where(AssignmentModel.feedback_token == token)).first()
			return self._row_to_dict(row) if row else None

	# Service Types
	def list_service_types(self) -> List[Dict[str, Any]]:
		with self.session_scope() as s:
			rows = s.scalars(select(ServiceTypeModel)).all()
			return [self._row_to_dict(r) for r in rows]

	def get_service_type(self, id_: str) -> Optional[Dict[str, Any]]:
		with self.session_scope() as s:
			row = s.get(ServiceTypeModel, id_)
			return self._row_to_dict(row) if row else None

	def create_service_type(self, data: Dict[str, Any]) -> Dict[str, Any]:
		if not data.get("id"):
			data["id"] = generate_id()
		with self.session_scope() as s:
			obj = ServiceTypeModel(**data)
			s.add(obj)
			s.flush()
			return self._row_to_dict(obj)

	def update_service_type(self, id_: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
		with self.session_scope() as s:
			obj = s.get(ServiceTypeModel, id_)
			if not obj:
				return None
			for k, v in data.items():
				if v is not None:
					setattr(obj, k, v)
			s.flush()
			return self._row_to_dict(obj)

	def delete_service_type(self, id_: str) -> bool:
		with self.session_scope() as s:
			obj = s.get(ServiceTypeModel, id_)
			if not obj:
				return False
			s.delete(obj)
			return True

	# Pricing Settings
	def get_pricing_settings(self) -> Dict[str, Any]:
		with self.session_scope() as s:
			# Assuming single row for now (ID="default")
			obj = s.get(PricingSettingsModel, "default")
			if not obj:
				# Create default if not exists
				obj = PricingSettingsModel(id="default", pv_config={}, stairwell_config={}, glass_config={}, maintenance_config={})
				s.add(obj)
				s.flush()
			return self._row_to_dict(obj)

	def update_pricing_settings(self, data: Dict[str, Any]) -> Dict[str, Any]:
		with self.session_scope() as s:
			obj = s.get(PricingSettingsModel, "default")
			if not obj:
				obj = PricingSettingsModel(id="default", **data)
				s.add(obj)
			else:
				for k, v in data.items():
					if v is not None:
						setattr(obj, k, v)
			s.flush()
			return self._row_to_dict(obj)

	# Notification Settings
	def get_notification_settings(self) -> Dict[str, Any]:
		with self.session_scope() as s:
			obj = s.get(NotificationSettingsModel, "default")
			if not obj:
				obj = NotificationSettingsModel(id="default", enabled=False, hours_before=24, templates={})
				s.add(obj)
				s.flush()
			return self._row_to_dict(obj)

	def update_notification_settings(self, data: Dict[str, Any]) -> Dict[str, Any]:
		with self.session_scope() as s:
			obj = s.get(NotificationSettingsModel, "default")
			if not obj:
				obj = NotificationSettingsModel(id="default", **data)
				s.add(obj)
			else:
				for k, v in data.items():
					if v is not None:
						setattr(obj, k, v)
			s.flush()
			return self._row_to_dict(obj)

	# Quality Settings
	def get_quality_settings(self) -> Dict[str, Any]:
		with self.session_scope() as s:
			obj = s.get(QualitySettingsModel, "default")
			if not obj:
				obj = QualitySettingsModel(id="default")
				s.add(obj)
				s.flush()
			return self._row_to_dict(obj)

	def update_quality_settings(self, data: Dict[str, Any]) -> Dict[str, Any]:
		with self.session_scope() as s:
			obj = s.get(QualitySettingsModel, "default")
			if not obj:
				obj = QualitySettingsModel(id="default", **data)
				s.add(obj)
			else:
				for k, v in data.items():
					if v is not None:
						setattr(obj, k, v)
			s.flush()
			return self._row_to_dict(obj)

	# Feedback
	def list_feedback(self) -> List[Dict[str, Any]]:
		with self.session_scope() as s:
			rows = s.scalars(select(FeedbackModel)).all()
			return [self._row_to_dict(r) for r in rows]

	def get_feedback(self, id_: str) -> Optional[Dict[str, Any]]:
		with self.session_scope() as s:
			row = s.get(FeedbackModel, id_)
			return self._row_to_dict(row) if row else None

	def create_feedback(self, data: Dict[str, Any]) -> Dict[str, Any]:
		if not data.get("id"):
			data["id"] = generate_id()
		with self.session_scope() as s:
			obj = FeedbackModel(**data)
			s.add(obj)
			s.flush()
			return self._row_to_dict(obj)

	# Tickets
	def list_tickets(self) -> List[Dict[str, Any]]:
		with self.session_scope() as s:
			rows = s.scalars(select(TicketModel)).all()
			return [self._row_to_dict(r) for r in rows]

	def get_ticket(self, id_: str) -> Optional[Dict[str, Any]]:
		with self.session_scope() as s:
			row = s.get(TicketModel, id_)
			return self._row_to_dict(row) if row else None

	def create_ticket(self, data: Dict[str, Any]) -> Dict[str, Any]:
		if not data.get("id"):
			data["id"] = generate_id()
		with self.session_scope() as s:
			obj = TicketModel(**data)
			s.add(obj)
			s.flush()
			return self._row_to_dict(obj)

	def update_ticket(self, id_: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
		with self.session_scope() as s:
			obj = s.get(TicketModel, id_)
			if not obj:
				return None
			for k, v in data.items():
				if v is not None:
					setattr(obj, k, v)
			s.flush()
			return self._row_to_dict(obj)

	# Photos
	def list_photos_by_customer(self, customer_id: str) -> List[Dict[str, Any]]:
		with self.session_scope() as s:
			rows = s.scalars(select(PhotoModel).where(PhotoModel.customer_id == customer_id).order_by(PhotoModel.created_at.desc())).all()
			return [self._row_to_dict(r) for r in rows]

	def list_photos_by_assignment(self, appointment_id: str) -> List[Dict[str, Any]]:
		with self.session_scope() as s:
			rows = s.scalars(select(PhotoModel).where(PhotoModel.appointment_id == appointment_id).order_by(PhotoModel.created_at.desc())).all()
			return [self._row_to_dict(r) for r in rows]

	def create_photo(self, data: Dict[str, Any]) -> Dict[str, Any]:
		if not data.get("id"):
			data["id"] = generate_id()
		with self.session_scope() as s:
			obj = PhotoModel(**data)
			s.add(obj)
			s.flush()
			return self._row_to_dict(obj)

	def update_photo(self, id_: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
		with self.session_scope() as s:
			obj = s.get(PhotoModel, id_)
			if not obj:
				return None
			for k, v in data.items():
				if v is not None:
					setattr(obj, k, v)
			s.flush()
			return self._row_to_dict(obj)

	def get_photo_by_token(self, token: str) -> Optional[Dict[str, Any]]:
		with self.session_scope() as s:
			row = s.scalars(select(PhotoModel).where(PhotoModel.share_token == token)).first()
			return self._row_to_dict(row) if row else None

	# City Pricing
	def list_city_pricing(self) -> List[Dict[str, Any]]:
		with self.session_scope() as s:
			rows = s.scalars(select(CityPricingModel)).all()
			return [self._row_to_dict(r) for r in rows]

	def get_city_pricing(self, id_: str) -> Optional[Dict[str, Any]]:
		with self.session_scope() as s:
			row = s.get(CityPricingModel, id_)
			return self._row_to_dict(row) if row else None

	def create_city_pricing(self, data: Dict[str, Any]) -> Dict[str, Any]:
		if not data.get("id"):
			data["id"] = generate_id()
		with self.session_scope() as s:
			obj = CityPricingModel(**data)
			s.add(obj)
			s.flush()
			return self._row_to_dict(obj)

	def update_city_pricing(self, id_: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
		with self.session_scope() as s:
			obj = s.get(CityPricingModel, id_)
			if not obj:
				return None
			for k, v in data.items():
				if v is not None:
					setattr(obj, k, v)
			s.flush()
			return self._row_to_dict(obj)

	def delete_city_pricing(self, id_: str) -> bool:
		with self.session_scope() as s:
			obj = s.get(CityPricingModel, id_)
			if not obj:
				return False
			s.delete(obj)
			return True


# Supabase implementation
class SupabaseRepository(Repository):
	def __init__(self, client: SupabaseClient):
		self.client = client

	# Generic helpers
	def _insert(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
		if not data.get("id"):
			data["id"] = generate_id()
		res = self.client.table(table).insert(data).execute()
		return res.data[0]

	def _select_one(self, table: str, id_: str) -> Optional[Dict[str, Any]]:
		res = self.client.table(table).select("*").eq("id", id_).limit(1).execute()
		if res.data:
			return res.data[0]
		return None

	def _select_all(self, table: str) -> List[Dict[str, Any]]:
		res = self.client.table(table).select("*").execute()
		return list(res.data or [])

	def _update(self, table: str, id_: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
		res = self.client.table(table).update(data).eq("id", id_).execute()
		if res.data:
			return res.data[0]
		return None

	def _delete(self, table: str, id_: str) -> bool:
		res = self.client.table(table).delete().eq("id", id_).execute()
		return bool(res.data is not None)

	# Customers
	def list_customers(self) -> List[Dict[str, Any]]:
		return self._select_all("customers")

	def get_customer(self, id_: str) -> Optional[Dict[str, Any]]:
		return self._select_one("customers", id_)

	def create_customer(self, data: Dict[str, Any]) -> Dict[str, Any]:
		return self._insert("customers", data)

	def update_customer(self, id_: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
		return self._update("customers", id_, data)

	def delete_customer(self, id_: str) -> bool:
		return self._delete("customers", id_)

	# Employees
	def list_employees(self) -> List[Dict[str, Any]]:
		return self._select_all("employees")

	def get_employee(self, id_: str) -> Optional[Dict[str, Any]]:
		return self._select_one("employees", id_)

	def create_employee(self, data: Dict[str, Any]) -> Dict[str, Any]:
		return self._insert("employees", data)

	def update_employee(self, id_: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
		return self._update("employees", id_, data)

	def delete_employee(self, id_: str) -> bool:
		return self._delete("employees", id_)

	# Assignments
	def list_assignments(self) -> List[Dict[str, Any]]:
		return self._select_all("assignments")

	def get_assignment(self, id_: str) -> Optional[Dict[str, Any]]:
		return self._select_one("assignments", id_)

	def create_assignment(self, data: Dict[str, Any]) -> Dict[str, Any]:
		return self._insert("assignments", data)

	def update_assignment(self, id_: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
		return self._update("assignments", id_, data)

	def delete_assignment(self, id_: str) -> bool:
		return self._delete("assignments", id_)
	def get_assignment_by_token(self, token: str) -> Optional[Dict[str, Any]]:
		res = self.client.table("assignments").select("*").eq("feedback_token", token).limit(1).execute()
		if res.data:
			return res.data[0]
		return None

	# Service Types
	def list_service_types(self) -> List[Dict[str, Any]]:
		return self._select_all("service_types")

	def get_service_type(self, id_: str) -> Optional[Dict[str, Any]]:
		return self._select_one("service_types", id_)

	def create_service_type(self, data: Dict[str, Any]) -> Dict[str, Any]:
		return self._insert("service_types", data)

	def update_service_type(self, id_: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
		return self._update("service_types", id_, data)

	def delete_service_type(self, id_: str) -> bool:
		return self._delete("service_types", id_)

	# Pricing Settings
	def get_pricing_settings(self) -> Dict[str, Any]:
		# Try to get default
		res = self.client.table("pricing_settings").select("*").eq("id", "default").limit(1).execute()
		if res.data:
			return res.data[0]
		# If not exists, create default
		default_data = {"id": "default", "pv_config": {}, "stairwell_config": {}, "glass_config": {}, "maintenance_config": {}}
		return self._insert("pricing_settings", default_data)

	def update_pricing_settings(self, data: Dict[str, Any]) -> Dict[str, Any]:
		return self._update("pricing_settings", "default", data) or {}

	# Notification Settings
	def get_notification_settings(self) -> Dict[str, Any]:
		res = self.client.table("notification_settings").select("*").eq("id", "default").limit(1).execute()
		if res.data:
			return res.data[0]
		default_data = {"id": "default", "enabled": False, "hours_before": 24, "templates": {}}
		return self._insert("notification_settings", default_data)

	def update_notification_settings(self, data: Dict[str, Any]) -> Dict[str, Any]:
		return self._update("notification_settings", "default", data) or {}

	# Quality Settings
	def get_quality_settings(self) -> Dict[str, Any]:
		res = self.client.table("quality_settings").select("*").eq("id", "default").limit(1).execute()
		if res.data:
			return res.data[0]
		default_data = {"id": "default", "enabled": False, "trigger_mode": "all", "allowed_service_types": [], "use_email": True, "use_sms": False,
			"email_subject": "Wie zufrieden sind Sie mit unserer Reinigung?",
			"email_body": "Hallo {{customerName}},\\nwie zufrieden waren Sie mit unserem Einsatz am {{date}}? Bitte geben Sie uns Feedback: {{feedbackLink}}"}
		return self._insert("quality_settings", default_data)

	def update_quality_settings(self, data: Dict[str, Any]) -> Dict[str, Any]:
		return self._update("quality_settings", "default", data) or {}

	# Feedback
	def list_feedback(self) -> List[Dict[str, Any]]:
		return self._select_all("feedback")

	def get_feedback(self, id_: str) -> Optional[Dict[str, Any]]:
		return self._select_one("feedback", id_)

	def create_feedback(self, data: Dict[str, Any]) -> Dict[str, Any]:
		return self._insert("feedback", data)

	# Tickets
	def list_tickets(self) -> List[Dict[str, Any]]:
		return self._select_all("tickets")

	def get_ticket(self, id_: str) -> Optional[Dict[str, Any]]:
		return self._select_one("tickets", id_)

	def create_ticket(self, data: Dict[str, Any]) -> Dict[str, Any]:
		return self._insert("tickets", data)

	def update_ticket(self, id_: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
		return self._update("tickets", id_, data)

	# Photos
	def list_photos_by_customer(self, customer_id: str) -> List[Dict[str, Any]]:
		res = self.client.table("photos").select("*").eq("customer_id", customer_id).order("created_at", desc=True).execute()
		return list(res.data or [])

	def list_photos_by_assignment(self, appointment_id: str) -> List[Dict[str, Any]]:
		res = self.client.table("photos").select("*").eq("appointment_id", appointment_id).order("created_at", desc=True).execute()
		return list(res.data or [])

	def create_photo(self, data: Dict[str, Any]) -> Dict[str, Any]:
		return self._insert("photos", data)

	def update_photo(self, id_: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
		return self._update("photos", id_, data)

	def get_photo_by_token(self, token: str) -> Optional[Dict[str, Any]]:
		res = self.client.table("photos").select("*").eq("share_token", token).limit(1).execute()
		if res.data:
			return res.data[0]
		return None

	# City Pricing
	def list_city_pricing(self) -> List[Dict[str, Any]]:
		return self._select_all("city_pricing")

	def get_city_pricing(self, id_: str) -> Optional[Dict[str, Any]]:
		return self._select_one("city_pricing", id_)

	def create_city_pricing(self, data: Dict[str, Any]) -> Dict[str, Any]:
		return self._insert("city_pricing", data)

	def update_city_pricing(self, id_: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
		return self._update("city_pricing", id_, data)

	def delete_city_pricing(self, id_: str) -> bool:
		return self._delete("city_pricing", id_)


# Singleton repository chosen by environment
def get_repository() -> Repository:
	if settings.supabase_url and settings.supabase_anon_key:
		client = create_client(settings.supabase_url, settings.supabase_anon_key)
		return SupabaseRepository(client)
	# default to SQLite
	return SqlAlchemyRepository()


repo: Repository = get_repository()
