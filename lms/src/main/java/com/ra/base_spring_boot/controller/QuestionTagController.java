package com.ra.base_spring_boot.controller;


import com.ra.base_spring_boot.dto.QuestionTagDTO;
import com.ra.base_spring_boot.dto.ResponseWrapper;
import com.ra.base_spring_boot.exception.HttpNotFound;
import com.ra.base_spring_boot.model.QuestionTag;
import com.ra.base_spring_boot.services.IQuestionBankService;
import com.ra.base_spring_boot.services.IQuestionTagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/question-tags")
@RequiredArgsConstructor
public class QuestionTagController {

    private final IQuestionTagService questionTagService;
    private final IQuestionBankService questionBankService;


    @GetMapping
    public ResponseEntity<ResponseWrapper<List<QuestionTag>>> getAllTag() {
        List<QuestionTag> tags = questionTagService.getAllTag();
        return ResponseEntity.ok(ResponseWrapper.<List<QuestionTag>>builder()
                .status(HttpStatus.OK)
                .data(tags)
                .message("Tags retrieved successfully")
                .build());
    }

    @GetMapping("/paginated")
    public ResponseEntity<ResponseWrapper<Page<QuestionTag>>> getAllTagsPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "tagName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection) {
        Sort sort = sortDirection.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<QuestionTag> tags = questionTagService.findAllTags(pageable);
        return ResponseEntity.ok(ResponseWrapper.<Page<QuestionTag>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Tags retrieved successfully")
                .data(tags)
                .build());
    }
    @GetMapping("/{tagId}")
    public ResponseEntity<ResponseWrapper<QuestionTag>> getTagById(@PathVariable Integer tagId) {
        QuestionTag questionTag = questionTagService.getTagById(tagId)
                .orElseThrow(() -> new HttpNotFound("Tag not found with id: " + tagId + " !"));
        return ResponseEntity.ok(ResponseWrapper.<QuestionTag>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Tag retrieved successfully")
                .data(questionTag)
                .build());
    }

    @GetMapping("/name/{tagName}")
    public ResponseEntity<ResponseWrapper<QuestionTag>> getTagByName(@PathVariable String tagName) {
        QuestionTag questionTag = questionTagService.getTagByName(tagName)
                .orElseThrow(() -> new HttpNotFound("Tag not found with name: " + tagName + " !"));
        return ResponseEntity.ok(ResponseWrapper.<QuestionTag>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Tag retrieved successfully")
                .data(questionTag)
                .build());
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<ResponseWrapper<QuestionTag>> createTag(@Valid @RequestBody QuestionTagDTO questionTagDTO) {
        QuestionTag questionTag = QuestionTag.builder()
                .tagName(questionTagDTO.getTagName())
                .description(questionTagDTO.getDescription())
                .build();        QuestionTag createdTag = questionTagService.createTag(questionTag);
        return ResponseEntity.ok(ResponseWrapper.<QuestionTag>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Tag created successfully")
                .data(createdTag)
                .build());
    }

    @PutMapping("/{tagId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<ResponseWrapper<QuestionTag>> updateTag(
            @PathVariable Integer tagId,
            @Valid @RequestBody QuestionTagDTO tagDTO) {
        QuestionTag tag = QuestionTag.builder()
                .tagName(tagDTO.getTagName())
                .description(tagDTO.getDescription())
                .build();
        QuestionTag updateTag = questionTagService.updateTag(tagId, tag);
        return ResponseEntity.ok(ResponseWrapper.<QuestionTag>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Tag updated successfully")
                .data(updateTag)
                .build());
    }

    @DeleteMapping("/{tagId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<ResponseWrapper<Void>> deleteTag(@PathVariable Integer tagId) {
        questionTagService.deleteTag(tagId);
        return ResponseEntity.ok(ResponseWrapper.<Void>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Tag deleted successfully")
                .build());
    }

    @GetMapping("/search")
    public ResponseEntity<ResponseWrapper<List<QuestionTag>>> searchTags(@RequestParam String name) {
        List<QuestionTag> tags = questionTagService.searchTagsByName(name);
        return ResponseEntity.ok(ResponseWrapper.<List<QuestionTag>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Tag retrieved successfully")
                .build());
    }

    @GetMapping("/exists/{tagName}")
    public ResponseEntity<ResponseWrapper<Boolean>> checkTagExists(@PathVariable String tagName) {
        boolean exits = questionTagService.existsByTagName(tagName);
        return ResponseEntity.ok(ResponseWrapper.<Boolean>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Tag existence checked successfully")
                .data(exits)
                .build());
    }


    @GetMapping("/question/{questionId}")
    public ResponseEntity<ResponseWrapper<List<QuestionTag>>> getTagsByQuestionId(@PathVariable Integer questionId) {
        List<QuestionTag> tags = questionTagService.getTagsByQuestionId(questionId);
        return ResponseEntity.ok(ResponseWrapper.<List<QuestionTag>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Tag retrieved successfully")
                .data(tags)
                .build());
    }

    @PostMapping("/question/{questionId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<ResponseWrapper<List<QuestionTag>>> addTagsToQuestion(
            @PathVariable Integer questionId,
            @RequestBody List<Integer> tagIds) {
        List<QuestionTag> updatedTags = questionBankService.addTagsToQuestion(questionId, tagIds);
        return ResponseEntity.ok(ResponseWrapper.<List<QuestionTag>>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Tags added to question successfully")
                .data(updatedTags)
                .build());
    }


    @DeleteMapping("/question/{questionId}/tag/{tagId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<ResponseWrapper<Void>> removeTagFromQuestion(
            @PathVariable Integer questionId,
            @PathVariable Integer tagId) {
        questionBankService.removeTagsFromQuestion(questionId, List.of(tagId));
        return ResponseEntity.ok(ResponseWrapper.<Void>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Tag removed from question successfully")
                .build());
    }


    @DeleteMapping("/question/{questionId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MODERATOR')")
    public ResponseEntity<ResponseWrapper<Void>> removeTagsFromQuestion(
            @PathVariable Integer questionId,
            @RequestBody List<Integer> tagIds) {
        questionBankService.removeTagsFromQuestion(questionId, tagIds);
        return ResponseEntity.ok(ResponseWrapper.<Void>builder()
                .status(HttpStatus.OK)
                .code(HttpStatus.OK.value())
                .message("Tags removed from question successfully")
                .build());
    }
}
