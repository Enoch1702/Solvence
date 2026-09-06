package com.solvence.dto;

import com.solvence.entity.User;

import java.math.BigDecimal;

public record UserResponse(
        Long id,
        String name,
        String email,
        String currency,
        BigDecimal openingBalance,
        BigDecimal hourlyRate,
        Integer cycleStartDay
) {
    public static UserResponse fromEntity(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getCurrency(),
                user.getOpeningBalance(),
                user.getHourlyRate(),
                user.getCycleStartDay()
        );
    }
}
