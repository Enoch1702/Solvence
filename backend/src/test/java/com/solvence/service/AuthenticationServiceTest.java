package com.solvence.service;

import com.solvence.dto.AuthResponse;
import com.solvence.dto.LoginRequest;
import com.solvence.dto.RegisterRequest;
import com.solvence.dto.UserResponse;
import com.solvence.entity.User;
import com.solvence.exception.BusinessValidationException;
import com.solvence.repository.UserRepository;
import com.solvence.security.CurrentUserProvider;
import com.solvence.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private CurrentUserProvider currentUserProvider;

    private AuthenticationService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthenticationService(userRepository, passwordEncoder, jwtService, currentUserProvider);
    }

    @Test
    void testRegisterSuccess() {
        RegisterRequest request = new RegisterRequest("Test User", "TEST@Example.com", "Password123!");
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password123!")).thenReturn("hashed_pwd_123");

        User savedUser = new User(10L, "Test User", "test@example.com", "hashed_pwd_123", "INR", BigDecimal.ZERO, null, 1);
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtService.generateToken(10L, "test@example.com")).thenReturn("mock-jwt-token");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("mock-jwt-token", response.token());
        assertEquals(10L, response.user().id());
        assertEquals("test@example.com", response.user().email());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void testRegisterDuplicateEmailThrowsValidationException() {
        RegisterRequest request = new RegisterRequest("Test User", "duplicate@example.com", "Password123!");
        when(userRepository.existsByEmail("duplicate@example.com")).thenReturn(true);

        assertThrows(BusinessValidationException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void testLoginSuccess() {
        LoginRequest request = new LoginRequest("USER@example.com", "Password123!");
        User user = new User(5L, "Existing User", "user@example.com", "hashed_pwd_abc", "INR", BigDecimal.ZERO, null, 1);

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password123!", "hashed_pwd_abc")).thenReturn(true);
        when(jwtService.generateToken(5L, "user@example.com")).thenReturn("mock-jwt-login-token");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mock-jwt-login-token", response.token());
        assertEquals(5L, response.user().id());
    }

    @Test
    void testLoginWrongPasswordThrowsBadCredentials() {
        LoginRequest request = new LoginRequest("user@example.com", "WrongPassword!");
        User user = new User(5L, "Existing User", "user@example.com", "hashed_pwd_abc", "INR", BigDecimal.ZERO, null, 1);

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("WrongPassword!", "hashed_pwd_abc")).thenReturn(false);

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
        verify(jwtService, never()).generateToken(any(), any());
    }

    @Test
    void testLoginNonExistentEmailThrowsBadCredentials() {
        LoginRequest request = new LoginRequest("unknown@example.com", "Password123!");
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    void testGetCurrentUserProfile() {
        when(currentUserProvider.getCurrentUserId()).thenReturn(5L);
        User user = new User(5L, "Existing User", "user@example.com", "hashed_pwd_abc", "INR", BigDecimal.ZERO, null, 1);
        when(userRepository.findById(5L)).thenReturn(Optional.of(user));

        UserResponse profile = authService.getCurrentUserProfile();

        assertNotNull(profile);
        assertEquals(5L, profile.id());
        assertEquals("user@example.com", profile.email());
    }
}
