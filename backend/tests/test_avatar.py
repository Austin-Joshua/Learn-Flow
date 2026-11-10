import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User


def test_avatar_default_generation(client, db, learner_headers: dict):
    """Verify that a user who has not customized their avatar receives a cohesive default configuration."""
    resp = client.get("/api/v1/users/me/avatar", headers=learner_headers)
    assert resp.status_code == 200
    data = resp.json()

    assert "skinTone" in data
    assert "faceShape" in data
    assert "hairStyle" in data
    assert "clothingStyle" in data
    assert "backgroundId" in data
    assert data["skinTone"].startswith("#")


def test_avatar_customization_and_persistence(client, db, learner_headers: dict):
    """Verify that avatar updates persist across requests in PostgreSQL."""
    custom_avatar = {
        "skinTone": "#d97706",
        "faceShape": "chiseled",
        "eyeShape": "upturned",
        "eyeColor": "#059669",
        "eyebrowStyle": "feathered",
        "eyebrowColor": "#78350f",
        "noseStyle": "aquiline",
        "mouthStyle": "teeth",
        "lipColor": "#be123c",
        "earStyle": "small",
        "earrings": "gold_stud",
        "facialDetail": "freckles",
        "hairStyle": "curly_afro",
        "hairColor": "#b91c1c",
        "beardStyle": "goatee",
        "mustacheStyle": "chevron",
        "facialHairColor": "#b91c1c",
        "clothingStyle": "hoodie",
        "clothingColor": "#7c3aed",
        "clothingPattern": "collar_contrast",
        "glassesStyle": "horn_rimmed",
        "glassesColor": "#0f172a",
        "backgroundId": "sunset_horizon"
    }

    # 1. Update avatar
    put_resp = client.put(
        "/api/v1/users/me/avatar",
        json={"avatar_config": custom_avatar},
        headers=learner_headers
    )
    assert put_resp.status_code == 200
    saved = put_resp.json()
    assert saved["eyeColor"] == "#059669"
    assert saved["hairStyle"] == "curly_afro"
    assert saved["clothingStyle"] == "hoodie"
    assert saved["backgroundId"] == "sunset_horizon"

    # 2. Retrieve again via GET /me/avatar
    get_resp = client.get("/api/v1/users/me/avatar", headers=learner_headers)
    assert get_resp.status_code == 200
    retrieved = get_resp.json()
    assert retrieved == custom_avatar


def test_public_user_avatar_retrieval(client, db, learner_headers: dict, instructor_headers: dict):
    """Verify that any authenticated user can view another user's avatar configuration."""
    # Find learner's user ID
    learner_me = client.get("/api/v1/auth/me", headers=learner_headers).json()
    learner_id = learner_me["id"]

    # Instructor views learner's avatar
    resp = client.get(f"/api/v1/users/{learner_id}/avatar", headers=instructor_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "skinTone" in data
    assert "backgroundId" in data

