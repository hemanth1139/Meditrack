from django.urls import path

from .views import (
    AdminDashboardStatsView,
    HospitalAdminDashboardStatsView,
    DoctorDashboardStatsView,
    StaffDashboardStatsView,
    PatientDashboardStatsView,
    DoctorAnalyticsView,
    HospitalAnalyticsView,
)

urlpatterns = [
    # New Dashboard stats endpoints
    path("admin/stats/", AdminDashboardStatsView.as_view(), name="admin-dashboard-stats"),
    path("hospital-admin/stats/", HospitalAdminDashboardStatsView.as_view(), name="hospital-admin-dashboard-stats"),
    path("doctor/stats/", DoctorDashboardStatsView.as_view(), name="doctor-dashboard-stats"),
    path("staff/stats/", StaffDashboardStatsView.as_view(), name="staff-dashboard-stats"),
    path("patient/stats/", PatientDashboardStatsView.as_view(), name="patient-dashboard-stats"),

    # Legacy analytics endpoints
    path("hospital/", HospitalAnalyticsView.as_view(), name="hospital-dashboard"),
    path("doctor/", DoctorAnalyticsView.as_view(), name="doctor-dashboard"),
]

