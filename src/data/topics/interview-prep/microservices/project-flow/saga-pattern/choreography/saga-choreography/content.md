# Saga — Choreography (Decentralized)

In choreography, each service reacts to domain events and publishes the next event without a central workflow coordinator.

## Flow screen

```text
Order Created
     |
     v
Order Service --OrderCreated--> Payment
                                  |
                           PaymentCompleted
                                  |
                                  v
                              Inventory
                                  |
                           InventoryReserved
                                  |
                                  v
                            Order Completed
```

<details>
<summary>How does Saga choreography maintain a multi-service business workflow?</summary>

### Answer
Each service owns its local transaction and emits an event when its state changes. Other services subscribe and perform their own local transaction. Failures trigger compensating events/actions rather than a distributed database transaction.

> **Note — what the interviewer is expecting:**
> Explain local transactions, event contracts, eventual consistency, compensation, and the risk of implicit workflow coupling.

</details>

<details>
<summary>What is the biggest risk of choreography as the workflow grows?</summary>

### Answer
The workflow can become difficult to understand because behavior is distributed across event handlers. Event chains can create hidden coupling, difficult debugging, and complicated compensation paths.

> **Note — what the interviewer is expecting:**
> Recognize the operational and cognitive cost, not only the benefit of loose coupling.

</details>
