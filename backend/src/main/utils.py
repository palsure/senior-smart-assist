from typing import List, Tuple, Optional
from src.main.models import Volunteer, HelpRequest
import re
from geopy.geocoders import Nominatim
from geopy.distance import geodesic

def calculate_address_similarity(address1: Optional[str], address2: Optional[str]) -> float:
    """Calculate similarity score between two addresses.
    
    Uses simple string matching based on common words (city, street, etc.)
    
    Args:
        address1: First address string
        address2: Second address string
        
    Returns:
        Score between 0.0 and 1.0 (1.0 = very similar, 0.0 = no similarity)
    """
    if not address1 or not address2:
        return 0.5  # Default score if address missing
    
    addr1_lower = address1.lower().strip()
    addr2_lower = address2.lower().strip()
    
    # Exact match
    if addr1_lower == addr2_lower:
        return 1.0
    
    # Extract city/area (last part after comma or common separators)
    addr1_parts = [p.strip() for p in addr1_lower.replace(',', ' ').split()]
    addr2_parts = [p.strip() for p in addr2_lower.replace(',', ' ').split()]
    
    # Count common words
    common_words = set(addr1_parts) & set(addr2_parts)
    if not common_words:
        return 0.2  # No common words
    
    # Calculate similarity based on common words
    total_words = len(set(addr1_parts) | set(addr2_parts))
    similarity = len(common_words) / total_words if total_words > 0 else 0.0
    
    # Boost score if city/state matches (usually last 1-2 words)
    if len(addr1_parts) > 0 and len(addr2_parts) > 0:
        if addr1_parts[-1] == addr2_parts[-1]:  # Last word matches (often city/state)
            similarity = min(1.0, similarity + 0.3)
        if len(addr1_parts) > 1 and len(addr2_parts) > 1:
            if addr1_parts[-2] == addr2_parts[-2]:  # Second to last matches
                similarity = min(1.0, similarity + 0.2)
    
    return min(1.0, similarity)

def parse_skills(skills_string: Optional[str]) -> List[str]:
    """Parse comma-separated skills string into a list.
    
    Args:
        skills_string: Comma-separated string of skills
        
    Returns:
        List of skills (normalized to lowercase)
    """
    if not skills_string:
        return []
    return [skill.strip().lower() for skill in skills_string.split(',') if skill.strip()]

def calculate_skill_match_score(request_type: str, volunteer_skills: Optional[str]) -> float:
    """Calculate skill match score between request type and volunteer skills.
    
    Args:
        request_type: Type of help request
        volunteer_skills: Comma-separated string of volunteer skills
        
    Returns:
        Score between 0.0 and 1.0 (1.0 = perfect match)
    """
    if not volunteer_skills:
        return 0.3  # Base score for volunteers without listed skills
    
    request_lower = request_type.lower()
    volunteer_skill_list = parse_skills(volunteer_skills)
    
    # Direct match
    if request_lower in volunteer_skill_list:
        return 1.0
    
    # Skill mapping for common request types
    skill_mapping = {
        'groceries': ['shopping', 'groceries', 'errands', 'delivery'],
        'medical assistance': ['medical', 'healthcare', 'nursing', 'first aid', 'medicine'],
        'transportation': ['driving', 'transportation', 'transport', 'vehicle'],
        'commute assistance': ['driving', 'transportation', 'commute', 'vehicle'],
        'house shifting': ['moving', 'lifting', 'heavy lifting', 'furniture', 'shifting'],
        'home maintenance': ['repair', 'maintenance', 'plumbing', 'electrical', 'carpentry', 'handyman'],
        'companionship': ['companionship', 'social', 'conversation', 'visiting', 'friendly'],
        'technology help': ['technology', 'computer', 'tech', 'digital', 'smartphone', 'internet']
    }
    
    # Check for related skills
    related_skills = skill_mapping.get(request_lower, [])
    for skill in volunteer_skill_list:
        if skill in related_skills:
            return 0.8  # Good match with related skill
    
    # Partial match (contains keyword)
    for skill in volunteer_skill_list:
        if skill in request_lower or request_lower in skill:
            return 0.6  # Partial match
    
    return 0.3  # Base score - no specific match but volunteer is available

