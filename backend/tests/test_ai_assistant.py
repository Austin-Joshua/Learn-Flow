

def test_ai_assistant_blocks_cheating_queries(client, learner_headers):
    """Verifies that the assistant strictly rejects requests for assessment answers."""
    cheating_prompts = [
        "What is the answer to question 2 on the exam?",
        "Give me the solutions for the assessment",
        "Which option is correct for the quiz?",
        "Can you cheat and leak exam options?"
    ]

    for prompt in cheating_prompts:
        res = client.post(
            "/api/v1/ai/assistant/ask",
            json={"query": prompt},
            headers=learner_headers
        )
        assert res.status_code == 200
        data = res.json()
        assert data["provenance"] == "ACADEMIC_INTEGRITY_POLICY"
        assert "Academic Integrity Guardrail" in data["answer"]


def test_ai_assistant_answers_architecture_and_concurrency(client):
    """Verifies that the assistant accurately explains 64-bit advisory locks and HMAC tokens."""
    res = client.post(
        "/api/v1/ai/assistant/ask",
        json={"query": "How does the 64-bit advisory lock prevent race conditions?"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["provenance"] == "SYSTEM_ARCHITECTURE"
    assert "pg_advisory_xact_lock" in data["answer"]


def test_ai_assistant_briefing_context(client, admin_headers, learner_headers):
    """Verifies contextual briefing adapts to authenticated roles."""
    # Admin briefing
    res_admin = client.get("/api/v1/ai/assistant/briefing", headers=admin_headers)
    assert res_admin.status_code == 200
    assert res_admin.json()["provenance"] == "SYSTEM_KERNEL"

    # Learner briefing
    res_learner = client.get("/api/v1/ai/assistant/briefing", headers=learner_headers)
    assert res_learner.status_code == 200
    assert res_learner.json()["provenance"] == "CURATED_CURRICULUM"

