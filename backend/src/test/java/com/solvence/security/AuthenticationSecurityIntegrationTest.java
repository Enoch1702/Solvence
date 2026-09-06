package com.solvence.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.solvence.controller.AuthenticationController;
import com.solvence.controller.HealthController;
import com.solvence.dto.AuthResponse;
import com.solvence.dto.LoginRequest;
import com.solvence.dto.RegisterRequest;
import com.solvence.dto.UserResponse;
import com.solvence.service.AuthenticationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = {AuthenticationController.class, HealthController.class})
@Import({SecurityConfig.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class, JwtAuthenticationFilter.class})
class AuthenticationSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthenticationService authenticationService;

    @MockBean
    private JwtService jwtService;

    @Test
    void testRegisterEndpointPermitAll() throws Exception {
        RegisterRequest request = new RegisterRequest("Test User", "test@example.com", "Password123!");
        UserResponse userResponse = new UserResponse(1L, "Test User", "test@example.com", "INR", BigDecimal.ZERO, null, 1);
        AuthResponse authResponse = new AuthResponse("valid-token", userResponse);

        when(authenticationService.register(any())).thenReturn(authResponse);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("valid-token"))
                .andExpect(jsonPath("$.user.email").value("test@example.com"));
    }

    @Test
    void testLoginEndpointPermitAll() throws Exception {
        LoginRequest request = new LoginRequest("test@example.com", "Password123!");
        UserResponse userResponse = new UserResponse(1L, "Test User", "test@example.com", "INR", BigDecimal.ZERO, null, 1);
        AuthResponse authResponse = new AuthResponse("login-token", userResponse);

        when(authenticationService.login(any())).thenReturn(authResponse);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("login-token"))
                .andExpect(jsonPath("$.user.id").value(1));
    }

    @Test
    void testHealthEndpointPermitAll() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void testGetMeWithoutTokenReturns401ProblemDetail() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.title").value("Unauthorized"))
                .andExpect(jsonPath("$.instance").value("/api/v1/auth/me"));
    }

    @Test
    void testGetMeWithValidTokenReturnsUser() throws Exception {
        String token = "valid-mock-jwt-token";
        when(jwtService.validateToken(token)).thenReturn(true);
        when(jwtService.extractUserId(token)).thenReturn(10L);
        when(jwtService.extractEmail(token)).thenReturn("user@example.com");

        UserResponse userResponse = new UserResponse(10L, "Profile User", "user@example.com", "INR", BigDecimal.ZERO, null, 1);
        when(authenticationService.getCurrentUserProfile()).thenReturn(userResponse);

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.email").value("user@example.com"))
                .andExpect(jsonPath("$.name").value("Profile User"));
    }

    @Test
    void testGetMeWithInvalidTokenReturns401ProblemDetail() throws Exception {
        String invalidToken = "invalid-token";
        when(jwtService.validateToken(invalidToken)).thenReturn(false);

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + invalidToken))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.title").value("Unauthorized"));
    }
}
