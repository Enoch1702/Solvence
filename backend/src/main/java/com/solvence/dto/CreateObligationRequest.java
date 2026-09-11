package com.solvence.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateObligationRequest(
        @NotBlank(message = "Obligation name is required")
        @Size(max = 100, message = "Obligation name must not exceed 100 characters")
        String name,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
        BigDecimal amount,

        @NotNull(message = "Due day is required")
        @Min(value = 1, message = "Due day must be at least 1")
        @Max(value = 31, message = "Due day must be at most 31")
        Integer dueDay,

        @NotNull(message = "Category ID is required")
        Long categoryId,

        @Size(max = 255, message = "Notes must not exceed 255 characters")
        String notes
) {
}
