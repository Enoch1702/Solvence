package com.solvence.service;

import com.solvence.dto.CategoryResponse;
import com.solvence.repository.CategoryRepository;
import com.solvence.security.CurrentUserProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final CurrentUserProvider currentUserProvider;

    public CategoryService(CategoryRepository categoryRepository, CurrentUserProvider currentUserProvider) {
        this.categoryRepository = categoryRepository;
        this.currentUserProvider = currentUserProvider;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAccessibleCategories() {
        Long currentUserId = currentUserProvider.getCurrentUserId();
        return categoryRepository.findAccessibleCategories(currentUserId)
                .stream()
                .map(CategoryResponse::fromEntity)
                .toList();
    }
}
