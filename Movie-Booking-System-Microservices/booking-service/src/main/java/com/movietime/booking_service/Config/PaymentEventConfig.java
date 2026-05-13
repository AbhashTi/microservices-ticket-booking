package com.movietime.booking_service.Config;

import org.springframework.amqp.core.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PaymentEventConfig {
    public static final String PAYMENT_EXCHANGE    = "payment.exchange";
    public static final String PAYMENT_QUEUE       = "payment.success.queue";
    public static final String PAYMENT_ROUTING_KEY = "payment.success";

    @Bean
    public TopicExchange paymentExchange() { return new TopicExchange(PAYMENT_EXCHANGE); }

    @Bean
    public Queue paymentQueue() { return new Queue(PAYMENT_QUEUE, true); }

    @Bean
    public Binding paymentBinding(@Qualifier("paymentQueue") Queue paymentQueue,
                                  @Qualifier("paymentExchange") TopicExchange paymentExchange) {
        return BindingBuilder.bind(paymentQueue).to(paymentExchange).with(PAYMENT_ROUTING_KEY);
    }
}