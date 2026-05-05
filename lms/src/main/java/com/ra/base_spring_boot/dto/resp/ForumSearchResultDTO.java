package com.ra.base_spring_boot.dto.resp;

import lombok.Getter;
import lombok.Setter;

@Setter @Getter
public class ForumSearchResultDTO {
    private Object result;
    private ResultType type;
    private Double score;

    public enum ResultType {
        TOPIC, POST
    }
}
