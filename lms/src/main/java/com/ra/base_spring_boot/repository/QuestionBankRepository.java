package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.QuestionBank;
import com.ra.base_spring_boot.model.constants.Difficulty;
import com.ra.base_spring_boot.model.constants.QuestionStatus;
import com.ra.base_spring_boot.model.constants.QuestionType;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Set;

@Repository
public interface QuestionBankRepository extends JpaRepository<QuestionBank, Integer> {

    Page<QuestionBank> findByStatus(QuestionStatus status, Pageable pageable);
    List<QuestionBank> findByCreatedById(Integer userId);

    Page<QuestionBank> findByDifficultyAndStatus(Difficulty difficulty, QuestionStatus status, Pageable pageable);

    @Query("SELECT q FROM QuestionBank q JOIN q.tags t WHERE t.tagId IN :tagIds AND q.status = :status")
    Page<QuestionBank> findByTagIdsAndStatus(@Param("tagIds") Set<Integer> tagIds,
                                             @Param("status") QuestionStatus status,
                                             Pageable pageable);

    @Query("SELECT q FROM QuestionBank q WHERE " +
            "LOWER(q.questionText) LIKE LOWER(CONCAT('%', :keyword, '%')) AND " +
            "q.status = :status")
    Page<QuestionBank> searchByKeyword(@Param("keyword") String keyword,
                                       @Param("status") QuestionStatus status,
                                       Pageable pageable);

    @Query("SELECT qb FROM QuestionBank qb WHERE " +
            "(:keyword IS NULL OR LOWER(qb.questionText) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
            "(:questionType IS NULL OR qb.questionType = :questionType)")
    Page<QuestionBank> searchByKeywordAndType(
            @Param("keyword") String keyword,
            @Param("questionType") QuestionType questionType,
            Pageable pageable
    );

    @Query("SELECT COUNT(q) FROM QuestionBank q WHERE q.createdBy.id = :userId")
    long countByUser(@Param("userId") Integer userId);
}