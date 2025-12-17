from __future__ import annotations
from typing import List, Dict, Any, Optional, Tuple
from geopy.distance import distance as geodesic

from .db import repo
from .schemas import PlanningAutoRequest


def _filter_customers(customers: List[Dict[str, Any]], city: Optional[str], service_type: Optional[str]) -> List[Dict[str, Any]]:
	def matches_city(c: Dict[str, Any]) -> bool:
		if not city:
			return True
		return (c.get("city") or "").strip().lower() == city.strip().lower()

	def matches_service(c: Dict[str, Any]) -> bool:
		if not service_type:
			return True
		tags = c.get("service_tags") or []
		return any((str(t or "").strip().lower() == service_type.strip().lower()) for t in tags)

	return [c for c in customers if c.get("is_active", True) and matches_city(c) and matches_service(c)]


def _coords_of(c: Dict[str, Any]) -> Optional[Tuple[float, float]]:
	lat = c.get("lat")
	lng = c.get("lng")
	if lat is None or lng is None:
		return None
	return (float(lat), float(lng))


def _nearest_neighbor_route(points: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
	if len(points) <= 1:
		return points

	coords = [_coords_of(p) for p in points]
	valid_idx = [i for i, xy in enumerate(coords) if xy is not None]
	if len(valid_idx) <= 1:
		return points

	# compute centroid to choose a reasonable start
	lat_sum = sum(coords[i][0] for i in valid_idx)  # type: ignore[index]
	lng_sum = sum(coords[i][1] for i in valid_idx)  # type: ignore[index]
	centroid = (lat_sum / len(valid_idx), lng_sum / len(valid_idx))

	# choose start as point nearest to centroid
	start_i = min(valid_idx, key=lambda i: geodesic(centroid, coords[i]).km)  # type: ignore[arg-type]

	unvisited = set(valid_idx)
	order_indices: List[int] = []
	current = start_i
	order_indices.append(current)
	unvisited.remove(current)

	while unvisited:
		current_xy = coords[current]
		next_i = min(unvisited, key=lambda i: geodesic(current_xy, coords[i]).km)  # type: ignore[arg-type]
		order_indices.append(next_i)
		unvisited.remove(next_i)
		current = next_i

	# keep items without coordinates at the end in original order
	no_coord_indices = [i for i, xy in enumerate(coords) if xy is None]
	final_indices = order_indices + no_coord_indices
	return [points[i] for i in final_indices]


def _estimate_total_minutes(ordered: List[Dict[str, Any]], avg_speed_kmh: float = 30.0) -> int:
	if not ordered:
		return 0
	# travel distance
	total_distance_km = 0.0
	prev_xy = None
	for c in ordered:
		xy = _coords_of(c)
		if prev_xy is not None and xy is not None:
			total_distance_km += geodesic(prev_xy, xy).km
		prev_xy = xy if xy is not None else prev_xy
	# convert to minutes
	travel_minutes = int(round((total_distance_km / avg_speed_kmh) * 60))
	# work time
	work_minutes = sum(int(c.get("duration_minutes") or 0) for c in ordered)
	return work_minutes + travel_minutes


def auto_plan(payload: PlanningAutoRequest) -> Dict[str, Any]:
	# fetch candidates
	customers = repo.list_customers()
	candidates = _filter_customers(customers, payload.city, payload.service_type)

	# order by proximity (simple nearest neighbor)
	ordered = _nearest_neighbor_route(candidates)

	total_minutes = _estimate_total_minutes(ordered)

	return {
		"ordered_customers": ordered,
		"total_duration_minutes": total_minutes,
	}


