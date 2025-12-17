from typing import Optional, List
from .schemas import (
	CalculationRequest, CalculationResponse, 
	PricingSettings, PvConfig, StairwellConfig, GlassConfig, MaintenanceConfig,
	CityPricing
)
from .db import repo

def calculate_price(req: CalculationRequest) -> CalculationResponse:
	settings_dict = repo.get_pricing_settings()
	# Convert dict to Pydantic model for easier access
	# We construct the full PricingSettings object. 
	# Note: the dict from DB has JSON fields as dicts already.
	settings = PricingSettings(**settings_dict)

	net_price = 0.0
	details = {}

	# 1. Calculate Base Price per Category
	if req.service_category == "pv":
		net_price, details = _calc_pv(req, settings.pv_config)
	elif req.service_category == "stairwell":
		net_price, details = _calc_stairwell(req, settings.stairwell_config)
	elif req.service_category == "glass":
		net_price, details = _calc_glass(req, settings.glass_config)
	elif req.service_category == "maintenance":
		net_price, details = _calc_maintenance(req, settings.maintenance_config)
	else:
		details["error"] = f"Unknown category: {req.service_category}"

	# 2. Calculate Travel Fee
	travel_fee = 0.0
	travel_details = "Standard"
	
	if req.is_existing_customer:
		travel_fee = 0.0
		travel_details = "Bestandskunde (kostenlos)"
	elif req.city:
		# Look up city
		city_pricing_list = repo.list_city_pricing()
		# Find matching city (case-insensitive)
		found = next((c for c in city_pricing_list if (c.get("city_name") or "").lower().strip() == req.city.lower().strip()), None)
		if found:
			travel_fee = float(found.get("travel_fee", 0.0))
			travel_details = f"Pauschale für {found.get('city_name')}"
			
			# Optional: Check min order value
			min_val = found.get("min_order_value")
			if min_val and net_price < float(min_val):
				details["warning"] = f"Mindestauftragswert ({min_val}€) unterschritten."
				
			# Optional: Surcharge
			surcharge = found.get("surcharge_percent")
			if surcharge:
				add_on = net_price * (float(surcharge) / 100.0)
				net_price += add_on
				details["city_surcharge"] = add_on

	return CalculationResponse(
		net_price=round(net_price, 2),
		travel_fee=round(travel_fee, 2),
		total_price=round(net_price + travel_fee, 2),
		details={**details, "travel_details": travel_details}
	)


def _calc_pv(req: CalculationRequest, config: PvConfig):
	count = req.pv_modules_count or 0
	price_per_module = 0.0
	
	# Find tier
	# Tiers are like: min=0, max=10, price=10
	matched_tier = None
	for tier in config.tiers:
		# If max is None, it means "infinite" (ab X)
		upper = tier.max if tier.max is not None else float('inf')
		if tier.min <= count <= upper:
			matched_tier = tier
			break
	
	# Fallback if no tier matches (should not happen if 0-inf is covered)
	if matched_tier:
		price_per_module = matched_tier.price
	
	base = count * price_per_module
	
	# Extras
	surcharge_diff = 0.0
	if req.is_difficult_access:
		surcharge_diff = base * (config.surcharge_difficult_percent / 100.0)
		
	surcharge_dirty = 0.0
	if req.is_very_dirty:
		surcharge_dirty = config.surcharge_dirty_fix
		
	total = base + surcharge_diff + surcharge_dirty
	
	return total, {
		"count": count,
		"price_per_module": price_per_module,
		"base": base,
		"surcharge_difficult": surcharge_diff,
		"surcharge_dirty": surcharge_dirty
	}


