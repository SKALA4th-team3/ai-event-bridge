package com.autograph.performance.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class EventPerformanceControllerTest {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Test
    void returnsTwentyHistoricalYearsThreeRegressionsAndThreeInitialBids() throws Exception {
        mockMvc.perform(get("/api/events/101/performance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.eventId").value(101))
                .andExpect(jsonPath("$.history.length()").value(20))
                .andExpect(jsonPath("$.history[0].year").value(2006))
                .andExpect(jsonPath("$.history[19].year").value(2025))
                .andExpect(jsonPath("$.history[19].forecast").value(false))
                .andExpect(jsonPath("$.visitorRegression.rSquared").isNumber())
                .andExpect(jsonPath("$.costRegression.rSquared").isNumber())
                .andExpect(jsonPath("$.netProfitRegression.rSquared").isNumber())
                .andExpect(jsonPath("$.visitorRegression.trend.length()").value(21))
                .andExpect(jsonPath("$.bids.length()").value(3));
    }

    @Test
    void postedBidIsCalculatedAndIncludedInNextQuery() throws Exception {
        BidRequest request = new BidRequest("SK 이벤트", 420_000_000L, 900_000_000L, 100_000_000L);
        mockMvc.perform(post("/api/events/777/bids")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.expectedProfit").value(380_000_000L))
                .andExpect(jsonPath("$.roi").value(90.5))
                .andExpect(jsonPath("$.expectedVisitors").doesNotExist());

        mockMvc.perform(get("/api/events/777/performance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bids.length()").value(4))
                .andExpect(jsonPath("$.bids[3].companyName").value("SK 이벤트"));
    }
}
