package com.solvence.dto;

public record AuthResponse(
        String token,
        UserResponse user
) {
}