def calculate_location_score(request_address: Optional[str], volunteer_address: Optional[str]) -> float:
    """Calculate location score based on address similarity.
    
    Args:
        request_address: Request address string
        volunteer_address: Volunteer address string
        
    Returns:
        Score between 0.0 and 1.0 (1.0 = same area, 0.0 = different area)
    """
    return calculate_address_similarity(request_address, volunteer_address)

def calculate_availability_score(availability: Optional[str]) -> float:
    """Calculate availability score.
    
    Args:
        availability: Availability status ('available', 'busy', 'unavailable')
        
    Returns:
        Score: 1.0 for available, 0.5 for busy, 0.0 for unavailable
    """
    if not availability:
        return 0.5  # Default to busy if not specified
    
    availability_lower = availability.lower()
    if availability_lower == 'available':
        return 1.0
    elif availability_lower == 'busy':
        return 0.5
    elif availability_lower == 'unavailable':
        return 0.0
    else:
        return 0.5  # Default

def calculate_workload_score(volunteer: Volunteer) -> float:
    """Calculate workload score based on active assignments.
    
    Args:
        volunteer: Volunteer object
        
    Returns:
        Score between 0.0 and 1.0 (1.0 = no active requests, 0.0 = many active requests)
    """
    # Count active requests (pending, assigned, in_progress)
    active_requests = [req for req in volunteer.assigned_requests 
                       if req.status in ['pending', 'assigned', 'in_progress']]
    active_count = len(active_requests)
    
    # Score decreases as active requests increase
    # 0 requests = 1.0, 1 request = 0.8, 2 requests = 0.6, 3+ requests = 0.4
    if active_count == 0:
        return 1.0
    elif active_count == 1:
        return 0.8
    elif active_count == 2:
        return 0.6
    else:
        return 0.4

def smart_match_volunteer(request: HelpRequest, volunteers: List[Volunteer]) -> Optional[Tuple[Volunteer, float, dict]]:
    """Smart matching algorithm to find the best volunteer for a request.
    
    Uses AI-like scoring system considering:
    - Address similarity (40% weight)
    - Skill matching (35% weight)
    - Availability (15% weight)
    - Current workload (10% weight)
    
    Args:
        request: HelpRequest object
        volunteers: List of available volunteers
        
    Returns:
        Tuple of (best_volunteer, total_score, score_breakdown) or None if no suitable match
    """
    if not volunteers:
        return None
    
    best_match = None
    best_score = -1.0
    best_breakdown = {}
    
    # Get elder address if available
    request_address = request.address
    if not request_address and request.elder:
        request_address = request.elder.address
    
    for volunteer in volunteers:
        # Calculate individual scores
        location_score = calculate_location_score(request_address, volunteer.address)
        skill_score = calculate_skill_match_score(request.request_type, volunteer.skills)
        availability_score = calculate_availability_score(volunteer.availability)
        workload_score = calculate_workload_score(volunteer)
        
        # Weighted total score
        total_score = (
            location_score * 0.40 +      # 40% weight on address similarity
            skill_score * 0.35 +          # 35% weight on skills
            availability_score * 0.15 +   # 15% weight on availability
            workload_score * 0.10         # 10% weight on workload
        )
        
        # Store breakdown for debugging/logging
        score_breakdown = {
            'location': location_score,
            'skills': skill_score,
            'availability': availability_score,
            'workload': workload_score,
            'total': round(total_score, 3)
        }
        
        if total_score > best_score:
            best_score = total_score
            best_match = volunteer
            best_breakdown = score_breakdown
    
    if best_match and best_score > 0.3:  # Minimum threshold
        return (best_match, best_score, best_breakdown)
    
    return None

