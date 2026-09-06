package com.solvence.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private static final String VALID_SECRET = "test-secret-key-must-be-at-least-32-bytes-long-for-hmac-sha256!";
    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(VALID_SECRET, 3600000); // 1 hour
        jwtService.init();
    }

    @Test
    void testInitFailsWhenSecretTooShort() {
        JwtService shortSecretService = new JwtService("too-short-secret", 3600000);
        IllegalStateException ex = assertThrows(IllegalStateException.class, shortSecretService::init);
        assertTrue(ex.getMessage().contains("at least 256 bits"));
    }

    @Test
    void testInitFailsWhenSecretNullOrEmpty() {
        JwtService emptySecretService = new JwtService("", 3600000);
        assertThrows(IllegalStateException.class, emptySecretService::init);
    }

    @Test
    void testGenerateAndValidateValidToken() {
        String token = jwtService.generateToken(42L, "user@example.com");
        assertNotNull(token);
        assertTrue(jwtService.validateToken(token));
        assertEquals(42L, jwtService.extractUserId(token));
        assertEquals("user@example.com", jwtService.extractEmail(token));
    }

    @Test
    void testValidateTokenWithTamperedSignatureFails() {
        String token = jwtService.generateToken(42L, "user@example.com");
        String tamperedToken = token.substring(0, token.length() - 5) + "abcde";
        assertFalse(jwtService.validateToken(tamperedToken));
    }

    @Test
    void testValidateExpiredTokenFails() {
        // Create service with negative expiration (already expired)
        JwtService expiredService = new JwtService(VALID_SECRET, -1000);
        expiredService.init();

        String token = expiredService.generateToken(42L, "user@example.com");
        assertFalse(expiredService.validateToken(token));
    }

    @Test
    void testGenerateTokenWithNullUserIdThrows() {
        assertThrows(IllegalArgumentException.class, () -> jwtService.generateToken(null, "user@example.com"));
    }

    @Test
    void testGenerateTokenWithNullOrBlankEmailThrows() {
        assertThrows(IllegalArgumentException.class, () -> jwtService.generateToken(42L, null));
        assertThrows(IllegalArgumentException.class, () -> jwtService.generateToken(42L, "   "));
    }
}
