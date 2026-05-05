package com.ra.base_spring_boot.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;


@Configuration
@Slf4j
public class AwsS3Config {

    @Value("${r2.region:${aws.region:auto}}")
    private String region;

    @Value("${r2.endpoint}")
    private String endpoint;

    @Value("${r2.account-id:}")
    private String accountId;

    @Value("${r2.credentials.access-key:}")
    private String accessKey;

    @Value("${r2.credentials.secret-key:}")
    private String secretKey;

    private StaticCredentialsProvider credentialsProvider() {
        if (accessKey != null && !accessKey.isEmpty() && secretKey != null && !secretKey.isEmpty()) {
            AwsCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);
            return StaticCredentialsProvider.create(credentials);
        }

        return null;
    }

    private URI resolvedEndpoint() {
        if (endpoint != null && !endpoint.isBlank()) {
            return URI.create(endpoint.trim());
        }

        if (accountId != null && !accountId.isBlank()) {
            return URI.create("https://" + accountId.trim() + ".r2.cloudflarestorage.com");
        }

        throw new IllegalStateException("Either r2.endpoint or r2.account-id must be configured");
    }


    @Bean
    public S3Client s3Client() {
        try {
            var builder = S3Client.builder()
                    .region(Region.of(region))
                    .endpointOverride(resolvedEndpoint())
                    .serviceConfiguration(S3Configuration.builder()
                            .pathStyleAccessEnabled(true)
                            .build());

            StaticCredentialsProvider credentials = credentialsProvider();
            if (credentials != null) {
                builder.credentialsProvider(credentials);
                log.info("R2 S3Client configured with explicit credentials for region: {}", region);
            } else {
                log.info("R2 S3Client configured with default credential chain for region: {}", region);
            }

            return builder.build();
        } catch (Exception e) {
            log.error("Failed to create R2 S3Client: {}", e.getMessage());
            throw new RuntimeException("R2 configuration failed", e);
        }
    }

    @Bean
    public S3Presigner s3Presigner() {
        try {
            var builder = S3Presigner.builder()
                    .region(Region.of(region))
                    .endpointOverride(resolvedEndpoint())
                    .serviceConfiguration(S3Configuration.builder()
                            .pathStyleAccessEnabled(true)
                            .build());

            StaticCredentialsProvider credentials = credentialsProvider();
            if (credentials != null) {
                builder.credentialsProvider(credentials);
            }

            return builder.build();
        } catch (Exception e) {
            log.error("Failed to create R2 S3Presigner: {}", e.getMessage());
            throw new RuntimeException("R2 presigner configuration failed", e);
        }
    }
}