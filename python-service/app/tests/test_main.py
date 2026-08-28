"""Tests for the FastAPI endpoints.

The ``/rerank`` endpoint is tested with an injected fake scorer, and the failure
path is tested by leaving no scorer available — so no model is ever downloaded.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app, set_scorer
from app.tests.conftest import KeywordOverlapScorer


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_scorer():
    """Keep scorer state from leaking between tests."""
    set_scorer(None)
    yield
    set_scorer(None)


class TestHealth:
    def test_reports_ok(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    def test_does_not_load_the_reranker(self, client):
        assert client.get("/health").json()["reranker_loaded"] is False

    def test_reports_mocked_embeddings_when_unkeyed(self, client, monkeypatch):
        monkeypatch.delenv("VOYAGE_API_KEY", raising=False)
        assert client.get("/health").json()["embeddings_mocked"] is True


class TestChunk:
    def test_chunks_text(self, client):
        response = client.post("/chunk", json={"text": "Mitochondria make ATP."})
        assert response.status_code == 200
        body = response.json()
        assert body["count"] == 1
        assert body["chunks"][0]["text"] == "Mitochondria make ATP."
        assert body["chunks"][0]["position"] == 0

    def test_long_text_produces_several_chunks(self, client):
        response = client.post("/chunk", json={"text": "word " * 2000})
        assert response.json()["count"] > 1

    def test_empty_text_produces_no_chunks(self, client):
        response = client.post("/chunk", json={"text": ""})
        assert response.json() == {"chunks": [], "count": 0}

    def test_missing_text_field_is_a_validation_error(self, client):
        assert client.post("/chunk", json={}).status_code == 422


class TestSearch:
    def test_returns_ranked_results(self, client):
        response = client.post(
            "/search",
            json={
                "query": "mitochondria atp",
                "documents": [
                    "Chloroplasts do photosynthesis.",
                    "Mitochondria make ATP.",
                    "Ribosomes build proteins.",
                ],
                "top_k": 2,
            },
        )
        assert response.status_code == 200
        results = response.json()["results"]
        assert len(results) == 2
        assert "Mitochondria" in results[0]["text"]

    def test_top_k_limits_the_result_count(self, client):
        response = client.post(
            "/search",
            json={"query": "q", "documents": ["a", "b", "c", "d"], "top_k": 2},
        )
        assert len(response.json()["results"]) == 2

    def test_index_maps_back_to_the_input_documents(self, client):
        docs = ["Chloroplasts.", "Mitochondria make ATP.", "Ribosomes."]
        response = client.post(
            "/search", json={"query": "mitochondria atp", "documents": docs, "top_k": 3}
        )
        for result in response.json()["results"]:
            assert docs[result["index"]] == result["text"]

    def test_scores_are_descending(self, client):
        response = client.post(
            "/search",
            json={"query": "mitochondria", "documents": ["a b", "mitochondria", "c d"], "top_k": 3},
        )
        scores = [r["score"] for r in response.json()["results"]]
        assert scores == sorted(scores, reverse=True)

    def test_empty_documents_is_a_validation_error(self, client):
        response = client.post("/search", json={"query": "q", "documents": [], "top_k": 1})
        assert response.status_code == 422

    def test_zero_top_k_is_a_validation_error(self, client):
        response = client.post("/search", json={"query": "q", "documents": ["a"], "top_k": 0})
        assert response.status_code == 422


class TestRerank:
    def test_reranks_with_the_injected_scorer(self, client):
        set_scorer(KeywordOverlapScorer())
        response = client.post(
            "/rerank",
            json={
                "query": "mitochondria atp",
                "candidates": ["unrelated filler text", "mitochondria atp powerhouse"],
                "top_k": 2,
            },
        )
        assert response.status_code == 200
        results = response.json()["results"]
        assert "mitochondria" in results[0]["text"]

    def test_top_k_truncates(self, client):
        set_scorer(KeywordOverlapScorer())
        response = client.post(
            "/rerank",
            json={"query": "q", "candidates": ["a", "b", "c"], "top_k": 1},
        )
        assert len(response.json()["results"]) == 1

    def test_index_maps_back_to_input_order(self, client):
        set_scorer(KeywordOverlapScorer())
        candidates = ["nothing here", "the query words"]
        response = client.post(
            "/rerank",
            json={"query": "the query words", "candidates": candidates, "top_k": 2},
        )
        for result in response.json()["results"]:
            assert candidates[result["index"]] == result["text"]

    def test_unavailable_model_returns_503_not_a_silent_fallback(self, client, monkeypatch):
        """A missing re-ranker must be an explicit error, not an unranked order."""
        monkeypatch.setenv("RERANKER_MODEL", "definitely-not-a-real-model-xyz")
        response = client.post(
            "/rerank", json={"query": "q", "candidates": ["a", "b"], "top_k": 2}
        )
        assert response.status_code == 503
        assert "unavailable" in response.json()["detail"]

    def test_empty_candidates_is_a_validation_error(self, client):
        set_scorer(KeywordOverlapScorer())
        response = client.post("/rerank", json={"query": "q", "candidates": [], "top_k": 1})
        assert response.status_code == 422
