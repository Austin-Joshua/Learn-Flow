from typing import Dict, Any
from app.models.user import User

FEMALE_NAMES = {
    'ada', 'grace', 'marie', 'curie', 'sarah', 'jane', 'emily', 'anna', 'alice',
    'sophia', 'emma', 'olivia', 'mia', 'clara', 'katherine', 'margaret', 'rosalind',
    'barbara', 'elizabeth', 'lovelace', 'hopper', 'mary', 'rachel', 'jennifer', 'laura'
}


def resolve_user_gender(user: User) -> str:
    if user.avatar_gender in ("female", "male"):
        return user.avatar_gender

    first_name = (user.first_name or "").lower().strip()
    email = (user.email or "").lower().strip()
    full_name = (user.full_name or "").lower().strip()

    if any(k in email or k in full_name for k in ("ada", "lovelace", "grace", "hopper", "learner")):
        return "female"
    if any(k in email or k in full_name for k in ("linus", "torvalds", "alan", "turing", "instructor", "admin")):
        return "male"
    if first_name in FEMALE_NAMES:
        return "female"
    return "female"


def get_default_avatar_config(user: User) -> Dict[str, Any]:
    """Generates a personalized, cohesive default avatar configuration for a given user."""
    gender = resolve_user_gender(user)
    roles = [r.name.lower() for r in user.roles] if user.roles else ["learner"]

    if gender == "female":
        return {
            "skinTone": "#fed7aa",
            "faceShape": "oval",
            "eyeShape": "almond",
            "eyeColor": "#1e3a8a",
            "eyebrowStyle": "arched",
            "eyebrowColor": "#1c1917",
            "noseStyle": "straight",
            "mouthStyle": "smile",
            "lipColor": "#be123c",
            "earStyle": "standard",
            "earrings": "pearl",
            "facialDetail": "blush",
            "hairStyle": "sleek_bun",
            "hairColor": "#1c1917",
            "beardStyle": "none",
            "mustacheStyle": "none",
            "facialHairColor": "#1c1917",
            "clothingStyle": "blazer" if ("instructor" in roles or "admin" in roles) else "oxford",
            "clothingColor": "#0f172a" if "admin" in roles else "#0284c7",
            "clothingPattern": "solid",
            "glassesStyle": "wireframe_round",
            "glassesColor": "#0f172a",
            "backgroundId": "royal_obsidian" if "admin" in roles else "collegiate_azure"
        }
    else:
        return {
            "skinTone": "#fed7aa",
            "faceShape": "square",
            "eyeShape": "round",
            "eyeColor": "#451a03",
            "eyebrowStyle": "straight",
            "eyebrowColor": "#1e293b",
            "noseStyle": "straight",
            "mouthStyle": "confident",
            "lipColor": "#991b1b",
            "earStyle": "standard",
            "earrings": "none",
            "facialDetail": "none",
            "hairStyle": "side_part",
            "hairColor": "#1e293b",
            "beardStyle": "stubble" if "instructor" in roles else "none",
            "mustacheStyle": "none",
            "facialHairColor": "#1e293b",
            "clothingStyle": "blazer" if "admin" in roles else "oxford",
            "clothingColor": "#0f172a" if "admin" in roles else "#0369a1",
            "clothingPattern": "solid",
            "glassesStyle": "modern_rect" if "admin" in roles else "none",
            "glassesColor": "#0f172a",
            "backgroundId": "royal_obsidian" if "admin" in roles else "oxford_library"
        }

