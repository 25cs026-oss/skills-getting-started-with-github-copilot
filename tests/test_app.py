import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)


def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    # Should return a dict of activities
    assert isinstance(data, dict)


def test_signup_and_unregister_participant():
    # Choose an activity that exists in the in-memory DB
    activity_name = "Chess Club"
    test_email = "test.participant@example.com"

    # Ensure signup works
    signup_resp = client.post(f"/activities/{activity_name}/signup?email={test_email}")
    assert signup_resp.status_code == 200
    assert "Signed up" in signup_resp.json().get("message", "")

    # Ensure participant is present in activities
    activities_resp = client.get("/activities")
    assert signup_resp.status_code == 200
    activities = activities_resp.json()
    assert test_email in activities[activity_name]["participants"]

    # Now unregister
    unreg_resp = client.delete(f"/activities/{activity_name}/unregister?email={test_email}")
    assert unreg_resp.status_code == 200
    assert "Unregistered" in unreg_resp.json().get("message", "")

    # Verify participant removed
    activities_resp2 = client.get("/activities")
    activities2 = activities_resp2.json()
    assert test_email not in activities2[activity_name]["participants"]
