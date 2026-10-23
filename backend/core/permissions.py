from rest_framework.permissions import BasePermission, SAFE_METHODS

class RolePermission(BasePermission):
    roles = ()
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.role == "student" and user.tuition_restricted and getattr(view, "requires_learning_access", True):
            return False
        allowed = getattr(view, "roles", self.roles)
        return not allowed or user.role in allowed

class StaffWritePermission(RolePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return super().has_permission(request, view)
        return bool(request.user.is_authenticated and request.user.role in ("director", "admin"))
