package com.solvence.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.solvence.controller.DecisionController;
import com.solvence.dto.CycleEndProjectionResponse;
import com.solvence.dto.DecisionSummaryResponse;
import com.solvence.dto.RunwaySummaryResponse;
import com.solvence.dto.SpendDecisionRequest;
import com.solvence.dto.SpendDecisionResponse;
import com.solvence.dto.SpendingPaceResponse;
import com.solvence.exception.GlobalExceptionHandler;
import com.solvence.model.decision.DecisionStatus;
import com.solvence.model.decision.PaceStatus;
import com.solvence.service.decision.DecisionEngineService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = DecisionController.class)
@Import({
        SecurityConfig.class,
        RestAuthenticationEntryPoint.class,
        RestAccessDeniedHandler.class,
        JwtAuthenticationFilter.class,
        GlobalExceptionHandler.class
})
class DecisionSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DecisionEngineService decisionEngineService;

    @MockBean
    private JwtService jwtService;

    @Test
    void testUnauthenticatedSpendEvaluationReturns401() throws Exception {
        SpendDecisionRequest request = new SpendDecisionRequest(new BigDecimal("750.00"));

        mockMvc.perform(post("/api/v1/decisions/spend")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.title").value("Unauthorized"));

        verifyNoInteractions(decisionEngineService);
    }

    @Test
    void testUnauthenticatedSpendingPaceReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/decisions/spending-pace"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.status").value(401));

        verifyNoInteractions(decisionEngineService);
    }

    @Test
    void testUnauthenticatedCycleEndProjectionReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/decisions/cycle-end-projection"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.status").value(401));

        verifyNoInteractions(decisionEngineService);
    }

    @Test
    void testUnauthenticatedSummaryReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/decisions/summary"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.status").value(401));

        verifyNoInteractions(decisionEngineService);
    }

    @Test
    void testInvalidTokenReturns401() throws Exception {
        String invalidToken = "invalid.jwt.token";
        when(jwtService.validateToken(invalidToken)).thenReturn(false);

        SpendDecisionRequest request = new SpendDecisionRequest(new BigDecimal("750.00"));

        mockMvc.perform(post("/api/v1/decisions/spend")
                        .header("Authorization", "Bearer " + invalidToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));

        verifyNoInteractions(decisionEngineService);
    }

    @Test
    void testAuthenticatedSpendEvaluationReturns200AndValidStructure() throws Exception {
        String token = "valid-token-user-1";
        when(jwtService.validateToken(token)).thenReturn(true);
        when(jwtService.extractUserId(token)).thenReturn(1L);
        when(jwtService.extractEmail(token)).thenReturn("user1@example.com");

        SpendDecisionResponse mockResponse = new SpendDecisionResponse(
                DecisionStatus.SAFE,
                new BigDecimal("750.00"),
                "INR",
                new BigDecimal("53000.00"),
                new BigDecimal("15000.00"),
                new BigDecimal("38000.00"),
                new BigDecimal("2000.00"),
                19,
                new BigDecimal("37250.00"),
                new BigDecimal("1960.53"),
                new BigDecimal("38000.00"),
                new BigDecimal("2.5"),
                false,
                null,
                "This fits within today's safe spending amount.",
                LocalDate.of(2026, 3, 1),
                LocalDate.of(2026, 3, 31)
        );

        when(decisionEngineService.evaluateSpend(any())).thenReturn(mockResponse);

        SpendDecisionRequest request = new SpendDecisionRequest(new BigDecimal("750.00"));

        mockMvc.perform(post("/api/v1/decisions/spend")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.decision").value("SAFE"))
                .andExpect(jsonPath("$.amount").value(750.00))
                .andExpect(jsonPath("$.currency").value("INR"))
                .andExpect(jsonPath("$.spendingMoney").value(38000.00))
                .andExpect(jsonPath("$.safeToSpendToday").value(2000.00))
                .andExpect(jsonPath("$.hypotheticalSpendingMoney").value(37250.00))
                .andExpect(jsonPath("$.hypotheticalSafeToSpendToday").value(1960.53))
                .andExpect(jsonPath("$.laborCostHours").value(2.5))
                .andExpect(jsonPath("$.isDeficit").value(false))
                .andExpect(jsonPath("$.daysRemaining").value(19));

        verify(decisionEngineService, times(1)).evaluateSpend(any());
    }

    @Test
    void testZeroAmountReturns400ValidationError() throws Exception {
        String token = "valid-token";
        when(jwtService.validateToken(token)).thenReturn(true);
        when(jwtService.extractUserId(token)).thenReturn(1L);
        when(jwtService.extractEmail(token)).thenReturn("user@example.com");

        String json = "{\"amount\": 0.00}";

        mockMvc.perform(post("/api/v1/decisions/spend")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.title").value("Validation Failure"))
                .andExpect(jsonPath("$.invalidFields.amount").exists());

        verifyNoInteractions(decisionEngineService);
    }

    @Test
    void testNegativeAmountReturns400ValidationError() throws Exception {
        String token = "valid-token";
        when(jwtService.validateToken(token)).thenReturn(true);
        when(jwtService.extractUserId(token)).thenReturn(1L);
        when(jwtService.extractEmail(token)).thenReturn("user@example.com");

        String json = "{\"amount\": -50.00}";

        mockMvc.perform(post("/api/v1/decisions/spend")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.title").value("Validation Failure"))
                .andExpect(jsonPath("$.invalidFields.amount").exists());

        verifyNoInteractions(decisionEngineService);
    }

    @Test
    void testMalformedAmountReturns400BadRequest() throws Exception {
        String token = "valid-token";
        when(jwtService.validateToken(token)).thenReturn(true);
        when(jwtService.extractUserId(token)).thenReturn(1L);
        when(jwtService.extractEmail(token)).thenReturn("user@example.com");

        String json = "{\"amount\": \"not-a-number\"}";

        mockMvc.perform(post("/api/v1/decisions/spend")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        verifyNoInteractions(decisionEngineService);
    }

    @Test
    void testEmptyRequestBodyReturns400BadRequest() throws Exception {
        String token = "valid-token";
        when(jwtService.validateToken(token)).thenReturn(true);
        when(jwtService.extractUserId(token)).thenReturn(1L);
        when(jwtService.extractEmail(token)).thenReturn("user@example.com");

        mockMvc.perform(post("/api/v1/decisions/spend")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(""))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(decisionEngineService);
    }

    @Test
    void testExcessiveIntegerDigitsReturns400ValidationError() throws Exception {
        String token = "valid-token";
        when(jwtService.validateToken(token)).thenReturn(true);
        when(jwtService.extractUserId(token)).thenReturn(1L);
        when(jwtService.extractEmail(token)).thenReturn("user@example.com");

        // 13 integer digits (limit is 12)
        String json = "{\"amount\": 1234567890123.00}";

        mockMvc.perform(post("/api/v1/decisions/spend")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.title").value("Validation Failure"))
                .andExpect(jsonPath("$.invalidFields.amount").exists());

        verifyNoInteractions(decisionEngineService);
    }

    @Test
    void testExcessiveDecimalFractionsReturns400ValidationError() throws Exception {
        String token = "valid-token";
        when(jwtService.validateToken(token)).thenReturn(true);
        when(jwtService.extractUserId(token)).thenReturn(1L);
        when(jwtService.extractEmail(token)).thenReturn("user@example.com");

        // 3 decimal places (limit is 2)
        String json = "{\"amount\": 10.999}";

        mockMvc.perform(post("/api/v1/decisions/spend")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.title").value("Validation Failure"))
                .andExpect(jsonPath("$.invalidFields.amount").exists());

        verifyNoInteractions(decisionEngineService);
    }

    @Test
    void testAuthenticatedSpendingPaceReturns200() throws Exception {
        String token = "valid-token";
        when(jwtService.validateToken(token)).thenReturn(true);
        when(jwtService.extractUserId(token)).thenReturn(1L);
        when(jwtService.extractEmail(token)).thenReturn("user@example.com");

        SpendingPaceResponse paceResponse = new SpendingPaceResponse(
                13L,
                19L,
                31L,
                new BigDecimal("12000.00"),
                new BigDecimal("923.08"),
                new BigDecimal("38000.00"),
                new BigDecimal("2000.00"),
                PaceStatus.BELOW_PACE,
                false,
                "Historical daily expenses are below current safe daily capacity."
        );
        when(decisionEngineService.getSpendingPace()).thenReturn(paceResponse);

        mockMvc.perform(get("/api/v1/decisions/spending-pace")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paceStatus").value("BELOW_PACE"))
                .andExpect(jsonPath("$.averageDailyExpensePace").value(923.08))
                .andExpect(jsonPath("$.isAbovePace").value(false));
    }

    @Test
    void testAuthenticatedCycleEndProjectionReturns200() throws Exception {
        String token = "valid-token";
        when(jwtService.validateToken(token)).thenReturn(true);
        when(jwtService.extractUserId(token)).thenReturn(1L);
        when(jwtService.extractEmail(token)).thenReturn("user@example.com");

        CycleEndProjectionResponse projResponse = new CycleEndProjectionResponse(
                new BigDecimal("53000.00"),
                new BigDecimal("15000.00"),
                new BigDecimal("38000.00"),
                false,
                BigDecimal.ZERO,
                LocalDate.of(2026, 3, 1),
                LocalDate.of(2026, 3, 31),
                19,
                "If no additional income or discretionary spending occurs, this is the balance remaining after protected bills."
        );
        when(decisionEngineService.getCycleEndProjection()).thenReturn(projResponse);

        mockMvc.perform(get("/api/v1/decisions/cycle-end-projection")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.projectedCycleEndBalance").value(38000.00))
                .andExpect(jsonPath("$.isDeficit").value(false));
    }

    @Test
    void testAuthenticatedSummaryReturns200() throws Exception {
        String token = "valid-token";
        when(jwtService.validateToken(token)).thenReturn(true);
        when(jwtService.extractUserId(token)).thenReturn(1L);
        when(jwtService.extractEmail(token)).thenReturn("user@example.com");

        RunwaySummaryResponse runway = new RunwaySummaryResponse(
                new BigDecimal("53000.00"), new BigDecimal("15000.00"), new BigDecimal("38000.00"),
                new BigDecimal("2000.00"), 19L, new BigDecimal("300.00"),
                LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 31),
                new BigDecimal("25000.00"), new BigDecimal("40000.00"), new BigDecimal("12000.00")
        );

        SpendingPaceResponse paceResponse = new SpendingPaceResponse(
                13L, 19L, 31L, new BigDecimal("12000.00"), new BigDecimal("923.08"),
                new BigDecimal("38000.00"), new BigDecimal("2000.00"),
                PaceStatus.BELOW_PACE, false, "Pace msg"
        );
        CycleEndProjectionResponse projResponse = new CycleEndProjectionResponse(
                new BigDecimal("53000.00"), new BigDecimal("15000.00"), new BigDecimal("38000.00"),
                false, BigDecimal.ZERO, LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 31),
                19, "Proj msg"
        );
        DecisionSummaryResponse summaryResponse = new DecisionSummaryResponse(
                runway, paceResponse, projResponse
        );

        when(decisionEngineService.getDecisionSummary()).thenReturn(summaryResponse);

        mockMvc.perform(get("/api/v1/decisions/summary")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.runway.liquidCash").value(53000.00))
                .andExpect(jsonPath("$.runway.protectedBills").value(15000.00))
                .andExpect(jsonPath("$.runway.availableCash").value(38000.00))
                .andExpect(jsonPath("$.runway.safeDailySpend").value(2000.00))
                .andExpect(jsonPath("$.spendingPace.paceStatus").value("BELOW_PACE"))
                .andExpect(jsonPath("$.cycleEndProjection.projectedCycleEndBalance").value(38000.00));
    }
}
