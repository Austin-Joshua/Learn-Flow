from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class AvatarConfig(BaseModel):
    skinTone: str = "#fed7aa"
    faceShape: str = "oval"
    eyeShape: str = "almond"
    eyeColor: str = "#451a03"
    eyebrowStyle: str = "natural"
    eyebrowColor: str = "#1c1917"
    noseStyle: str = "straight"
    mouthStyle: str = "smile"
    lipColor: str = "#be123c"
    earStyle: str = "standard"
    earrings: str = "none"
    facialDetail: str = "blush"
    hairStyle: str = "side_part"
    hairColor: str = "#1c1917"
    beardStyle: str = "none"
    mustacheStyle: str = "none"
    facialHairColor: str = "#1c1917"
    clothingStyle: str = "oxford"
    clothingColor: str = "#0284c7"
    clothingPattern: str = "solid"
    glassesStyle: str = "wireframe_round"
    glassesColor: str = "#0f172a"
    backgroundId: str = "collegiate_azure"


class AvatarConfigUpdate(BaseModel):
    avatar_config: Dict[str, Any]
