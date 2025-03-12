from .models import CustomUser
from rest_framework import serializers


class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["name", "email", "date_joined"]


class UserCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["name", "email", "password"]

    def create(self, validated_data):
        user = CustomUser(email=validated_data["email"], name=validated_data["name"])
        user.set_password(validated_data["password"])
        user.save()
        return user
