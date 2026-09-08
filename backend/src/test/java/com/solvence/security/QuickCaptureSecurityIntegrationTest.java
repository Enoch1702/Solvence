package com.solvence.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.solvence.controller.TransactionController;
import com.solvence.dto.QuickCaptureRequest;
import com.solvence.dto.TransactionResponse;
import com.solvence.entity.TransactionType;
import com.solvence.exception.ForbiddenException;
import com.solvence.service.QuickCaptureParserService;
import com.solvence.service.TransactionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = TransactionController.class)
@Import({SecurityConfig.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class, JwtAuthenticationFilter.class})
class QuickCaptureSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TransactionService transactionService;

    @MockBean
    private QuickCaptureParserService quickCaptureParserService;

    @MockBean
    private JwtService jwtService;

    @Test
    void testUnauthenticatedQuickCaptureReturns401() throws Exception {
        QuickCaptureRequest request = new QuickCaptureRequest("450 lunch food yesterday");

        mockMvc.perform(post("/api/v1/transactions/quick-capture")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.title").value("Unauthorized"));
    }

    @Test
    void testInvalidTokenQuickCaptureReturns401() throws Exception {
        String invalidToken = "invalid-token";
        when(jwtService.validateToken(invalidToken)).thenReturn(false);

        QuickCaptureRequest request = new QuickCaptureRequest("450 lunch food yesterday");

        mockMvc.perform(post("/api/v1/transactions/quick-capture")
                        .header("Authorization", "Bearer " + invalidToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.title").value("Unauthorized"));
    }

    @Test
    void testAuthenticatedQuickCaptureSuccessfullyCreatesTransaction() throws Exception {
        String tokenA = "valid-token-user-a";
        when(jwtService.validateToken(tokenA)).thenReturn(true);
        when(jwtService.extractUserId(tokenA)).thenReturn(100L);
        when(jwtService.extractEmail(tokenA)).thenReturn("userA@example.com");

        TransactionResponse response = new TransactionResponse(
                55L,
                new BigDecimal("450.00"),
                TransactionType.EXPENSE,
                1L,
                "Food",
                "food",
                "lunch",
                LocalDate.of(2026, 9, 7),
                new BigDecimal("1.50"),
                Instant.now()
        );

        when(quickCaptureParserService.parseAndCreate("450 lunch food yesterday")).thenReturn(response);

        QuickCaptureRequest request = new QuickCaptureRequest("450 lunch food yesterday");

        mockMvc.perform(post("/api/v1/transactions/quick-capture")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(55))
                .andExpect(jsonPath("$.amount").value(450.00))
                .andExpect(jsonPath("$.categoryName").value("Food"))
                .andExpect(jsonPath("$.description").value("lunch"));
    }

    @Test
    void testCrossUserCategoryRejectionReturns403() throws Exception {
        String tokenA = "valid-token-user-a";
        when(jwtService.validateToken(tokenA)).thenReturn(true);
        when(jwtService.extractUserId(tokenA)).thenReturn(100L);
        when(jwtService.extractEmail(tokenA)).thenReturn("userA@example.com");

        when(quickCaptureParserService.parseAndCreate(any()))
                .thenThrow(new ForbiddenException("Cannot use category belonging to another user"));

        QuickCaptureRequest request = new QuickCaptureRequest("500 membership otherusergym");

        mockMvc.perform(post("/api/v1/transactions/quick-capture")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.title").value("Forbidden"));
    }
}
