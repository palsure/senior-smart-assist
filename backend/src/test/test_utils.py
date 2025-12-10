import pytest
from src.main.utils import calculate_distance, estimate_eta_km

def test_calculate_distance():
    """Test distance calculation between two coordinates."""
    # San Francisco to slightly north (approximately 1.11 km)
    coord1 = (37.7749, -122.4194)
    coord2 = (37.7849, -122.4094)
    
    distance = calculate_distance(coord1, coord2)
    
    # Distance should be approximately 1.4 km
    assert 1.0 <= distance <= 2.0

def test_calculate_distance_same_location():
    """Test distance calculation for same location."""
    coord = (37.7749, -122.4194)
    distance = calculate_distance(coord, coord)
    
    assert distance == 0.0

def test_estimate_eta_default_speed():
    """Test ETA estimation with default walking speed."""
    distance_km = 3.0
    eta = estimate_eta_km(distance_km)
    
    # 3 km at 3 km/h = 60 minutes
    assert eta == 60.0

def test_estimate_eta_custom_speed():
    """Test ETA estimation with custom speed."""
    distance_km = 10.0
    speed_kmh = 5.0
    eta = estimate_eta_km(distance_km, speed_kmh)
    
    # 10 km at 5 km/h = 120 minutes
    assert eta == 120.0

def test_estimate_eta_short_distance():
    """Test ETA estimation for short distance."""
    distance_km = 0.5
    eta = estimate_eta_km(distance_km)
    
    # 0.5 km at 3 km/h = 10 minutes
    assert eta == 10.0
