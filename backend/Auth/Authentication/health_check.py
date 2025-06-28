# health/views.py
from django.http import JsonResponse
from django.db import connection
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import redis
import os
import logging
import time

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    """Health check endpoint for container orchestration."""
    health_status = {
        "status": "healthy",
        "database": "disconnected",
        "redis": "disconnected",
        "timestamp": int(time.time()),
    }

    # Check database connection
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            health_status["database"] = "connected"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        health_status["status"] = "unhealthy"
        health_status["database_error"] = str(e)

    # Check Redis connection
    try:
        redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST", "redis-stack"),
            port=int(os.getenv("REDIS_PORT", 6379)),
            db=int(os.getenv("REDIS_DB", 0)),
            socket_timeout=5,
        )
        redis_client.ping()
        health_status["redis"] = "connected"
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        health_status["redis_error"] = str(e)

    status_code = 200 if health_status["status"] == "healthy" else 503
    return JsonResponse(health_status, status=status_code)


@csrf_exempt
@require_http_methods(["GET"])
def ready_check(request):
    """Readiness check for Kubernetes/Docker."""
    try:
        # Quick database check
        connection.ensure_connection()
        return JsonResponse({"status": "ready"})
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return JsonResponse({"status": "not ready", "error": str(e)}, status=503)


# urls.py (add to your main urls.py)


# Add database connection middleware
class DatabaseConnectionMiddleware:
    """Middleware to handle database connection issues gracefully."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            response = self.get_response(request)
            return response
        except Exception as e:
            if "database" in str(e).lower() or "connection" in str(e).lower():
                logger.error(f"Database connection error: {e}")
                return JsonResponse(
                    {
                        "error": "Database connection error",
                        "message": "Service temporarily unavailable",
                    },
                    status=503,
                )
            raise e