def _calc_stairwell(req: CalculationRequest, config: StairwellConfig):
	# Config decides method, unless we want to support override?
	# Requirement says "Firma soll wählen können welche sie nutzt" -> Config decides default.
	# But usually calculator might need flexibility. For now, strictly follow config.method.
	
	method = config.method # "units", "sqm", "flat"
	total = 0.0
	details = {"method": method}
	
	if method == "units":
		units = req.units or 0
		# We assume weekly as standard comparison or need frequency input
		# If frequency is given (e.g. 4.0 per month), we need to know how config stores prices.
		# Config has: price_per_unit_weekly (means price for ONE cleaning if done weekly? Or monthly price for weekly service?)
		# Usually in cleaning: "Price per Month for 1x Weekly Service".
		# Let's assume the config values are "Price PER UNIT for the given frequency pattern".
		
		# Simplify: We just return the price for ONE month based on frequency?
		# Or price per cleaning?
		# "Preis pro WE bei 1x/Woche" -> usually implies Monthly Flatrate.
		
		# Let's try to match a frequency pattern roughly
		# If frequency ~4 (weekly), use weekly price.
		# If frequency ~2 (biweekly), use biweekly.
		# If frequency ~1 (monthly), use monthly.
		
		freq = req.frequency_per_month or 4.0
		p_unit = 0.0
		
		if freq >= 4:
			p_unit = config.price_per_unit_weekly
		elif freq >= 2:
			p_unit = config.price_per_unit_biweekly
		else:
			p_unit = config.price_per_unit_monthly
			
		base = units * p_unit
		base += config.base_price_obj
		total = base
		details.update({"units": units, "freq": freq, "p_unit": p_unit, "base_obj": config.base_price_obj})

	elif method == "sqm":
		sqm = req.sqm or 0.0
		price_sqm = 0.0
		
		if sqm <= config.threshold_sqm:
			price_sqm = config.price_sqm_upto
		else:
			price_sqm = config.price_sqm_after
			
		base = sqm * price_sqm
		base += config.base_price_sqm
		total = base
		details.update({"sqm": sqm, "price_sqm": price_sqm})

	elif method == "flat":
		total = config.flat_price
		if req.has_cellar:
			total += config.cellar_price
		if req.windows_count:
			total += req.windows_count * config.window_price
		details.update({"flat": config.flat_price, "cellar": req.has_cellar, "windows": req.windows_count})

	return total, details


def _calc_glass(req: CalculationRequest, config: GlassConfig):
	# User can choose per window or sqm in the calculation usually.
	# Req has "calculation_method" override.
	
	method = req.calculation_method or "window" # default
	total = 0.0
	details = {"method": method}
	
	if method == "window":
		c_in = req.glass_count_in or 0
		c_out = req.glass_count_out or 0
		
		base = (c_in * config.price_window_in) + (c_out * config.price_window_out)
		
		# Extras
		sur_height = 0.0
		if req.glass_height_surcharge:
			# Fix amount or per window? Usually per window involved or fix. 
			# Model has "surcharge_height: number". Let's assume it's a fix surcharge per job or per window?
			# Let's assume per window involved (sum of in+out) for simplicity or just fix.
			# Given "Aufschlag ... (Fixbetrag oder Prozent)", I used float. Let's treat as fix sum for now.
			sur_height = config.surcharge_height
			
		sur_diff = 0.0
		if req.glass_difficult_access:
			sur_diff = base * (config.surcharge_difficult_percent / 100.0)
			
		total = base + sur_height + sur_diff
		details.update({"count_in": c_in, "count_out": c_out, "base": base})

	elif method == "sqm":
		s_in = req.glass_sqm_in or 0.0
		s_out = req.glass_sqm_out or 0.0
		
		base = (s_in * config.price_sqm_in) + (s_out * config.price_sqm_out)
		
		sur_frame = 0.0
		if req.frame_cleaning:
			sur_frame = base * (config.surcharge_frame_percent / 100.0)
			
		total = base + sur_frame
		details.update({"sqm_in": s_in, "sqm_out": s_out, "base": base})

	return total, details


def _calc_maintenance(req: CalculationRequest, config: MaintenanceConfig):
	# hourly or sqm
	total = 0.0
	details = {}
	
	if req.hours_estimated and req.hours_estimated > 0:
		total = req.hours_estimated * config.hourly_rate
		details["method"] = "hourly"
		details["hours"] = req.hours_estimated
		details["rate"] = config.hourly_rate
	elif req.maintenance_sqm and req.maintenance_sqm > 0:
		total = req.maintenance_sqm * config.price_sqm
		details["method"] = "sqm"
		details["sqm"] = req.maintenance_sqm
		details["price_sqm"] = config.price_sqm
	
	return total, details

