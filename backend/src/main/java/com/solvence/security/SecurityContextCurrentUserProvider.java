package com.solvence.security;

import com.solvence.exception.UnauthorizedException;
import org.springframework.context.annotation.Primary;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Production implementation of CurrentUserProvider.
 * Resolves the authenticated user's ID strictly from the Spring SecurityContext.
 * Fails closed: throws UnauthorizedException if unauthenticated.
 * NEVER falls back to user ID 1 or any other default.
 */
@Component
@Primary
public class SecurityContextCurrentUserProvider implements CurrentUserProvider {

    @Override
    public Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("No authenticated user found in security context.");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof UserPrincipal userPrincipal) {
            Long userId = userPrincipal.id();
            if (userId != null) {
                return userId;
            }
        }

        throw new UnauthorizedException("Authenticated principal does not contain a valid user identity.");
    }
}
