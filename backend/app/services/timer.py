"""Timer Service - Handles time tracking for employees"""

from datetime import datetime, date, time, timedelta
from typing import Optional, List, Dict, Any
from uuid import uuid4

from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session

from ..models import TimeEntryModel, AssignmentModel, CustomerModel, EmployeeModel


def generate_id() -> str:
    return str(uuid4())


class TimerService:
    def __init__(self, session: Session):
        self.session = session

    def get_current_assignment(self, employee_id: str) -> Optional[Dict[str, Any]]:
        """Find the current assignment based on schedule and current time"""
        now = datetime.now()
        today = now.date()
        current_time = now.time()
        
        # Find today's assignments for this employee
        stmt = (
            select(AssignmentModel, CustomerModel)
            .join(CustomerModel, AssignmentModel.customer_id == CustomerModel.id)
            .where(
                and_(
                    AssignmentModel.employee_id == employee_id,
                    AssignmentModel.date == today
                )
            )
            .order_by(AssignmentModel.start_time)
        )
        
        results = self.session.execute(stmt).all()
        
        if not results:
            return None
        
        # Find the assignment that matches current time
        # We look for the assignment where start_time <= now < next_assignment_start_time
        for i, (assignment, customer) in enumerate(results):
            start = assignment.start_time
            if start is None:
                continue
            
            # Calculate end time based on customer duration
            duration = customer.duration_minutes or 60
            end_time = (datetime.combine(today, start) + timedelta(minutes=duration)).time()
            
            # Check if current time falls within this assignment's window
            # Give 30 min buffer before and after
            buffer_start = (datetime.combine(today, start) - timedelta(minutes=30)).time()
            buffer_end = (datetime.combine(today, end_time) + timedelta(minutes=30)).time()
            
            if buffer_start <= current_time <= buffer_end:
                return {
                    "assignment": self._assignment_to_dict(assignment),
                    "customer": self._customer_to_dict(customer),
                    "is_current": True,
                    "scheduled_start": str(start),
                    "scheduled_end": str(end_time)
                }
        
        # If no exact match, return the next upcoming assignment
        for assignment, customer in results:
            if assignment.start_time and assignment.start_time > current_time:
                return {
                    "assignment": self._assignment_to_dict(assignment),
                    "customer": self._customer_to_dict(customer),
                    "is_current": False,
                    "message": "Nächster Einsatz"
                }
        
        return None

    def get_todays_assignments(self, employee_id: str) -> List[Dict[str, Any]]:
        """Get all of today's assignments for an employee"""
        today = date.today()
        
        stmt = (
            select(AssignmentModel, CustomerModel)
            .join(CustomerModel, AssignmentModel.customer_id == CustomerModel.id)
            .where(
                and_(
                    AssignmentModel.employee_id == employee_id,
                    AssignmentModel.date == today
                )
            )
            .order_by(AssignmentModel.start_time)
        )
        
        results = self.session.execute(stmt).all()
        
        return [
            {
                "assignment": self._assignment_to_dict(a),
                "customer": self._customer_to_dict(c)
            }
            for a, c in results
        ]

    def start_timer(
        self,
        employee_id: str,
        customer_id: str,
        assignment_id: str,
        entry_type: str = "work"
    ) -> Dict[str, Any]:
        """Start a new time entry"""
        # Check for existing active entry
        active = self.get_active_entry(employee_id)
        if active:
            raise ValueError("Es läuft bereits ein Timer. Bitte zuerst stoppen.")
        
        entry = TimeEntryModel(
            id=generate_id(),
            assignment_id=assignment_id,
            employee_id=employee_id,
            customer_id=customer_id,
            entry_type=entry_type,
            started_at=datetime.now(),
            created_at=datetime.now()
        )
        
        self.session.add(entry)
        self.session.commit()
        
        return self._entry_to_dict(entry)

    def stop_timer(self, entry_id: str, notes: Optional[str] = None) -> Dict[str, Any]:
        """Stop a time entry and calculate duration"""
        entry = self.session.get(TimeEntryModel, entry_id)
        if not entry:
            raise ValueError("Timer nicht gefunden")
        
        if entry.ended_at:
            raise ValueError("Timer wurde bereits gestoppt")
        
        entry.ended_at = datetime.now()
        entry.duration_minutes = int((entry.ended_at - entry.started_at).total_seconds() / 60)
        if notes:
            entry.notes = notes
        
        self.session.commit()
        
        return self._entry_to_dict(entry)

    def get_active_entry(self, employee_id: str) -> Optional[Dict[str, Any]]:
        """Get the currently active time entry for an employee"""
        stmt = (
            select(TimeEntryModel)
            .where(
                and_(
                    TimeEntryModel.employee_id == employee_id,
                    TimeEntryModel.ended_at.is_(None)
                )
            )
        )
        
        entry = self.session.execute(stmt).scalar_one_or_none()
        return self._entry_to_dict(entry) if entry else None

    def get_customer_average_time(self, customer_id: str) -> Dict[str, Any]:
        """Calculate average work time for a customer"""
        stmt = (
            select(
                func.avg(TimeEntryModel.duration_minutes).label("avg_duration"),
                func.count(TimeEntryModel.id).label("total_entries")
            )
            .where(
                and_(
                    TimeEntryModel.customer_id == customer_id,
                    TimeEntryModel.entry_type == "work",
                    TimeEntryModel.duration_minutes.isnot(None)
                )
            )
        )
        
        result = self.session.execute(stmt).first()
        
        # Get customer info
        customer = self.session.get(CustomerModel, customer_id)
        
        return {
            "customer_id": customer_id,
            "customer_name": customer.name if customer else "Unbekannt",
            "avg_duration_minutes": round(result.avg_duration, 1) if result.avg_duration else 0,
            "total_entries": result.total_entries or 0,
            "planned_duration_minutes": customer.duration_minutes if customer else None
        }

    def get_employee_entries_today(self, employee_id: str) -> List[Dict[str, Any]]:
        """Get all time entries for an employee today"""
        today_start = datetime.combine(date.today(), time.min)
        today_end = datetime.combine(date.today(), time.max)
        
        stmt = (
            select(TimeEntryModel)
            .where(
                and_(
                    TimeEntryModel.employee_id == employee_id,
                    TimeEntryModel.started_at >= today_start,
                    TimeEntryModel.started_at <= today_end
                )
            )
            .order_by(TimeEntryModel.started_at)
        )
        
        entries = self.session.execute(stmt).scalars().all()
        return [self._entry_to_dict(e) for e in entries]

    def get_employee_break_settings(self, employee_id: str) -> Dict[str, Any]:
        """Get break settings for an employee"""
        employee = self.session.get(EmployeeModel, employee_id)
        if not employee:
            raise ValueError("Mitarbeiter nicht gefunden")
        
        return {
            "employee_id": employee_id,
            "employee_name": employee.name,
            "break_duration_minutes": employee.break_duration_minutes,
            "daily_break_count": employee.daily_break_count
        }

    def _assignment_to_dict(self, a: AssignmentModel) -> Dict[str, Any]:
        return {
            "id": a.id,
            "date": str(a.date),
            "start_time": str(a.start_time) if a.start_time else None,
            "employee_id": a.employee_id,
            "customer_id": a.customer_id,
            "service_type": a.service_type,
            "status": a.status,
            "notes": a.notes
        }

    def _customer_to_dict(self, c: CustomerModel) -> Dict[str, Any]:
        return {
            "id": c.id,
            "name": c.name,
            "address": c.address,
            "city": c.city,
            "duration_minutes": c.duration_minutes,
            "service_tags": c.service_tags
        }

    def _entry_to_dict(self, e: TimeEntryModel) -> Dict[str, Any]:
        return {
            "id": e.id,
            "assignment_id": e.assignment_id,
            "employee_id": e.employee_id,
            "customer_id": e.customer_id,
            "entry_type": e.entry_type,
            "started_at": e.started_at.isoformat() if e.started_at else None,
            "ended_at": e.ended_at.isoformat() if e.ended_at else None,
            "duration_minutes": e.duration_minutes,
            "notes": e.notes,
            "created_at": e.created_at.isoformat() if e.created_at else None
        }