def classify_request_type(description: Optional[str]) -> str:
    """AI-based classification of request type from description.
    
    Uses keyword matching and context analysis to determine the most appropriate
    request type category.
    
    Args:
        description: Text description of the help request
        
    Returns:
        Request type string (one of the predefined types)
    """
    if not description:
        return "Other"
    
    description_lower = description.lower()
    
    # Check for high-priority phrases first (these override keyword matching)
    high_priority_phrases = {
        "Medical Assistance": [
            "buy medicine", "get medicine", "pick up medicine", "pickup medicine",
            "buy medication", "get medication", "pick up medication", "pickup medication",
            "get prescription", "pick up prescription", "pickup prescription",
            "medical appointment", "doctor appointment", "hospital visit",
            "medical emergency", "health emergency", "need medical"
        ],
        "Transportation": [
            "need a ride", "need ride", "pick me up", "drop me off",
            "take me to", "drive me to", "give me a ride"
        ],
        "Groceries": [
            "buy groceries", "get groceries", "grocery shopping", "food shopping",
            "buy food", "get food", "pick up food", "pickup food"
        ]
    }
    
    for req_type, phrases in high_priority_phrases.items():
        for phrase in phrases:
            if phrase in description_lower:
                return req_type
    
    # Define keyword patterns for each request type with weights
    type_patterns = {
        "Groceries": {
            "keywords": ["grocery", "groceries", "shopping", "food", "store", "market", "supermarket", 
                        "milk", "bread", "vegetables", "fruits", "eggs", "meat", "items", "supplies"],
            "weight": 1.0,
            "exclude_keywords": ["medicine", "medication", "prescription", "medical", "doctor", "hospital"]  # Exclude medical contexts
        },
        "Medical Assistance": {
            "keywords": ["medical", "doctor", "hospital", "medicine", "medication", "prescription", "health", "healthcare",
                        "appointment", "clinic", "nurse", "treatment", "symptoms", "pain", "illness", "sick", "unwell",
                        "emergency", "ambulance", "first aid", "injury", "pharmacy", "pharmacist"],
            "weight": 1.5,  # Higher weight for medical keywords
            "priority_keywords": ["medicine", "medication", "prescription", "medical", "doctor", "hospital", "pharmacy"]  # These get extra boost
        },
        "Transportation": {
            "keywords": ["transport", "transportation", "ride", "drive", "car", "vehicle", "taxi", "uber", "lyft",
                        "airport", "station", "pickup", "drop", "destination", "location", "travel"],
            "weight": 1.0
        },
        "Commute Assistance": {
            "keywords": ["commute", "commuting", "work", "office", "job", "daily", "routine", "regular", "everyday"],
            "weight": 0.8
        },
        "House Shifting": {
            "keywords": ["moving", "move", "shift", "shifting", "relocate", "relocation", "pack", "packing", "boxes",
                        "furniture", "belongings", "new home", "new house", "apartment", "heavy", "lifting"],
            "weight": 1.0
        },
        "Home Maintenance": {
            "keywords": ["repair", "fix", "maintenance", "broken", "leak", "plumbing", "electrical", "carpentry",
                        "handyman", "install", "installation", "appliance", "heating", "cooling", "ac", "heater",
                        "door", "window", "roof", "wall", "painting", "cleaning", "yard", "garden"],
            "weight": 1.0
        },
        "Companionship": {
            "keywords": ["companion", "companionship", "visit", "visiting", "talk", "conversation", "chat", "social",
                        "lonely", "loneliness", "friend", "friendship", "spend time", "company", "someone to talk"],
            "weight": 1.0
        },
        "Technology Help": {
            "keywords": ["computer", "laptop", "phone", "smartphone", "tablet", "internet", "wifi", "email", "app",
                        "software", "device", "tech", "technology", "digital", "online", "website", "password",
                        "account", "setup", "configure", "troubleshoot", "help with", "how to"],
            "weight": 1.0
        }
    }
    
    # Calculate scores for each type
    type_scores = {}
    for req_type, pattern_data in type_patterns.items():
        score = 0.0
        keywords = pattern_data["keywords"]
        weight = pattern_data["weight"]
        
        # Check for exclude keywords (if present, reduce score significantly)
        exclude_keywords = pattern_data.get("exclude_keywords", [])
        has_exclude = any(exclude in description_lower for exclude in exclude_keywords)
        if has_exclude and req_type == "Groceries":
            # If medical keywords are present, heavily penalize Groceries
            score -= 10.0
        
        # Check for priority keywords (these get extra boost)
        priority_keywords = pattern_data.get("priority_keywords", [])
        priority_match = any(priority in description_lower for priority in priority_keywords)
        if priority_match:
            score += 5.0 * weight  # Significant boost for priority keywords
        
        # Count keyword matches
        for keyword in keywords:
            # Exact word match (higher weight)
            if re.search(r'\b' + re.escape(keyword) + r'\b', description_lower):
                score += 2.0 * weight
            # Partial match (lower weight)
            elif keyword in description_lower:
                score += 1.0 * weight
        
        # Boost score for multiple keyword matches
        matches = sum(1 for keyword in keywords if keyword in description_lower)
        if matches > 1:
            score *= (1 + matches * 0.1)  # 10% boost per additional match
        
        type_scores[req_type] = score
    
    # Find the type with highest score
    if type_scores:
        best_type = max(type_scores.items(), key=lambda x: x[1])
        # Only return if score is above threshold, otherwise return "Other"
        if best_type[1] > 0.5:
            return best_type[0]
    
    return "Other"

