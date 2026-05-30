.PHONY: dev backend frontend test

dev:
	@echo "Starting DevScore API on http://localhost:8000"
	@echo "Starting DevScore frontend on http://localhost:5173"
	@(cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000) & \
	BACKEND_PID=$$!; \
	trap 'kill $$BACKEND_PID 2>/dev/null' INT TERM EXIT; \
	sleep 2 && \
	cd frontend && npm run dev -- --host 0.0.0.0

backend:
	cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000

frontend:
	cd frontend && npm run dev -- --host 0.0.0.0

test:
	pytest tests/test_api.py -v