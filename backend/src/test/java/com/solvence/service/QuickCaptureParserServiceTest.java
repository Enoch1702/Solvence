package com.solvence.service;

import com.solvence.dto.CreateTransactionRequest;
import com.solvence.dto.ParsedQuickCapture;
import com.solvence.dto.TransactionResponse;
import com.solvence.entity.Category;
import com.solvence.entity.TransactionType;
import com.solvence.entity.User;
import com.solvence.exception.BusinessValidationException;
import com.solvence.repository.CategoryRepository;
import com.solvence.security.CurrentUserProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QuickCaptureParserServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private CurrentUserProvider currentUserProvider;

    @Mock
    private TransactionService transactionService;

    private Clock fixedClock;
    private QuickCaptureParserService parserService;

    private Category foodCategory;
    private Category rentCategory;
    private Category salaryCategory;
    private Category customGymCategory;

    private final LocalDate fixedToday = LocalDate.of(2026, 9, 8);

    @BeforeEach
    void setUp() {
        fixedClock = Clock.fixed(Instant.parse("2026-09-08T12:00:00Z"), ZoneId.of("UTC"));

        parserService = new QuickCaptureParserService(
                categoryRepository,
                currentUserProvider,
                transactionService,
                fixedClock
        );

        lenient().when(currentUserProvider.getCurrentUserId()).thenReturn(1L);

        // System categories
        foodCategory = new Category(1L, null, "Food", TransactionType.EXPENSE, true, "food");
        rentCategory = new Category(2L, null, "Rent", TransactionType.EXPENSE, true, "rent");
        salaryCategory = new Category(3L, null, "Salary", TransactionType.INCOME, false, "salary");

        // Custom category owned by User 1
        User user1 = new User(1L, "User 1", "user1@test.com", "hash", "INR", BigDecimal.ZERO, null, 1);
        customGymCategory = new Category(10L, user1, "Gym", TransactionType.EXPENSE, false, "gym");

        // Default accessible categories for User 1
        lenient().when(categoryRepository.findAccessibleCategories(1L))
                .thenReturn(List.of(foodCategory, rentCategory, salaryCategory, customGymCategory));
    }

    @Test
    void testBasicExpenseCommand() {
        ParsedQuickCapture result = parserService.parse("450 lunch food");

        assertEquals(new BigDecimal("450"), result.amount());
        assertEquals(TransactionType.EXPENSE, result.type());
        assertEquals("Food", result.category().getName());
        assertEquals("lunch", result.description());
        assertEquals(fixedToday, result.transactionDate());
    }

    @Test
    void testRelativeDateYesterday() {
        ParsedQuickCapture result = parserService.parse("450 lunch food yesterday");

        assertEquals(new BigDecimal("450"), result.amount());
        assertEquals(TransactionType.EXPENSE, result.type());
        assertEquals("Food", result.category().getName());
        assertEquals("lunch", result.description());
        assertEquals(fixedToday.minusDays(1), result.transactionDate());
    }

    @Test
    void testRelativeDateToday() {
        ParsedQuickCapture result = parserService.parse("450 lunch food today");

        assertEquals(new BigDecimal("450"), result.amount());
        assertEquals(TransactionType.EXPENSE, result.type());
        assertEquals("Food", result.category().getName());
        assertEquals("lunch", result.description());
        assertEquals(fixedToday, result.transactionDate());
    }

    @Test
    void testMultiWordDescription() {
        ParsedQuickCapture result = parserService.parse("850 dinner with friends food yesterday");

        assertEquals(new BigDecimal("850"), result.amount());
        assertEquals(TransactionType.EXPENSE, result.type());
        assertEquals("Food", result.category().getName());
        assertEquals("dinner with friends", result.description());
        assertEquals(fixedToday.minusDays(1), result.transactionDate());
    }

    @Test
    void testDecimalAmount() {
        ParsedQuickCapture result = parserService.parse("450.50 lunch food");

        assertEquals(new BigDecimal("450.50"), result.amount());
        assertEquals("lunch", result.description());
    }

    @Test
    void testCommaAmount() {
        ParsedQuickCapture result = parserService.parse("1,500 rent");

        assertEquals(new BigDecimal("1500"), result.amount());
        assertEquals("Rent", result.category().getName());
        assertEquals("Rent", result.description(), "Defaults to category name if no description tokens remain");
    }

    @Test
    void testCaseInsensitiveCategory() {
        ParsedQuickCapture result = parserService.parse("450 lunch FOOD");

        assertEquals("Food", result.category().getName());
        assertEquals("lunch", result.description());
    }

    @Test
    void testIncomeSyntax() {
        ParsedQuickCapture result = parserService.parse("income 50000 salary today");

        assertEquals(new BigDecimal("50000"), result.amount());
        assertEquals(TransactionType.INCOME, result.type());
        assertEquals("Salary", result.category().getName());
        assertEquals(fixedToday, result.transactionDate());
    }

    @Test
    void testUserOwnedCustomCategoryResolution() {
        ParsedQuickCapture result = parserService.parse("2000 membership gym yesterday");

        assertEquals(new BigDecimal("2000"), result.amount());
        assertEquals("Gym", result.category().getName());
        assertEquals(10L, result.category().getId());
        assertEquals("membership", result.description());
    }

    @Test
    void testCrossUserCategoryRejection() {
        // User 2's category is not in findAccessibleCategories(1L)
        assertThrows(BusinessValidationException.class, () ->
                parserService.parse("500 subscription netflix")
        );
    }

    @Test
    void testMissingAmountThrowsException() {
        BusinessValidationException ex = assertThrows(BusinessValidationException.class, () ->
                parserService.parse("lunch food yesterday")
        );
        assertTrue(ex.getMessage().contains("Enter an amount"));
    }

    @Test
    void testZeroAmountThrowsException() {
        BusinessValidationException ex = assertThrows(BusinessValidationException.class, () ->
                parserService.parse("0 lunch food")
        );
        assertTrue(ex.getMessage().contains("greater than zero"));
    }

    @Test
    void testNegativeAmountThrowsException() {
        assertThrows(BusinessValidationException.class, () ->
                parserService.parse("-50 lunch food")
        );
    }

    @Test
    void testMultipleAmountsThrowsAmbiguityException() {
        BusinessValidationException ex = assertThrows(BusinessValidationException.class, () ->
                parserService.parse("450 500 lunch food")
        );
        assertTrue(ex.getMessage().contains("multiple amounts"));
    }

    @Test
    void testUnknownCategoryThrowsException() {
        BusinessValidationException ex = assertThrows(BusinessValidationException.class, () ->
                parserService.parse("450 lunch unknowncat")
        );
        assertTrue(ex.getMessage().contains("Could not match any available category"));
    }

    @Test
    void testInvalidDateTokenThrowsException() {
        BusinessValidationException ex = assertThrows(BusinessValidationException.class, () ->
                parserService.parse("450 lunch food nextish")
        );
        assertTrue(ex.getMessage().contains("could not understand the date expression"));
    }

    @Test
    void testEmptyInputThrowsException() {
        assertThrows(BusinessValidationException.class, () ->
                parserService.parse("   ")
        );
    }

    @Test
    void testExcessivelyLongInputThrowsException() {
        String longInput = "450 " + "a".repeat(260) + " food";
        assertThrows(BusinessValidationException.class, () ->
                parserService.parse(longInput)
        );
    }

    @Test
    void testParseAndCreateDelegatesToTransactionService() {
        TransactionResponse mockResponse = new TransactionResponse(
                100L,
                new BigDecimal("450.00"),
                TransactionType.EXPENSE,
                1L,
                "Food",
                "food",
                "lunch",
                fixedToday.minusDays(1),
                new BigDecimal("1.5"),
                Instant.now()
        );
        when(transactionService.createTransaction(any())).thenReturn(mockResponse);

        TransactionResponse response = parserService.parseAndCreate("450 lunch food yesterday");

        assertNotNull(response);
        assertEquals(100L, response.id());

        ArgumentCaptor<CreateTransactionRequest> captor = ArgumentCaptor.forClass(CreateTransactionRequest.class);
        verify(transactionService).createTransaction(captor.capture());

        CreateTransactionRequest request = captor.getValue();
        assertEquals(new BigDecimal("450"), request.amount());
        assertEquals(TransactionType.EXPENSE, request.type());
        assertEquals(1L, request.categoryId());
        assertEquals("lunch", request.description());
        assertEquals(fixedToday.minusDays(1), request.transactionDate());
    }
}
