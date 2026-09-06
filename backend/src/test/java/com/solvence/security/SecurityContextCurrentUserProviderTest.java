package com.solvence.security;

import com.solvence.exception.UnauthorizedException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

class SecurityContextCurrentUserProviderTest {

    private SecurityContextCurrentUserProvider provider;

    @BeforeEach
    void setUp() {
        provider = new SecurityContextCurrentUserProvider();
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void testGetUserIdWhenAuthenticatedReturnsId() {
        UserPrincipal principal = new UserPrincipal(99L, "auth@example.com");
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(principal, null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);

        assertEquals(99L, provider.getCurrentUserId());
    }

    @Test
    void testGetUserIdWhenUnauthenticatedThrowsUnauthorized() {
        assertThrows(UnauthorizedException.class, () -> provider.getCurrentUserId());
    }

    @Test
    void testGetUserIdWhenPrincipalIsNotUserPrincipalThrowsUnauthorized() {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken("anonymousUser", null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);

        assertThrows(UnauthorizedException.class, () -> provider.getCurrentUserId());
    }

    @Test
    void testGetUserIdWhenPrincipalHasNullIdThrowsUnauthorized() {
        UserPrincipal principal = new UserPrincipal(null, "auth@example.com");
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(principal, null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);

        assertThrows(UnauthorizedException.class, () -> provider.getCurrentUserId());
    }
}
