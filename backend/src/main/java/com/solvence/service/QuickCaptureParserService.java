package com.solvence.service;

import com.solvence.dto.CreateTransactionRequest;
import com.solvence.dto.ParsedQuickCapture;
import com.solvence.dto.TransactionResponse;
import com.solvence.entity.Category;
import com.solvence.entity.TransactionType;
import com.solvence.exception.BusinessValidationException;
import com.solvence.repository.CategoryRepository;
import com.solvence.security.CurrentUserProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class QuickCaptureParserService {

    private static final Pattern NUMERIC_AMOUNT_PATTERN =
            Pattern.compile("^([₹$€£]|INR|Rs\\.?\\s*)?(\\d{1,3}(,\\d{3})*|\\d+)(\\.\\d{1,2})?$", Pattern.CASE_INSENSITIVE);

    private static final Set<String> UNSUPPORTED_DATE_KEYWORDS = Set.of(
            "tomorrow", "nextish", "someday", "later", "nextweek", "nextmonth"
    );

    private final CategoryRepository categoryRepository;
    private final CurrentUserProvider currentUserProvider;
    private final TransactionService transactionService;
    private final Clock clock;

    public QuickCaptureParserService(CategoryRepository categoryRepository,
                                     CurrentUserProvider currentUserProvider,
                                     TransactionService transactionService,
                                     Clock clock) {
        this.categoryRepository = categoryRepository;
        this.currentUserProvider = currentUserProvider;
        this.transactionService = transactionService;
        this.clock = clock;
    }

    /**
     * Parses a natural-language-like quick capture command deterministically.
     */
    public ParsedQuickCapture parse(String input) {
        if (input == null || input.trim().isEmpty()) {
            throw new BusinessValidationException("Command input cannot be empty.");
        }

        String trimmed = input.trim();
        if (trimmed.length() > 255) {
            throw new BusinessValidationException("Command input must not exceed 255 characters.");
        }

        String normalized = trimmed.replaceAll("\\s+", " ");
        List<String> tokens = new ArrayList<>(Arrays.asList(normalized.split(" ")));

        // 1. Transaction Type Detection
        TransactionType type = TransactionType.EXPENSE;
        Iterator<String> typeIterator = tokens.iterator();
        while (typeIterator.hasNext()) {
            String token = typeIterator.next();
            if (token.equalsIgnoreCase("income")) {
                type = TransactionType.INCOME;
                typeIterator.remove();
                break;
            } else if (token.equalsIgnoreCase("expense")) {
                type = TransactionType.EXPENSE;
                typeIterator.remove();
                break;
            }
        }

        // 2. Amount Detection
        BigDecimal amount = null;
        String amountTokenToRemove = null;

        for (String token : tokens) {
            if (NUMERIC_AMOUNT_PATTERN.matcher(token).matches()) {
                String clean = token.replaceAll("[₹$€£,]|(?i)INR|(?i)Rs\\.?\\s*", "").trim();
                try {
                    BigDecimal parsed = new BigDecimal(clean);
                    if (amount != null) {
                        throw new BusinessValidationException("Ambiguous command: multiple amounts detected.");
                    }
                    amount = parsed;
                    amountTokenToRemove = token;
                } catch (NumberFormatException ignored) {
                    // Not a valid number
                }
            }
        }

        if (amount == null) {
            throw new BusinessValidationException("Enter an amount to record the transaction.");
        }
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessValidationException("Amount must be greater than zero.");
        }
        tokens.remove(amountTokenToRemove);

        // 3. Date Detection
        LocalDate today = LocalDate.now(clock);
        LocalDate transactionDate = today;
        String dateTokenToRemove = null;

        for (String token : tokens) {
            String lower = token.toLowerCase(Locale.ROOT);
            if (lower.equals("today")) {
                transactionDate = today;
                dateTokenToRemove = token;
                break;
            } else if (lower.equals("yesterday")) {
                transactionDate = today.minusDays(1);
                dateTokenToRemove = token;
                break;
            } else if (UNSUPPORTED_DATE_KEYWORDS.contains(lower) || lower.startsWith("next")) {
                throw new BusinessValidationException("Quick Capture could not understand the date expression '" + token + "'.");
            }
        }
        if (dateTokenToRemove != null) {
            tokens.remove(dateTokenToRemove);
        }

        // 4. Category Resolution (strictly scoped to accessible categories)
        Long currentUserId = currentUserProvider.getCurrentUserId();
        List<Category> accessibleCategories = categoryRepository.findAccessibleCategories(currentUserId);

        Category matchedCategory = null;
        String categoryTokenToRemove = null;

        // Match single-token categories
        for (String token : tokens) {
            String lower = token.toLowerCase(Locale.ROOT);
            for (Category cat : accessibleCategories) {
                if (cat.getName().equalsIgnoreCase(lower) || cat.getSlug().equalsIgnoreCase(lower)) {
                    if (matchedCategory != null && !matchedCategory.getId().equals(cat.getId())) {
                        throw new BusinessValidationException("Ambiguous command: multiple categories detected.");
                    }
                    matchedCategory = cat;
                    categoryTokenToRemove = token;
                }
            }
        }

        // Also attempt 2-token category names if not matched (e.g. "dining out")
        if (matchedCategory == null && tokens.size() >= 2) {
            for (int i = 0; i < tokens.size() - 1; i++) {
                String candidate = (tokens.get(i) + " " + tokens.get(i + 1)).toLowerCase(Locale.ROOT);
                for (Category cat : accessibleCategories) {
                    if (cat.getName().equalsIgnoreCase(candidate) || cat.getSlug().equalsIgnoreCase(candidate)) {
                        matchedCategory = cat;
                        tokens.remove(i + 1);
                        tokens.remove(i);
                        break;
                    }
                }
                if (matchedCategory != null) {
                    break;
                }
            }
        } else if (categoryTokenToRemove != null) {
            tokens.remove(categoryTokenToRemove);
        }

        if (matchedCategory == null) {
            throw new BusinessValidationException("Could not match any available category. Please specify a category like Food, Transport, Rent, or Utilities.");
        }

        // 5. Description Construction
        String description;
        if (tokens.isEmpty()) {
            description = matchedCategory.getName();
        } else {
            description = String.join(" ", tokens);
            if (description.length() > 255) {
                description = description.substring(0, 255).trim();
            }
        }

        return new ParsedQuickCapture(amount, type, matchedCategory, description, transactionDate);
    }

    /**
     * Parses the command and creates the transaction through the existing TransactionService.
     */
    @Transactional
    public TransactionResponse parseAndCreate(String input) {
        ParsedQuickCapture parsed = parse(input);

        CreateTransactionRequest request = new CreateTransactionRequest(
                parsed.amount(),
                parsed.type(),
                parsed.category().getId(),
                parsed.description(),
                parsed.transactionDate()
        );

        return transactionService.createTransaction(request);
    }
}
