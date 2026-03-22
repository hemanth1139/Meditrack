from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.response import Response


def custom_exception_handler(exc, context):
    """
    Wrap all error responses into unified format:
    {"success": false, "data": null, "message": "..."}
    """
    response = drf_exception_handler(exc, context)
    if response is None:
        return Response(
            {"success": False, "data": None, "message": str(exc)},
            status=500,
        )
    message = ""
    if isinstance(response.data, dict):
        message = "; ".join(f"{k}: {v}" for k, v in response.data.items())
    else:
        message = str(response.data)
    return Response(
        {"success": False, "data": response.data, "message": message},
        status=response.status_code,
    )

