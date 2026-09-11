package com.solvence.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateObligationRequest(
        @Size(min = 1, max = 100, message = "Obligation name must be between 1 and 100 characters")
        String name,

        @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
        BigDecimal amount,

        @Min(value = 1, message = "Due day must be at least 1")
        @Max(value = 31, message = "Due day must be at most 31")
        Integer dueDay,

        Long categoryId,

        Boolean isActive,

        @Size(max = 255, message = "Notes must not exceed 255 characters")
        String notes
) {
}
