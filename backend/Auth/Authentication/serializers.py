from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.core.mail import EmailMultiAlternatives
import os

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration
    """
    password =  serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password']
    
    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password']
        )

        Token.objects.get_or_create(user=user)
        return user
    
class UserLoginSerializer(serializers.Serializer):
    """
    Serializer for user login.
    """
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class PasswordResetRequestSerializer(serializers.Serializer):
    """
    serializer for user password reset request
    """
    email = serializers.EmailField()
    
    def validate_email(self, value):
        """check if the email is valid"""
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No user with this email")

        return value
    
    def save(self):
        email = self.validated_data['email']
        user = User.objects.get(email=email)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5317")
        reset_link = f"{frontend_url}/reset-password/{uid}/{token}"
        
        # Prepare rich HTML email with a reset button
        subject = "Reset Your Password"
        text_content = f"Click the link to reset your password: {reset_link}"
        html_content = f"""
        <html>
          <body style=\"font-family:Arial,sans-serif;line-height:1.6;color:#333;\">
            <h2>Password Reset Request</h2>
            <p>Hi there,</p>
            <p>You recently requested to reset your password for your account. Click the button below to reset it:</p>
            <p><a href=\"{reset_link}\" style=\"display:inline-block;padding:10px 20px;font-size:16px;color:#fff;background-color:#007BFF;text-decoration:none;border-radius:4px;\">Reset Password</a></p>
            <p>If you did not request a password reset, please ignore this email. This link will expire in 1 hour.</p>
            <p>Thanks,<br/>The Support Team</p>
          </body>
        </html>"""
        # Send email
        email_message = EmailMultiAlternatives(subject, text_content, from_email="lewisjassy43@gmail.com.com", to=[email])
        email_message.attach_alternative(html_content, "text/html")
        email_message.send()
        

class PasswordResetConfirmSerializer(serializers.Serializer):
    """serializer for password confirmation"""
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)

    def validate(self, data):
        try:
            uid = urlsafe_base64_decode(data['uid']).decode()
            self.user = User.objects.get(pk=uid)
        except Exception:
            raise serializers.ValidationError("Invalid UID")

        if not default_token_generator.check_token(self.user, data['token']):
            raise serializers.ValidationError("Invalid or expired token")

        return data

    def save(self):
        password = self.validated_data['new_password']
        self.user.set_password(password)
        self.user.save()
