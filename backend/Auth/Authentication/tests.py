from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

class UserRegistrationViewTests(APITestCase):
    def test_user_registration_success(self):
        data = {
            "username": "testuser",
            "email": "testuser@example.com",
            "password": "strongpassword123"
        }
        response = self.client.post('/auth/register/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['message'], 'User created successfully')

    def test_user_registration_failure(self):
        data = {
            "username": "",
            "email": "invalidemail",
            "password": "short"
        }
        response = self.client.post('/auth/register/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class UserLoginViewTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="testuser@example.com",
            password="strongpassword123"
        )

    def test_user_login_success(self):
        data = {
            "email": "testuser@example.com",
            "password": "strongpassword123"
        }
        response = self.client.post('/auth/login/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.data)
        self.assertIn('refresh_token', response.data)

    def test_user_login_failure(self):
        data = {
            "email": "testuser@example.com",
            "password": "wrongpassword"
        }
        response = self.client.post('/auth/login/', data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['error'], 'Invalid credentials')

class AuthStatusViewTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="testuser@example.com",
            password="strongpassword123"
        )
        self.refresh = RefreshToken.for_user(self.user)
        self.access_token = str(self.refresh.access_token)

    def test_auth_status_authenticated(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get('/auth/status/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['authenticated'])
        self.assertEqual(response.data['user']['email'], self.user.email)

    def test_auth_status_unauthenticated(self):
        response = self.client.get('/auth/status/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class UserLogoutViewTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="testuser@example.com",
            password="strongpassword123"
        )
        self.refresh = RefreshToken.for_user(self.user)
        self.access_token = str(self.refresh.access_token)
        self.refresh_token = str(self.refresh)

    def test_user_logout_success(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        data = {"refresh_token": self.refresh_token}
        response = self.client.post('/auth/logout/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'User logged out successfully.')

    def test_user_logout_failure_no_token(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.post('/auth/logout/', {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Refresh token is required.')
