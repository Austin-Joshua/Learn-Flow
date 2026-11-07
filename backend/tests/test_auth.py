import pytest
import uuid
from app.models.user import User


def test_public_registration_creates_learner_only(client, db):
    unique_email = f"learner_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "email": unique_email,
        "password": "SecurePassword123!",
        "first_name": "Test",
        "last_name": "Learner"
    }

    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201, response.text
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == unique_email
    role_names = [r["name"] for r in data["user"]["roles"]]
    assert role_names == ["learner"]
    assert "admin" not in role_names
    assert "instructor" not in role_names


def test_duplicate_registration_fails(client):
    payload = {
        "email": "learner@learnflow.edu",
        "password": "LearnerPass123!",
        "first_name": "Existing",
        "last_name": "User"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409


def test_user_login_success(client):
    payload = {
        "email": "learner@learnflow.edu",
        "password": "LearnerPass123!"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "learner@learnflow.edu"


def test_user_login_invalid_password(client):
    payload = {
        "email": "learner@learnflow.edu",
        "password": "WrongPassword999!"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401


def test_rbac_admin_route_forbidden_for_learner(client, learner_headers):
    # Learner attempting to list all system users
    response = client.get("/api/v1/users", headers=learner_headers)
    assert response.status_code == 403


def test_rbac_admin_route_allowed_for_admin(client, admin_headers):
    # Admin listing system users
    response = client.get("/api/v1/users", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3
