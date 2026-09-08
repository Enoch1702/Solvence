package com.solvence.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record QuickCaptureRequest(
        @NotBlank(message = "Command input is required")
        @Size(max = 255, message = "Command input must not exceed 255 characters")
        String input
) {
}
