from django.urls import path

from .views import DoctorAnalyticsView, HospitalAnalyticsView

urlpatterns = [
    path("hospital/", HospitalAnalyticsView.as_view(), name="hospital-analytics"),
    path("doctor/", DoctorAnalyticsView.as_view(), name="doctor-analytics"),
]

