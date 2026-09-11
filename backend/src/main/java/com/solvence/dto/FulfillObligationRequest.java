package com.solvence.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record FulfillObligationRequest(
        LocalDate paymentDate,
        BigDecimal paymentAmount
) {
}
