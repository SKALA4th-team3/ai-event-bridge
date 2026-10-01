package com.autograph.performance.api;

import java.math.BigDecimal;

/** enrollment-service/user-service에서 그대로 가져온 실제 지원 현황. 금액 외 항목을 추정/가공하지 않는다. */
public record RealBid(String companyName, BigDecimal bidAmount, String proposal, String status) {}
