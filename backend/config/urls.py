from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenRefreshView
from django.http import JsonResponse
from core.views import StaffLoginView, StudentLoginView, LogoutView, MeView, PasswordChangeView
urlpatterns = [path("", lambda request: JsonResponse({"service": "Avlod Ta'lim API", "api": "/api/v1/", "docs": "/api/docs/", "schema": "/api/schema/"})), path("admin/", admin.site.urls), path("api/v1/auth/staff/login/", StaffLoginView.as_view()), path("api/v1/auth/student/login/", StudentLoginView.as_view()), path("api/v1/auth/token/refresh/", TokenRefreshView.as_view()), path("api/v1/auth/logout/", LogoutView.as_view()), path("api/v1/auth/me/", MeView.as_view()), path("api/v1/auth/password/change/", PasswordChangeView.as_view()), path("api/v1/", include("core.urls")), path("api/schema/", SpectacularAPIView.as_view(), name="schema"), path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui")]
