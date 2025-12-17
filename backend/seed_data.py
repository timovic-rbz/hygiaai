#!/usr/bin/env python3
"""Seed script to populate the database with demo data."""

import sys
sys.path.insert(0, '.')

from app.db import repo
from datetime import date, timedelta

# Demo Kunden
DEMO_CUSTOMERS = [
    {
        "name": "Bürokomplex Alpha",
        "address": "Hauptstraße 42",
        "city": "Köln",
        "phone": "0221-1234567",
        "email": "kontakt@alpha-buero.de",
        "service_tags": ["Unterhaltsreinigung", "Glasreinigung"],
        "duration_minutes": 120,
        "is_active": True,
        "is_existing_customer": True,
        "notes": "Schlüssel beim Hausmeister, Herr Schmidt. Mo-Fr ab 18:00 Uhr."
    },
    {
        "name": "Praxis Dr. Müller",
        "address": "Lindenweg 15",
        "city": "Leverkusen",
        "phone": "0214-9876543",
        "email": "praxis@dr-mueller.de",
        "service_tags": ["Praxisreinigung", "Desinfektion"],
        "duration_minutes": 90,
        "is_active": True,
        "is_existing_customer": True,
        "notes": "Medizinische Einrichtung - besondere Hygienevorschriften beachten."
    },
    {
        "name": "Restaurant Bella Italia",
        "address": "Marktplatz 8",
        "city": "Düsseldorf",
        "phone": "0211-5554433",
        "email": "info@bella-italia.de",
        "service_tags": ["Gastronomiereinigung", "Küchenreinigung"],
        "duration_minutes": 150,
        "is_active": True,
        "is_existing_customer": False,
        "notes": "Neukunde seit November. Reinigung nach Geschäftsschluss ab 23:00."
    },
    {
        "name": "Fitnessstudio PowerGym",
        "address": "Sportplatzweg 22",
        "city": "Köln",
        "phone": "0221-7778899",
        "email": "info@powergym.de",
        "service_tags": ["Unterhaltsreinigung", "Sanitärreinigung"],
        "duration_minutes": 180,
        "is_active": True,
        "is_existing_customer": True,
        "notes": "Tägliche Reinigung der Umkleiden und Duschen. Geräte 2x wöchentlich."
    },
    {
        "name": "Kanzlei Weber & Partner",
        "address": "Königsallee 100",
        "city": "Düsseldorf",
        "phone": "0211-1112233",
        "email": "office@weber-partner.de",
        "service_tags": ["Büroreinigung", "Teppichreinigung"],
        "duration_minutes": 60,
        "is_active": True,
        "is_existing_customer": True,
        "notes": "Diskretion erforderlich. Akten nicht anfassen."
    },
    {
        "name": "Autohaus Schmidt",
        "address": "Industriestraße 55",
        "city": "Leverkusen",
        "phone": "0214-3332211",
        "email": "service@autohaus-schmidt.de",
        "service_tags": ["Industriereinigung", "Glasreinigung"],
        "duration_minutes": 240,
        "is_active": True,
        "is_existing_customer": False,
        "notes": "Showroom täglich, Werkstatt wöchentlich."
    },
    {
        "name": "Kindergarten Sonnenschein",
        "address": "Am Stadtpark 3",
        "city": "Köln",
        "phone": "0221-4445566",
        "email": "leitung@kiga-sonnenschein.de",
        "service_tags": ["Unterhaltsreinigung", "Desinfektion"],
        "duration_minutes": 90,
        "is_active": True,
        "is_existing_customer": True,
        "notes": "Nur kinderfreundliche Reinigungsmittel verwenden!"
    },
    {
        "name": "Hotel Rheinblick",
        "address": "Rheinuferstraße 1",
        "city": "Bonn",
        "phone": "0228-9998877",
        "email": "rezeption@hotel-rheinblick.de",
        "service_tags": ["Hotelreinigung", "Wäscheservice"],
        "duration_minutes": 300,
        "is_active": True,
        "is_existing_customer": True,
        "notes": "45 Zimmer, Check-out bis 11:00, Check-in ab 15:00."
    },
]

