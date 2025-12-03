package com.valorant.store.service;

import com.valorant.store.dto.OrderRequest;
import com.valorant.store.model.Order;
import com.valorant.store.model.OrderItem;
import com.valorant.store.model.User;
import com.valorant.store.repository.OrderRepository;
import com.valorant.store.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public Order createOrder(OrderRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Order order = new Order();
        order.setUser(user);
        order.setStatus(Order.OrderStatus.PENDING);

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (OrderRequest.OrderItemRequest itemRequest : request.getItems()) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setAgentId(itemRequest.getAgentId());
            orderItem.setAgentName(itemRequest.getAgentName());
            orderItem.setQuantity(itemRequest.getQuantity());
            orderItem.setPrice(BigDecimal.valueOf(itemRequest.getPrice()));
            orderItem.setSubtotal(
                    BigDecimal.valueOf(itemRequest.getPrice()).multiply(BigDecimal.valueOf(itemRequest.getQuantity()))
            );

            totalAmount = totalAmount.add(orderItem.getSubtotal());
            order.getItems().add(orderItem);
        }

        order.setTotalAmount(totalAmount);
        return orderRepository.save(order);
    }

    public List<Order> getUserOrders() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return orderRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public Order getOrderById(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }
}
