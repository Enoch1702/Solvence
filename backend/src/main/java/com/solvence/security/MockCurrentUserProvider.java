package com.solvence.security;

import org.springframework.stereotype.Component;

/**
 * Phase 1 Mock implementation of CurrentUserProvider.
 * Always returns user ID 1L.
 * Will be replaced with real JWT-backed security in Phase 2.
 */
@Component
public class MockCurrentUserProvider implements CurrentUserProvider {

    private static final Long MOCK_USER_ID = 1L;

    @Override
    public Long getCurrentUserId() {
        return MOCK_USER_ID;
    }
}
