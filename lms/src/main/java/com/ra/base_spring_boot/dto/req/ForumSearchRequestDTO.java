package com.ra.base_spring_boot.dto.req;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.domain.Pageable;

@Getter @Setter
public class ForumSearchRequestDTO {
    private String keyword;
    private Long classId;
    private SearchType searchType = SearchType.ALL;
    private String authorName;
    private Boolean pinned;
    private Pageable pageable;

    public enum SearchType {
        TOPICS, POSTS, ALL
    }
}
