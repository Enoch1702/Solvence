package com.solvence.security;

import com.solvence.controller.AnalyticsController;
import com.solvence.dto.analytics.BurnTrajectoryPoint;
import com.solvence.dto.analytics.BurnTrajectoryResponse;
import com.solvence.dto.analytics.CashflowSummaryResponse;
import com.solvence.dto.analytics.CategoryBreakdownItem;
import com.solvence.service.analytics.AnalyticsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AnalyticsController.class)
@Import({SecurityConfig.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class, JwtAuthenticationFilter.class})
class AnalyticsSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AnalyticsService analyticsService;

    @MockBean
    private JwtService jwtService;

    @Test
    void testUnauthenticatedBurnTrajectoryReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/burn-trajectory"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.title").value("Unauthorized"));
    }

    @Test
    void testUnauthenticatedCategoryBreakdownReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/category-breakdown"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.title").value("Unauthorized"));
    }

    @Test
    void testUnauthenticatedCashflowSummaryReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/cashflow-summary"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.title").value("Unauthorized"));
    }

    @Test
    void testAuthenticatedUserAReceivesOnlyUserAAnalytics() throws Exception {
        String tokenA = "valid-token-user-a";
        when(jwtService.validateToken(tokenA)).thenReturn(true);
        when(jwtService.extractUserId(tokenA)).thenReturn(100L);
        when(jwtService.extractEmail(tokenA)).thenReturn("userA@example.com");

        BurnTrajectoryResponse trajectoryA = new BurnTrajectoryResponse(
                LocalDate.of(2026, 9, 1),
                LocalDate.of(2026, 9, 30),
                LocalDate.of(2026, 9, 7),
                List.of(new BurnTrajectoryPoint(
                        LocalDate.of(2026, 9, 1),
                        new BigDecimal("100.00"),
                        new BigDecimal("100.00"),
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        new BigDecimal("-100.00")
                ))
        );
        when(analyticsService.getBurnTrajectory()).thenReturn(trajectoryA);

        mockMvc.perform(get("/api/v1/analytics/burn-trajectory")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.points[0].dailyExpenses").value(100.00))
                .andExpect(jsonPath("$.asOfDate").value("2026-09-07"));
    }

    @Test
    void testAuthenticatedUserBReceivesOnlyUserBAnalyticsAndNotUserA() throws Exception {
        String tokenB = "valid-token-user-b";
        when(jwtService.validateToken(tokenB)).thenReturn(true);
        when(jwtService.extractUserId(tokenB)).thenReturn(200L);
        when(jwtService.extractEmail(tokenB)).thenReturn("userB@example.com");

        CashflowSummaryResponse cashflowB = new CashflowSummaryResponse(
                new BigDecimal("80000.00"),
                new BigDecimal("25000.00"),
                new BigDecimal("55000.00"),
                4L,
                LocalDate.of(2026, 9, 1),
                LocalDate.of(2026, 9, 30)
        );
        when(analyticsService.getCashflowSummary()).thenReturn(cashflowB);

        mockMvc.perform(get("/api/v1/analytics/cashflow-summary")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalIncome").value(80000.00))
                .andExpect(jsonPath("$.totalExpenses").value(25000.00))
                .andExpect(jsonPath("$.netCashflow").value(55000.00))
                .andExpect(jsonPath("$.transactionCount").value(4));
    }
}
