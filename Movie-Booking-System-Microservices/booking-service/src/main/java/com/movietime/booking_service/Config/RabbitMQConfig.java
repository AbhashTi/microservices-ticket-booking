package com.movietime.booking_service.Config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class RabbitMQConfig {
    public static final String BOOKING_EXCHANGE = "booking.exchange";
    public static final String BOOKING_QUEUE    = "booking.notifications";
    public static final String BOOKING_ROUTING_KEY = "booking.confirmed";

    @Bean @Primary
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory cf, MessageConverter messageConverter) {
        RabbitTemplate t = new RabbitTemplate(cf);
        t.setMessageConverter(messageConverter);
        return t;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory cf, MessageConverter messageConverter) {
        SimpleRabbitListenerContainerFactory f = new SimpleRabbitListenerContainerFactory();
        f.setConnectionFactory(cf);
        f.setMessageConverter(messageConverter);
        return f;
    }

    @Bean
    public TopicExchange exchange() { return new TopicExchange(BOOKING_EXCHANGE); }

    @Bean
    public Queue queue() { return new Queue(BOOKING_QUEUE, true); }

    @Bean
    public Binding binding(@Qualifier("queue") Queue queue,
                           @Qualifier("exchange") TopicExchange exchange) {
        return BindingBuilder.bind(queue).to(exchange).with(BOOKING_ROUTING_KEY);
    }
}