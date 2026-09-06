package com.solvence.security;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Phase 1 Mock implementation of CurrentUserProvider.
 * Strictly restricted to "test-mock" profile and never active in production.
 */
@Component
@Profile("test-mock")
public class MockCurrentUserProvider implements CurrentUserProvider {

    private static final Long MOCK_USER_ID = 1L;

    @Override
    public Long getCurrentUserId() {
        return MOCK_USER_ID;
    }
}