# Simple in-memory cache for geocoded addresses
_geocode_cache = {}
_distance_cache = {}

def calculate_distance_miles(address1: Optional[str], address2: Optional[str]) -> Optional[float]:
    """Calculate distance between two addresses in miles.
    
    Uses geocoding to convert addresses to coordinates, then calculates
    the great-circle distance using the haversine formula.
    Uses caching to avoid re-geocoding the same addresses.
    
    Args:
        address1: First address string
        address2: Second address string
        
    Returns:
        Distance in miles, or None if addresses cannot be geocoded
    """
    if not address1 or not address2:
        return None
    
    # Check cache first
    cache_key = f"{address1}|{address2}"
    if cache_key in _distance_cache:
        return _distance_cache[cache_key]
    
    try:
        geolocator = Nominatim(user_agent="senior_smartassist")
        
        # Get or cache geocoded locations
        if address1 not in _geocode_cache:
            location1 = geolocator.geocode(address1, timeout=5)  # Reduced timeout
            _geocode_cache[address1] = location1
        else:
            location1 = _geocode_cache[address1]
        
        if address2 not in _geocode_cache:
            location2 = geolocator.geocode(address2, timeout=5)  # Reduced timeout
            _geocode_cache[address2] = location2
        else:
            location2 = _geocode_cache[address2]
        
        if not location1 or not location2:
            _distance_cache[cache_key] = None
            return None
        
        # Calculate distance using geodesic (great-circle distance)
        # This uses the haversine formula to calculate the shortest distance
        # between two points on the surface of a sphere (Earth)
        distance_km = geodesic(
            (location1.latitude, location1.longitude),
            (location2.latitude, location2.longitude)
        ).kilometers
        
        # Convert to miles (1 km = 0.621371 miles)
        distance_miles = round(distance_km * 0.621371, 2)
        
        # Cache the result
        _distance_cache[cache_key] = distance_miles
        return distance_miles
    except Exception as e:
        # If geocoding fails, cache None and return None
        print(f"Error calculating distance: {e}")
        _distance_cache[cache_key] = None
        return None
