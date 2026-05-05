package com.ra.base_spring_boot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
@EnableScheduling  // Thêm annotation này
public class BaseSpringBootApplication
{

    public static void main(String[] args)
    {
        SpringApplication.run(BaseSpringBootApplication.class, args);
    }

}