# Demo Mitarbeiter
DEMO_EMPLOYEES = [
    {
        "name": "Max Mustermann",
        "phone": "0170-1234567",
        "email": "max.mustermann@hygiaai.de",
        "is_active": True
    },
    {
        "name": "Anna Schmidt",
        "phone": "0171-2345678",
        "email": "anna.schmidt@hygiaai.de",
        "is_active": True
    },
    {
        "name": "Peter Weber",
        "phone": "0172-3456789",
        "email": "peter.weber@hygiaai.de",
        "is_active": True
    },
    {
        "name": "Maria Gonzalez",
        "phone": "0173-4567890",
        "email": "maria.gonzalez@hygiaai.de",
        "is_active": True
    },
    {
        "name": "Thomas Becker",
        "phone": "0174-5678901",
        "email": "thomas.becker@hygiaai.de",
        "is_active": False  # Inaktiv (z.B. Elternzeit)
    },
]

# Demo Service-Typen
DEMO_SERVICE_TYPES = [
    {"name": "Unterhaltsreinigung", "description": "Regelmäßige Reinigung von Büros und Gewerbeflächen"},
    {"name": "Glasreinigung", "description": "Fenster- und Glasfassadenreinigung"},
    {"name": "Praxisreinigung", "description": "Spezialreinigung für Arztpraxen und medizinische Einrichtungen"},
    {"name": "Gastronomiereinigung", "description": "Reinigung von Restaurants und Küchen"},
    {"name": "Industriereinigung", "description": "Reinigung von Produktionshallen und Werkstätten"},
    {"name": "Teppichreinigung", "description": "Professionelle Teppich- und Polsterreinigung"},
    {"name": "Desinfektion", "description": "Hygienische Desinfektion von Oberflächen"},
    {"name": "Hotelreinigung", "description": "Zimmerreinigung und Housekeeping"},
]

def seed_database():
    print("🌱 Seeding database with demo data...\n")
    
    # Check if data already exists
    existing_customers = repo.list_customers()
    existing_employees = repo.list_employees()
    
    if existing_customers or existing_employees:
        print("⚠️  Database already contains data!")
        response = input("Do you want to add demo data anyway? (y/N): ")
        if response.lower() != 'y':
            print("Aborted.")
            return
    
    # Create customers
    print("📦 Creating demo customers...")
    customer_ids = []
    for c in DEMO_CUSTOMERS:
        created = repo.create_customer(c)
        customer_ids.append(created["id"])
        print(f"   ✅ {c['name']} ({c['city']})")
    
    # Create employees
    print("\n👥 Creating demo employees...")
    employee_ids = []
    for e in DEMO_EMPLOYEES:
        created = repo.create_employee(e)
        employee_ids.append(created["id"])
        status = "✅" if e["is_active"] else "⏸️"
        print(f"   {status} {e['name']}")
    
    # Create service types
    print("\n🏷️ Creating service types...")
    for st in DEMO_SERVICE_TYPES:
        try:
            repo.create_service_type(st)
            print(f"   ✅ {st['name']}")
        except:
            print(f"   ⏭️ {st['name']} (already exists)")
    
    # Create assignments for this week
    print("\n📅 Creating demo assignments for this week...")
    today = date.today()
    weekday = today.weekday()  # 0 = Monday
    monday = today - timedelta(days=weekday)
    
    # Active employees only
    active_employee_ids = [employee_ids[i] for i, e in enumerate(DEMO_EMPLOYEES) if e["is_active"]]
    
    assignments_created = 0
    for day_offset in range(7):  # Mon-Sun
        current_date = monday + timedelta(days=day_offset)
        if day_offset < 5:  # Mo-Fr: more assignments
            num_assignments = min(4, len(customer_ids))
        else:  # Weekend: fewer
            num_assignments = min(2, len(customer_ids))
        
        for i in range(num_assignments):
            customer_idx = (day_offset + i) % len(customer_ids)
            employee_idx = i % len(active_employee_ids)
            
            assignment_data = {
                "date": current_date,  # Use date object directly
                "customer_id": customer_ids[customer_idx],
                "employee_id": active_employee_ids[employee_idx],
                "service_type": DEMO_CUSTOMERS[customer_idx]["service_tags"][0] if DEMO_CUSTOMERS[customer_idx]["service_tags"] else "Unterhaltsreinigung",
                "start_time": f"{8 + i * 2:02d}:00",
                "notes": ""
            }
            repo.create_assignment(assignment_data)
            assignments_created += 1
    
    print(f"   ✅ {assignments_created} assignments created")
    
    print("\n✨ Database seeding complete!")
    print(f"   - {len(DEMO_CUSTOMERS)} customers")
    print(f"   - {len(DEMO_EMPLOYEES)} employees")
    print(f"   - {len(DEMO_SERVICE_TYPES)} service types")
    print(f"   - {assignments_created} assignments")

if __name__ == "__main__":
    seed_database()

