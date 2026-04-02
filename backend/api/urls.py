from django.urls import path
from .views import UploadDocumentView, verify_connection, DocumentListView, DocumentDetailView, AdminDocumentListView, AdminUserListView, AdminUserDetailView

urlpatterns = [
    path('test/', verify_connection),
    path('documents/', DocumentListView.as_view(), name='document-list'),
    path('documents/<uuid:pk>/', DocumentDetailView.as_view(), name='document-detail'),
    path('upload/', UploadDocumentView.as_view(), name='document-upload'),
    path('admin/users/', AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/users/<uuid:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/documents/', AdminDocumentListView.as_view(), name='admin-doc-list'),
]
