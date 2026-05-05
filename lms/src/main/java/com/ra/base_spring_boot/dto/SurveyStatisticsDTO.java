package com.ra.base_spring_boot.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SurveyStatisticsDTO {

    private Integer surveyId;
    private String surveyTitle;
    private Integer classId;
    private Integer questionId;
    private String questionText;
    private String questionType;
    private Map<String, Integer> optionCounts; // map option -> số lần chọn
    private Integer totalResponses;

    // Nếu muốn dùng kiểu OptionStat, có thể giữ
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OptionStat {
        private String optionValue; // giá trị option
        private Long count;         // số lần chọn
    }
}
