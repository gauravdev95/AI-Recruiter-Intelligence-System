"""Auth endpoint tests: register, login, refresh rotation, logout, /me."""

from __future__ import annotations

from fastapi.testclient import TestClient
from httpx import Response

REGISTER_PAYLOAD = {
    "email": "auth.tester@example.com",
    "password": "supersecret123",
    "role": "candidate",
    "full_name": "Auth Tester",
}


def _register(client: TestClient, **overrides) -> Response:
    payload = {**REGISTER_PAYLOAD, **overrides}
    return client.post("/api/v1/auth/register", json=payload)


def test_register_returns_201_and_sets_cookies(client: TestClient) -> None:
    response = _register(client)
    assert response.status_code == 201

    body = response.json()
    assert body["access_token"]
    assert body["token_type"] == "bearer"
    assert body["expires_in"] > 0
    assert body["user"]["email"] == REGISTER_PAYLOAD["email"]
    assert body["user"]["role"] == "candidate"
    assert body["user"]["is_active"] is True

    assert response.cookies.get("refresh_token")
    assert response.cookies.get("csrf_token")
    set_cookie = response.headers.get("set-cookie", "").lower()
    assert "httponly" in set_cookie  # refresh cookie must be httpOnly


def test_register_duplicate_email_returns_409_email_taken(client: TestClient) -> None:
    assert _register(client).status_code == 201
    response = _register(client)
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "EMAIL_TAKEN"


def test_register_invalid_role_returns_422(client: TestClient) -> None:
    response = _register(client, email="other@example.com", role="admin")
    assert response.status_code == 422


def test_login_success_returns_200(client: TestClient) -> None:
    assert _register(client).status_code == 201
    response = client.post(
        "/api/v1/auth/login",
        json={"email": REGISTER_PAYLOAD["email"], "password": REGISTER_PAYLOAD["password"]},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["access_token"]
    assert body["user"]["email"] == REGISTER_PAYLOAD["email"]


def test_login_remember_me_sets_persistent_cookie(client: TestClient) -> None:
    assert _register(client).status_code == 201
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": REGISTER_PAYLOAD["email"],
            "password": REGISTER_PAYLOAD["password"],
            "remember_me": True,
        },
    )
    assert response.status_code == 200
    assert "max-age=" in response.headers.get("set-cookie", "").lower()


def test_login_wrong_password_returns_401_invalid_credentials(client: TestClient) -> None:
    assert _register(client).status_code == 201
    response = client.post(
        "/api/v1/auth/login",
        json={"email": REGISTER_PAYLOAD["email"], "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "INVALID_CREDENTIALS"


def test_me_without_token_returns_401_unauthenticated(client: TestClient) -> None:
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHENTICATED"


def test_me_with_bearer_token_returns_user(client: TestClient) -> None:
    register_response = _register(client)
    access_token = register_response.json()["access_token"]

    response = client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == REGISTER_PAYLOAD["email"]


def test_refresh_rotates_token_and_rejects_old_one(client: TestClient) -> None:
    register_response = _register(client)
    old_refresh = register_response.cookies.get("refresh_token")
    old_csrf = register_response.cookies.get("csrf_token")
    assert old_refresh and old_csrf

    old_cookies = {"refresh_token": old_refresh, "csrf_token": old_csrf}
    headers = {"X-CSRF-Token": old_csrf}

    refresh_response = client.post("/api/v1/auth/refresh", cookies=old_cookies, headers=headers)
    assert refresh_response.status_code == 200
    assert refresh_response.json()["access_token"]
    new_refresh = refresh_response.cookies.get("refresh_token")
    assert new_refresh and new_refresh != old_refresh

    # The rotated-out token must no longer work.
    replay_response = client.post("/api/v1/auth/refresh", cookies=old_cookies, headers=headers)
    assert replay_response.status_code == 401
    assert replay_response.json()["error"]["code"] == "INVALID_REFRESH_TOKEN"


def test_logout_clears_cookies(client: TestClient) -> None:
    register_response = _register(client)
    cookies = {
        "refresh_token": register_response.cookies.get("refresh_token"),
        "csrf_token": register_response.cookies.get("csrf_token"),
    }
    headers = {"X-CSRF-Token": register_response.cookies.get("csrf_token")}

    response = client.post("/api/v1/auth/logout", cookies=cookies, headers=headers)
    assert response.status_code == 200
    assert response.json() == {"message": "Logged out successfully."}
    set_cookie = response.headers.get("set-cookie", "")
    assert "Max-Age=0" in set_cookie
