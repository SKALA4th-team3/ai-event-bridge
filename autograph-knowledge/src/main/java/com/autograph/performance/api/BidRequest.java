package com.autograph.performance.api;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BidRequest(
        @NotBlank @Size(max = 100) String companyName,
        @Min(0) long bidAmount,
        @Min(0) long expectedRevenue,
        @Min(0) long otherCost
) {}
