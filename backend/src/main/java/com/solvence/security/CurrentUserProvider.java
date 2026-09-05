package com.solvence.security;

/**
 * Abstraction for retrieving the current authenticated user's ID.
 * Decouples business/domain services from Spring Security for Phase 1.
 */
public interface CurrentUserProvider {
    Long getCurrentUserId();
}
